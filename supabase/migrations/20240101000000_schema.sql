-- ==============================================================================
-- SHAHEEN TRADERS B2B ERP: SUPABASE SCHEMA & SECURE RLS ARCHITECTURE
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLES
-- ==============================================================================

-- USERS (Mirrors Supabase Auth but stores custom claims/roles)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('booker', 'admin', 'cashier')),
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTS
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barcode TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_base_pieces NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    -- CRITICAL: Prevent Race Conditions & LPDoS by forcing non-negative stock at the database level
    CONSTRAINT check_stock_positive CHECK (total_base_pieces >= 0)
);

-- PRODUCT BARCODES (For UOM Mapping)
CREATE TABLE public.product_barcodes (
    barcode TEXT PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    uom TEXT NOT NULL CHECK (uom IN ('Pieces', 'Boxes', 'Cartons')),
    multiplier NUMERIC(10, 2) NOT NULL DEFAULT 1.00
);

-- ORDERS
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number TEXT UNIQUE NOT NULL,
    idempotency_key UUID UNIQUE NOT NULL, -- CRITICAL: Prevent Replay Attacks from offline clients
    booker_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'dispatched',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDER ITEMS
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity NUMERIC(10, 2) NOT NULL,
    uom TEXT NOT NULL,
    price_at_sale NUMERIC(10, 2) NOT NULL
);


-- 2. ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Admins: Full Access
CREATE POLICY "Admins have full access to everything" ON public.products
    FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "Admins have full access to orders" ON public.orders
    FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );

-- Bookers: SELECT Inventory, INSERT Orders
CREATE POLICY "Bookers can view products" ON public.products
    FOR SELECT USING ( (SELECT role FROM public.users WHERE id = auth.uid()) IN ('booker', 'admin') );

CREATE POLICY "Bookers can insert orders" ON public.orders
    FOR INSERT WITH CHECK ( (SELECT role FROM public.users WHERE id = auth.uid()) IN ('booker', 'admin') );

CREATE POLICY "Bookers can view own orders" ON public.orders
    FOR SELECT USING ( auth.uid() = booker_id );

CREATE POLICY "Bookers can insert order items" ON public.order_items
    FOR INSERT WITH CHECK ( 
        EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND booker_id = auth.uid()) 
    );

-- Bookers can view items from their own orders
CREATE POLICY "Bookers can view own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND booker_id = auth.uid())
    );

-- Admins have full access to order items
CREATE POLICY "Admins full access to order items" ON public.order_items
    FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );

-- Product Barcodes: Readable by authenticated, writable by admins
CREATE POLICY "Authenticated can read barcodes" ON public.product_barcodes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage barcodes" ON public.product_barcodes
    FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );

-- Users: Read own profile only
CREATE POLICY "Users can read own profile" ON public.users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can read all users" ON public.users
    FOR SELECT USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );


-- 3. REMOTE PROCEDURE CALL (RPC) for Transaction Integrity
-- ==============================================================================
-- Safely processes an offline-first order payload, decrements stock atomically, and handles idempotency
CREATE OR REPLACE FUNCTION process_order_transaction(payload JSON)
RETURNS JSON AS $$
DECLARE
    v_order_id UUID;
    v_item RECORD;
    v_total_deduction NUMERIC;
    v_caller_role TEXT;
BEGIN
    -- SECURITY: Verify caller is an authenticated booker or admin
    SELECT role INTO v_caller_role FROM public.users WHERE id = auth.uid();
    IF v_caller_role IS NULL OR v_caller_role NOT IN ('booker', 'admin') THEN
        RETURN json_build_object('success', false, 'error', 'ERR_UNAUTHORIZED: Caller is not authorized.');
    END IF;

    -- 1. Idempotency Check: Did we already process this offline sync?
    IF EXISTS (SELECT 1 FROM public.orders WHERE idempotency_key = (payload->>'idempotency_key')::UUID) THEN
        RETURN json_build_object('success', false, 'error', 'Idempotency key already exists. Duplicate ignored.');
    END IF;

    -- 2. Insert Order (SECURITY: force booker_id to auth.uid(), never trust client payload)
    INSERT INTO public.orders (receipt_number, idempotency_key, booker_id, client_name, total_amount)
    VALUES (
        payload->>'receipt_number',
        (payload->>'idempotency_key')::UUID,
        auth.uid(),
        payload->>'client_name',
        (payload->>'total_amount')::NUMERIC
    ) RETURNING id INTO v_order_id;

    -- 3. Process Items & Atomically Decrement Stock
    FOR v_item IN SELECT * FROM json_populate_recordset(null::record, payload->'items') AS (
        product_id UUID, quantity NUMERIC, uom TEXT, multiplier NUMERIC, price NUMERIC
    )
    LOOP
        -- SECURITY: Validate quantity and multiplier are strictly positive
        IF v_item.quantity <= 0 OR v_item.multiplier <= 0 THEN
            RAISE EXCEPTION 'Invalid quantity or multiplier: must be positive';
        END IF;

        v_total_deduction := v_item.quantity * v_item.multiplier;

        -- Attempt to decrement stock. If total_base_pieces drops below 0, the CHECK constraint aborts
        UPDATE public.products 
        SET total_base_pieces = total_base_pieces - v_total_deduction
        WHERE id = v_item.product_id;

        -- Record the item
        INSERT INTO public.order_items (order_id, product_id, quantity, uom, price_at_sale)
        VALUES (v_order_id, v_item.product_id, v_item.quantity, v_item.uom, v_item.price);
    END LOOP;

    RETURN json_build_object('success', true, 'order_id', v_order_id);
EXCEPTION
    WHEN check_violation THEN
        RETURN json_build_object('success', false, 'error_code', 'ERR_INSUFFICIENT_STOCK', 'error', 'Insufficient stock! Race condition prevented.');
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error_code', 'ERR_UNKNOWN', 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
