select
  n.nspname as schema,
  c.relname as table,
  p.polname as policy_name,
  case p.polcmd
    when 'r' then 'SELECT'
    when 'a' then 'INSERT'
    when 'w' then 'UPDATE'
    when 'd' then 'DELETE'
    when '*' then 'ALL'
  end as command,
  string_agg(
    case
      when role_oid.oid = 0 then 'PUBLIC'
      else r.rolname
    end,
    ', ' order by
      case when role_oid.oid = 0 then 0 else 1 end,
      r.rolname
  ) as roles,
  pg_get_expr(p.polqual, p.polrelid) as using_expr,
  pg_get_expr(p.polwithcheck, p.polrelid) as with_check_expr
from pg_policy p
join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
left join lateral unnest(p.polroles) as role_oid(oid) on true
left join pg_roles r on r.oid = role_oid.oid
where n.nspname in ('public', 'storage')  -- 필요 없으면 'storage' 빼
group by 1,2,3,4,6,7, p.polrelid
order by 1,2,4,3;
