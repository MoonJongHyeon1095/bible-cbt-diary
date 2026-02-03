drop function if exists public.increment_token_usages(uuid, text, integer, integer, integer, bigint, bigint);
drop function if exists public.increment_token_usages(uuid, text, integer, integer, integer, bigint, bigint, bigint, bigint);
drop function if exists public.increment_token_usages(uuid, text, integer, integer, integer, bigint, bigint, bigint, bigint, bigint);
drop function if exists public.increment_token_usages(uuid, text, integer, integer, integer, bigint, bigint, bigint, bigint, bigint, bigint);

do $$
declare
  fn record;
begin
  for fn in
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'increment_non_member_token_usage'
  loop
    execute format(
      'drop function if exists public.increment_non_member_token_usage(%s);',
      pg_get_function_identity_arguments(fn.oid)
    );
  end loop;
end $$;
