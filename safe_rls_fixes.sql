-- SECURITY FIXES FOR LIVE DATABASE
-- Run this in your Supabase SQL Editor

-- 1. HARDEN BOOKER LOCATIONS
-- Drop the dangerous open policy if it exists
DROP POLICY IF EXISTS "Allow all operations on booker_locations" ON public.booker_locations;
DROP POLICY IF EXISTS "Authenticated users can view locations" ON public.booker_locations;
DROP POLICY IF EXISTS "Bookers can upsert own location" ON public.booker_locations;
DROP POLICY IF EXISTS "Bookers can update own location" ON public.booker_locations;

-- Enable RLS
ALTER TABLE public.booker_locations ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated (Admins/Bookers) to SELECT locations
CREATE POLICY "Authenticated users can view locations"
  ON public.booker_locations FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow inserting/updating for authenticated users
CREATE POLICY "Authenticated users can insert locations"
  ON public.booker_locations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update locations"
  ON public.booker_locations FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- 2. SECURE THE ORDERS TABLE
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read and insert orders
DROP POLICY IF EXISTS "Authenticated users can view orders" ON public.orders;
CREATE POLICY "Authenticated users can view orders"
  ON public.orders FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.orders;
CREATE POLICY "Authenticated users can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;
CREATE POLICY "Authenticated users can update orders"
  ON public.orders FOR UPDATE
  USING (auth.role() = 'authenticated');


-- 3. SECURE THE BOOKERS TABLE
ALTER TABLE public.bookers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view bookers" ON public.bookers;
CREATE POLICY "Authenticated users can view bookers"
  ON public.bookers FOR SELECT
  USING (auth.role() = 'authenticated');

-- 4. SECURE THE PRODUCTS TABLE
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
CREATE POLICY "Authenticated users can view products"
  ON public.products FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
CREATE POLICY "Authenticated users can manage products"
  ON public.products FOR ALL
  USING (auth.role() = 'authenticated');
