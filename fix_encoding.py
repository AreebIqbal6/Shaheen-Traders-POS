import sys

sql = """
-- ==============================================================================
-- TABLE: booker_locations
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.booker_locations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    booker_name text NOT NULL UNIQUE,
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.booker_locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies just in case
DROP POLICY IF EXISTS "Allow public read access to booker_locations" ON public.booker_locations;
DROP POLICY IF EXISTS "Allow public insert to booker_locations" ON public.booker_locations;
DROP POLICY IF EXISTS "Allow public update to booker_locations" ON public.booker_locations;
DROP POLICY IF EXISTS "Allow public delete to booker_locations" ON public.booker_locations;

CREATE POLICY "Allow public read access to booker_locations" ON public.booker_locations FOR SELECT USING (true);
CREATE POLICY "Allow public insert to booker_locations" ON public.booker_locations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to booker_locations" ON public.booker_locations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to booker_locations" ON public.booker_locations FOR DELETE USING (true);

GRANT ALL ON TABLE public.booker_locations TO anon;
GRANT ALL ON TABLE public.booker_locations TO authenticated;
"""

try:
    with open('supabase/migrations/20240101000000_schema.sql', 'rb') as f:
        content = f.read()

    # Find the last good line
    anchor = b'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;'
    idx = content.find(anchor)
    
    if idx != -1:
        good_content = content[:idx + len(anchor)]
        with open('supabase/migrations/20240101000000_schema.sql', 'wb') as f:
            f.write(good_content)
            f.write(b'\n\n')
            f.write(sql.encode('utf-8'))
        print('Fixed successfully')
    else:
        print('Anchor not found')
except Exception as e:
    print('Error:', e)
