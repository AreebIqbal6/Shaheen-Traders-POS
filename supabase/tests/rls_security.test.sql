BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Plan the number of tests
SELECT plan(8);

-- Setup: Create dummy users for testing
-- We use a raw SQL block because we need deterministic UUIDs for our tests
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001') THEN
    INSERT INTO auth.users (id, instance_id, role, aud, email, encrypted_password, created_at, updated_at) 
    VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user_a@test.com', 'dummy', now(), now());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000002') THEN
    INSERT INTO auth.users (id, instance_id, role, aud, email, encrypted_password, created_at, updated_at) 
    VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user_b@test.com', 'dummy', now(), now());
  END IF;
END $$;

-- Switch to postgres role to insert test data bypassing RLS
SET role postgres;

-- Insert dummy data owned by User A
INSERT INTO public.orders (id, receipt_number, idempotency_key, booker_id, client_name, total_amount)
VALUES (
  '11111111-1111-1111-1111-111111111111', 
  'TEST-REC-A', 
  '11111111-1111-1111-1111-111111111111', 
  '00000000-0000-0000-0000-000000000001', -- User A
  'Test Client A', 
  100.00
) ON CONFLICT DO NOTHING;

-- Context 1: Unauthenticated User (anon)
SET role anon;

SELECT is_empty(
    'SELECT id FROM public.orders',
    'Unauthenticated users (anon) should not see any orders'
);

SELECT throws_ok(
    $$ INSERT INTO public.orders (receipt_number, idempotency_key, client_name, total_amount) VALUES ('TEST-ANON', gen_random_uuid(), 'Anon Client', 50.00) $$,
    'new row violates row-level security policy for table "orders"',
    'Unauthenticated users (anon) cannot insert orders'
);


-- Context 2: Authenticated Standard User (User B)
SET role authenticated;
-- Impersonate User B
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
SET request.jwt.claim.role = 'authenticated';

SELECT is_empty(
    'SELECT id FROM public.orders WHERE id = ''11111111-1111-1111-1111-111111111111''',
    'User B should NOT be able to view User A''s order (IDOR check)'
);

SELECT results_eq(
    $$ UPDATE public.orders SET total_amount = 999.00 WHERE id = '11111111-1111-1111-1111-111111111111' RETURNING id $$,
    $$ VALUES (NULL::uuid) LIMIT 0 $$,
    'User B should NOT be able to update User A''s order (Silent RLS failure)'
);

SELECT results_eq(
    $$ DELETE FROM public.orders WHERE id = '11111111-1111-1111-1111-111111111111' RETURNING id $$,
    $$ VALUES (NULL::uuid) LIMIT 0 $$,
    'User B should NOT be able to delete User A''s order (Silent RLS failure)'
);


-- Context 3: Target Resource Owner (User A)
SET role authenticated;
-- Impersonate User A
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';

SELECT isnt_empty(
    'SELECT id FROM public.orders WHERE id = ''11111111-1111-1111-1111-111111111111''',
    'User A SHOULD be able to view their own order'
);

SELECT lives_ok(
    $$ UPDATE public.orders SET total_amount = 150.00 WHERE id = '11111111-1111-1111-1111-111111111111' $$,
    'User A SHOULD be able to update their own order'
);

-- Clean up
SET role postgres;
DELETE FROM public.orders WHERE id = '11111111-1111-1111-1111-111111111111';

-- Finish tests
SELECT * FROM finish();
ROLLBACK;
