-- Create product_isbns table
CREATE TABLE IF NOT EXISTS public.product_isbns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    isbn TEXT NOT NULL,
    label TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add sample labels for existing data if needed, but for now we just migrate
-- We can't use hardcoded IDs in migrations as per tool instructions, 
-- but we can select from the existing products table.

-- Enable RLS
ALTER TABLE public.product_isbns ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can read product_isbns"
ON public.product_isbns FOR SELECT
TO anon
USING (true);

CREATE POLICY "Admins can manage product_isbns"
ON public.product_isbns FOR ALL
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Migrate existing data
INSERT INTO public.product_isbns (product_id, isbn)
SELECT id, isbn
FROM public.products
WHERE isbn IS NOT NULL;

-- Note: We keep products.isbn for now to avoid breaking existing queries 
-- until the application is updated. 
-- We will add a comment to mark it as deprecated.
COMMENT ON COLUMN public.products.isbn IS 'Deprecated: Use product_isbns table instead.';
