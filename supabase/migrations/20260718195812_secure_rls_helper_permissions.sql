-- This event-trigger helper is invoked by PostgreSQL itself when tables are
-- created. Public API roles never need permission to execute it directly.
revoke execute on function public.rls_auto_enable()
from public, anon, authenticated;
