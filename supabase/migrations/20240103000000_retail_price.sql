-- Add retail_price column to products table for storing retail prices
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS retail_price NUMERIC(10, 2);
