CREATE TABLE IF NOT EXISTS booker_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booker_name text UNIQUE NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE booker_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on booker_locations" ON booker_locations FOR ALL USING (true);
