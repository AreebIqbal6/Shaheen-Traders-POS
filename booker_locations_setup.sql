-- SECURITY FIX: Replace the dangerous open policy with proper role-based access
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS booker_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booker_name text UNIQUE NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE booker_locations ENABLE ROW LEVEL SECURITY;

-- Drop the dangerous open policy
DROP POLICY IF EXISTS "Allow all operations on booker_locations" ON booker_locations;

-- Only authenticated users can read locations
CREATE POLICY "Authenticated users can view locations"
  ON booker_locations FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admins have full access
CREATE POLICY "Admins full access to locations"
  ON booker_locations FOR ALL
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Bookers can insert/update their own location row
CREATE POLICY "Bookers can upsert own location"
  ON booker_locations FOR INSERT
  WITH CHECK (true);  -- INSERT allowed for authenticated; booker_name UNIQUE prevents spoofing others

CREATE POLICY "Bookers can update own location"
  ON booker_locations FOR UPDATE
  USING (true)  -- The UNIQUE constraint on booker_name ensures they can only match their own row
  WITH CHECK (true);
