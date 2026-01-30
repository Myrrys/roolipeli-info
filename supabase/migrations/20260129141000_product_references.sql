-- Create product_references table
create table public.product_references (
    id uuid not null default gen_random_uuid(),
    product_id uuid not null references public.products(id) on delete cascade,
    reference_type text not null check (reference_type in ('official', 'source', 'review', 'social')),
    label text not null,
    url text not null,
    citation_details jsonb,
    created_at timestamp with time zone not null default now(),
    constraint product_references_pkey primary key (id)
);

-- Enable RLS
alter table public.product_references enable row level security;

-- Policies
create policy "References are viewable by everyone"
    on public.product_references for select
    using (true);

create policy "References are insertable by service_role only"
    on public.product_references for insert
    with check ( auth.role() = 'service_role' OR (select (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') = 'admin' );

create policy "References are updatable by service_role only"
    on public.product_references for update
    using ( auth.role() = 'service_role' OR (select (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') = 'admin' );

create policy "References are deletable by service_role only"
    on public.product_references for delete
    using ( auth.role() = 'service_role' OR (select (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') = 'admin' );
