-- Create users table if it doesn't exist
create table if not exists public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    name text not null,
    username text unique not null,
    email text unique not null,
    role text not null check (role in ('admin', 'manager', 'cashier')),
    is_active boolean default true not null
);

-- Enable RLS
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

-- Drop existing policies
drop policy if exists "Allow anyone to create users" on public.users;
drop policy if exists "Allow authenticated users to view all users" on public.users;

-- Create new policies
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
        when check_user_role('cashier') then id = auth.uid()
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

-- Create trigger to update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger set_updated_at
    before update on public.users
    for each row
    execute function public.handle_updated_at(); 