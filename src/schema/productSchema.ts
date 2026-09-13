import { z } from 'zod';

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Product name is required'),
  barcode: z.string().min(1, 'Barcode is required'),
  price: z.number().min(0, 'Price must be greater than or equal to 0'),
  basePrice: z.number().min(0).optional().nullable(),
  retail_price: z.number().min(0, 'Retail price must be a valid number').optional().nullable(),
  cost_price: z.number().min(0).optional().nullable(),
  stock: z.number().int().default(0),
  category: z.string().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  sku: z.string().optional().nullable(),
  uom: z.string().optional().nullable(),
  pcsPerBox: z.number().int().optional().nullable(),
  boxPerCtn: z.number().int().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ProductSchemaType = z.infer<typeof productSchema>;
