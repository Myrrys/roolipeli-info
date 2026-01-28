-- Enable Write Access for Admins on Products
CREATE POLICY "Enable write access for admins" ON "public"."products"
AS PERMISSIVE FOR ALL
TO authenticated
USING (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text)
WITH CHECK (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);

-- Enable Write Access for Admins on Product Creators
CREATE POLICY "Enable write access for admins" ON "public"."products_creators"
AS PERMISSIVE FOR ALL
TO authenticated
USING (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text)
WITH CHECK (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);
