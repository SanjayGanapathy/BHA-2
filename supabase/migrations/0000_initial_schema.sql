-- Initial Schema for Bull Horn Analytics POS

-- 1. Create Products table
create table if not exists public.products (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now() not null,
    name text not null,
    description text,
    price numeric(10, 2) not null,
    cost numeric(10, 2),
    category text,
    sku text unique,
    barcode text unique,
    stock integer default 0 not null,
    image_url text
);
comment on table public.products is 'Stores product information for the POS system.';

-- 2. Create Sales table
create table if not exists public.sales (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now() not null,
    user_id uuid references auth.users(id) on delete set null,
    total numeric(10, 2) not null,
    profit numeric(10, 2),
    payment_method text
);
comment on table public.sales is 'Records each sale transaction.';

-- 3. Create Sale Items table (join table for sales and products)
create table if not exists public.sale_items (
    id uuid primary key default gen_random_uuid(),
    sale_id uuid references public.sales(id) on delete cascade not null,
    product_id uuid references public.products(id) on delete restrict not null,
    quantity integer not null,
    price_at_sale numeric(10, 2) not null
);
comment on table public.sale_items is 'Stores individual items within a sale.';

-- 4. Enable Row Level Security (RLS)
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;

-- 5. Create RLS policies
-- Allow authenticated users to read all products/sales data
create policy "Allow authenticated users to read everything"
on public.products for select
to authenticated
using (true);

create policy "Allow authenticated users to read sales"
on public.sales for select
to authenticated
using (true);

create policy "Allow authenticated users to read sale items"
on public.sale_items for select
to authenticated
using (true);

-- Allow users to insert their own sales
create policy "Allow users to insert their own sales"
on public.sales for insert
to authenticated
with check (user_id = auth.uid());

create policy "Allow users to insert their own sale items"
on public.sale_items for insert
to authenticated
with check (
  (select user_id from public.sales where id = sale_id) = auth.uid()
);

-- Allow admins (or a specific role) to manage products
-- This is an example, you might want to create a custom 'admin' role
create policy "Allow admin to manage products"
on public.products for all
using (true) -- You should restrict this to a specific role in production
with check (true); 