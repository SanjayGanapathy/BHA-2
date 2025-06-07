-- Drop the existing handle_new_user trigger and function
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Drop the existing users table
drop table if exists public.users;

-- Create the users table with the correct schema
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

-- Enable RLS
alter table public.users enable row level security;

-- Create the handle_new_user function
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.users (id, name, username, email, role)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        new.email,
        'cashier'  -- Default role for new users
    );
    return new;
end;
$$ language plpgsql security definer;

-- Create the trigger
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on public.users to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;

-- Create policies
create policy "Users can view their own profile"
    on public.users for select
    to authenticated
    using (id = auth.uid());

create policy "Users can update their own profile"
    on public.users for update
    to authenticated
    using (id = auth.uid())
    with check (id = auth.uid());

create policy "Allow users to create their profile"
    on public.users for insert
    to authenticated
    with check (id = auth.uid()); 