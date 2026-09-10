-- Areas table for managing delivery areas
CREATE TABLE IF NOT EXISTS public.areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read areas
CREATE POLICY "Areas are viewable by everyone" ON public.areas
    FOR SELECT USING (true);

-- Allow authenticated users to insert areas
CREATE POLICY "Areas can be inserted by authenticated users" ON public.areas
    FOR INSERT WITH CHECK (true);

-- Allow authenticated users to delete areas
CREATE POLICY "Areas can be deleted by authenticated users" ON public.areas
    FOR DELETE USING (true);
