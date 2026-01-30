-- Fix security vulnerability in product_references RLS policies
-- Per ROO-25: Change user_metadata to app_metadata for admin checks

drop policy if exists "References are insertable by service_role only" on public.product_references;
drop policy if exists "References are updatable by service_role only" on public.product_references;
drop policy if exists "References are deletable by service_role only" on public.product_references;

create policy "References are insertable by service_role only"
    on public.product_references for insert
    with check ( auth.role() = 'service_role' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' );

create policy "References are updatable by service_role only"
    on public.product_references for update
    using ( auth.role() = 'service_role' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' );

create policy "References are deletable by service_role only"
    on public.product_references for delete
    using ( auth.role() = 'service_role' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' );
