-- User Management System for Bull Horn Analytics

-- First, let's get all unique user IDs from sales
create temporary table temp_user_ids as
select distinct user_id as id
from public.sales
where user_id is not null;

-- Drop existing policies first
drop policy if exists "Users can view users based on role" on public.users;
drop policy if exists "Only admins can create users" on public.users;
drop policy if exists "Users can update based on role" on public.users;
drop policy if exists "Only admins can delete users" on public.users;
drop policy if exists "Products access based on role" on public.products;
drop policy if exists "Sales access based on role" on public.sales;
drop policy if exists "Sale items access based on role" on public.sale_items;
drop policy if exists "Allow admins to manage products" on public.products;
drop policy if exists "Allow authenticated users to read products" on public.products;
drop policy if exists "Allow users to insert sale_items for their sales" on public.sale_items;
drop policy if exists "Allow users to insert their own sales" on public.sales;
drop policy if exists "Allow users to read sale_items for their sales" on public.sale_items;
drop policy if exists "Allow users to read their own profile" on public.users;
drop policy if exists "Allow users to read their own sales" on public.sales;
drop policy if exists "Allow users to update their own profile" on public.users;
drop policy if exists "Enable delete for authenticated users" on public.products;
drop policy if exists "Enable insert for authenticated users" on public.products;
drop policy if exists "Enable read access for all authenticated users" on public.products;
drop policy if exists "Enable update for authenticated users" on public.products;

-- Drop existing triggers
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists set_updated_at on public.users;

-- Drop existing functions
drop function if exists public.handle_new_user() cascade;
drop function if exists public.check_user_role(text) cascade;
drop function if exists public.can_manage_user(uuid) cascade;
drop function if exists public.handle_updated_at() cascade;

-- Drop foreign key constraints
alter table if exists public.sales 
    drop constraint if exists sales_user_id_fkey;

alter table if exists public.sale_items 
    drop constraint if exists sale_items_sale_id_fkey;

-- Drop existing table with cascade
drop table if exists public.users cascade;

-- Create users table
create table public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    name text not null,
    username text unique not null,
    email text unique not null,
    role text not null check (role in ('admin', 'manager', 'cashier')),
    is_active boolean default true not null
);

-- Insert placeholder users for existing sales
insert into public.users (id, name, username, email, role)
select 
    id,
    'Legacy User',
    'legacy_' || substr(id::text, 1, 8),
    'legacy_' || substr(id::text, 1, 8) || '@legacy.com',
    'cashier'
from temp_user_ids;

-- Drop temporary table
drop table temp_user_ids;

-- Recreate foreign key constraints
alter table public.sales
    add constraint sales_user_id_fkey
    foreign key (user_id)
    references public.users(id)
    on delete set null;

alter table public.sale_items
    add constraint sale_items_sale_id_fkey
    foreign key (sale_id)
    references public.sales(id)
    on delete cascade;

-- Enable Row Level Security
alter table public.users enable row level security;

-- Create function to check user role
create or replace function public.check_user_role(required_role text)
returns boolean as $$
declare
    user_role text;
begin
    select role into user_role
    from public.users
    where id = auth.uid();
    
    return case
        when required_role = 'admin' then user_role = 'admin'
        when required_role = 'manager' then user_role in ('admin', 'manager')
        when required_role = 'cashier' then user_role in ('admin', 'manager', 'cashier')
        else false
    end;
end;
$$ language plpgsql security definer;

-- Create function to check if user can manage target user
create or replace function public.can_manage_user(target_user_id uuid)
returns boolean as $$
declare
    current_user_role text;
    target_user_role text;
begin
    select role into current_user_role
    from public.users
    where id = auth.uid();
    
    select role into target_user_role
    from public.users
    where id = target_user_id;
    
    return case
        when current_user_role = 'admin' then true
        when current_user_role = 'manager' then target_user_role = 'cashier'
        else false
    end;
end;
$$ language plpgsql security definer;

-- Create function to handle new user creation with better error handling
create or replace function public.handle_new_user()
returns trigger as $$
declare
    username text;
    name text;
begin
    -- Generate username from email
    username := split_part(new.email, '@', 1);
    
    -- Get name from metadata or use email username
    name := coalesce(
        new.raw_user_meta_data->>'name',
        split_part(new.email, '@', 1)
    );
    
    -- Insert into users table with error handling
    begin
        insert into public.users (id, name, username, email, role)
        values (
            new.id,
            name,
            username,
            new.email,
            'cashier'  -- Default role for new users
        );
    exception
        when unique_violation then
            -- If username is taken, append a random number
            username := username || '_' || floor(random() * 1000)::text;
            insert into public.users (id, name, username, email, role)
            values (
                new.id,
                name,
                username,
                new.email,
                'cashier'
            );
        when others then
            -- Log the error and rethrow
            raise log 'Error in handle_new_user: %', SQLERRM;
            raise;
    end;
    
    return new;
end;
$$ language plpgsql security definer;

-- Create function to handle updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create triggers
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

create trigger set_updated_at
    before update on public.users
    for each row
    execute function public.handle_updated_at();

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on public.users to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;

-- Create RLS policies
-- View users policy
create policy "Users can view users based on role"
on public.users for select
to authenticated
using (
    case
        when check_user_role('admin') then true
        when check_user_role('manager') then role in ('manager', 'cashier')
        when check_user_role('cashier') then id = auth.uid()
        else false
    end
);

-- Insert users policy
create policy "Only admins can create users"
on public.users for insert
to authenticated
with check (check_user_role('admin'));

-- Update users policy
create policy "Users can update based on role"
on public.users for update
to authenticated
using (can_manage_user(id))
with check (can_manage_user(id));

-- Delete users policy
create policy "Only admins can delete users"
on public.users for delete
to authenticated
using (check_user_role('admin'));

-- Create policies for other tables
-- Products policies
create policy "Products access based on role"
on public.products for all
to authenticated
using (
    case
        when check_user_role('admin') then true
        when check_user_role('manager') then true
        when check_user_role('cashier') then true
        else false
    end
)
with check (
    case
        when check_user_role('admin') then true
        when check_user_role('manager') then true
        else false
    end
);

-- Sales policies
create policy "Sales access based on role"
on public.sales for all
to authenticated
using (
    case
        when check_user_role('admin') then true
        when check_user_role('manager') then true
        when check_user_role('cashier') then user_id = auth.uid()
        else false
    end
)
with check (
    case
        when check_user_role('admin') then true
        when check_user_role('manager') then true
        when check_user_role('cashier') then user_id = auth.uid()
        else false
    end
);

-- Sale items policies
create policy "Sale items access based on role"
on public.sale_items for all
to authenticated
using (
    case
        when check_user_role('admin') then true
        when check_user_role('manager') then true
        when check_user_role('cashier') then 
            exists (
                select 1 from public.sales 
                where id = sale_id and user_id = auth.uid()
            )
        else false
    end
)
with check (
    case
        when check_user_role('admin') then true
        when check_user_role('manager') then true
        when check_user_role('cashier') then 
            exists (
                select 1 from public.sales 
                where id = sale_id and user_id = auth.uid()
            )
        else false
    end
);

-- Create initial admin user (if needed)
-- Note: This should be run only once and requires the admin user to be created in auth.users first
-- insert into public.users (id, name, username, email, role)
-- values (
--     'ADMIN_USER_ID_HERE',  -- Replace with actual admin user ID from auth.users
--     'Admin User',
--     'admin',
--     'admin@bullhorn.com',
--     'admin'
-- ); 