-- =======================================================
-- Supabase Row Level Security (RLS) Configuration
-- =======================================================

-- 1. Enable RLS on all critical tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for authenticated users
-- Allow users to read all products (assuming products are global)
CREATE POLICY "Allow public read access to products" 
ON products FOR SELECT 
USING (true);

-- Allow authenticated admins to insert/update products
CREATE POLICY "Allow authenticated admins to modify products" 
ON products FOR ALL 
TO authenticated 
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- 3. Orders Security (Tenancy/User isolation)
-- Allow cashiers to see only orders they created (or admins see all)
CREATE POLICY "Users can view their own orders" 
ON orders FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Allow users to insert their own orders
CREATE POLICY "Users can insert their own orders" 
ON orders FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 4. Order Items Security
CREATE POLICY "Users can view their own order items"
ON order_items FOR SELECT
TO authenticated
USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid() OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin')));

-- 5. Rate Limiting Example (via Supabase Edge Functions or PostgREST)
-- Supabase handles basic rate limiting at the API Gateway level.
-- Ensure that your API keys are protected and not exposed in public repositories without RLS enabled.
