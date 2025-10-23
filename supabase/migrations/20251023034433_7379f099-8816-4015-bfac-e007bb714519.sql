-- Renombrar la columna nutrients a product_info en la tabla products
ALTER TABLE public.products 
RENAME COLUMN nutrients TO product_info;

-- Actualizar comentario de la columna para reflejar el nuevo propósito
COMMENT ON COLUMN public.products.product_info IS 'Información del producto incluyendo tipo de envase, biodegradabilidad, certificaciones y propiedades del producto';

-- Actualizar datos existentes para agregar estructura básica de product_info si está vacío
UPDATE public.products 
SET product_info = '{}'::jsonb 
WHERE product_info IS NULL OR product_info = 'null'::jsonb;