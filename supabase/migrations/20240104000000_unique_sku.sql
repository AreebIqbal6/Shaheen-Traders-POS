-- Enforce strict uniqueness on product SKUs so duplicates can never occur in the database
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique_idx ON public.products (sku) WHERE sku IS NOT NULL;
