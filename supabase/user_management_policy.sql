-- Enable Row Level Security if not already enabled
-- alter table public.users enable row level security;

-- Drop existing policies if they are too restrictive
-- You may need to replace 'policy_name' with the actual name of your policy
-- DROP POLICY IF EXISTS "policy_name" ON public.users;

-- Create a policy that allows users to be created
-- This policy allows anyone to insert a new row into the public.users table.
-- For a production environment, you would want to restrict this further,
-- for example, by only allowing authenticated users with a certain role to add users.
-- This is a starting point to fix the immediate issue.
CREATE POLICY "Allow anyone to create users"
ON public.users
FOR INSERT
WITH CHECK (true);

-- You might also need a policy to allow users to view other users.
-- This policy allows any authenticated user to view all users.
-- Again, you may want to restrict this in a production environment.
CREATE POLICY "Allow authenticated users to view all users"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- After running this, you may also need to grant usage on the public schema
-- and select/insert permissions on the users table to the 'anon' and 'authenticated' roles.
-- GRANT USAGE ON SCHEMA public TO anon, authenticated;
-- GRANT SELECT, INSERT ON TABLE public.users TO anon, authenticated; 