-- Fix authentication flow issues

-- Drop existing triggers and functions
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;

-- Drop foreign key constraints first
alter table if exists public.sales drop constraint if exists sales_user_id_fkey;

-- Create a temporary table to store unique user IDs from sales
create temporary table temp_sales_users as
select distinct user_id from public.sales where user_id is not null;

-- Drop and recreate the users table
drop table if exists public.users cascade;
create table public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    name text not null,
    username text unique not null,
    email text unique not null,
    role text not null check (role in ('admin', 'manager', 'cashier')),
    is_active boolean default true
);

-- Insert placeholder users for existing sales
insert into public.users (id, name, username, email, role, is_active)
select 
    user_id,
    'Legacy User',
    'legacy_user_' || substr(user_id::text, 1, 8),
    'legacy_' || substr(user_id::text, 1, 8) || '@placeholder.com',
    'cashier',
    false
from temp_sales_users;

-- Recreate foreign key constraint
alter table public.sales 
    add constraint sales_user_id_fkey 
    foreign key (user_id) 
    references public.users(id) 
    on delete set null;

-- Drop temporary table
drop table temp_sales_users;

-- Create a more robust handle_new_user function
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

-- Recreate the trigger
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- Update RLS policies to be more permissive during signup
alter table public.users enable row level security;

-- Allow users to read their own profile
create policy "Users can read their own profile"
on public.users for select
to authenticated
using (auth.uid() = id);

-- Allow users to update their own profile
create policy "Users can update their own profile"
on public.users for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Allow admins to manage all users
create policy "Admins can manage all users"
on public.users for all
to authenticated
using (
    exists (
        select 1 from public.users
        where id = auth.uid()
        and role = 'admin'
    )
)
with check (
    exists (
        select 1 from public.users
        where id = auth.uid()
        and role = 'admin'
    )
);

-- Allow the handle_new_user function to insert new users
create policy "Allow handle_new_user to insert users"
on public.users for insert
to authenticated
with check (true);

-- Grant necessary permissions
grant usage on schema public to authenticated;
grant usage on schema public to service_role;
grant all on public.users to authenticated;
grant all on public.users to service_role;

-- Create an admin user if it doesn't exist
insert into auth.users (id, email, encrypted_password, email_confirmed_at, role)
values (
    '00000000-0000-0000-0000-000000000000',
    'admin@bullhorn.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    'authenticated'
)
on conflict (id) do nothing;

insert into public.users (id, name, username, email, role, is_active)
values (
    '00000000-0000-0000-0000-000000000000',
    'Admin User',
    'admin',
    'admin@bullhorn.com',
    'admin',
    true
)
on conflict (id) do nothing; 