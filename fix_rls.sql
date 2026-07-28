-- REVERT RLS POLICIES TO ALLOW ANON ACCESS
-- Run this in your Supabase SQL Editor immediately

-- 1. FIX BOOKER LOCATIONS
ALTER TABLE public.booker_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view locations" ON public.booker_locations;
CREATE POLICY "Anon users can view locations" ON public.booker_locations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert locations" ON public.booker_locations;
CREATE POLICY "Anon users can insert locations" ON public.booker_locations FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update locations" ON public.booker_locations;
CREATE POLICY "Anon users can update locations" ON public.booker_locations FOR UPDATE USING (true) WITH CHECK (true);

-- 2. FIX ORDERS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view orders" ON public.orders;
CREATE POLICY "Anon users can view orders" ON public.orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.orders;
CREATE POLICY "Anon users can insert orders" ON public.orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;
CREATE POLICY "Anon users can update orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);

-- 3. FIX BOOKERS
ALTER TABLE public.bookers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view bookers" ON public.bookers;
CREATE POLICY "Anon users can view bookers" ON public.bookers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anon users can insert bookers" ON public.bookers;
CREATE POLICY "Anon users can insert bookers" ON public.bookers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anon users can update bookers" ON public.bookers;
CREATE POLICY "Anon users can update bookers" ON public.bookers FOR UPDATE USING (true) WITH CHECK (true);

-- 4. FIX PRODUCTS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
CREATE POLICY "Anon users can view products" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
CREATE POLICY "Anon users can manage products" ON public.products FOR ALL USING (true);
