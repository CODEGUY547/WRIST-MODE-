-- Run this once after scripts/migrate-to-supabase.js completes.
-- It ensures the next records created by the dashboard receive new IDs.

select setval(pg_get_serial_sequence('public.products', 'id'), coalesce((select max(id) from public.products), 1), true);
select setval(pg_get_serial_sequence('public.orders', 'id'), coalesce((select max(id) from public.orders), 1), true);
select setval(pg_get_serial_sequence('public.custom_requests', 'id'), coalesce((select max(id) from public.custom_requests), 1), true);
select setval(pg_get_serial_sequence('public.stock_alerts', 'id'), coalesce((select max(id) from public.stock_alerts), 1), true);
select setval(pg_get_serial_sequence('public.notifications', 'id'), coalesce((select max(id) from public.notifications), 1), true);
