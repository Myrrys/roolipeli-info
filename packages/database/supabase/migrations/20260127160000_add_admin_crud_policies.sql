-- Enable Write Access for Admins on Publishers
CREATE POLICY "Enable write access for admins" ON "public"."publishers"
AS PERMISSIVE FOR ALL
TO authenticated
USING (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text)
WITH CHECK (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);

-- Enable Write Access for Admins on Creators
CREATE POLICY "Enable write access for admins" ON "public"."creators"
AS PERMISSIVE FOR ALL
TO authenticated
USING (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text)
WITH CHECK (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);
