-- Allow only the trusted Wrist Mode server key to manage the private tables.
-- Browser users remain blocked by Row Level Security.

grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
