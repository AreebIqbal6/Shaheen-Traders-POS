-- Add missing columns
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS item_type TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pcs_per_box NUMERIC(10, 2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS box_per_ctn NUMERIC(10, 2);

-- Enforce strict uniqueness on product SKUs so duplicates can never occur in the database
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique_idx ON public.products (sku) WHERE sku IS NOT NULL;
