-- شغّل هذا الملف مرة واحدة داخل Supabase SQL Editor
alter table public.cards
add column if not exists manual_reserved boolean not null default false;

drop index if exists public.cards_available_idx;
create index cards_available_idx on public.cards (order_number)
where attendee_id is null and manual_reserved = false;

create or replace function public.reserve_cards(target_attendee uuid, requested_count integer)
returns setof public.cards
language plpgsql
security definer
set search_path = public
as $$
declare
  already_reserved integer;
  needed integer;
begin
  if requested_count < 1 or requested_count > 10 then raise exception 'Invalid card count'; end if;
  select count(*) into already_reserved from public.cards where attendee_id = target_attendee;
  needed := greatest(requested_count - already_reserved, 0);
  if needed > (select count(*) from public.cards where attendee_id is null and manual_reserved = false) then
    raise exception 'Not enough available cards';
  end if;
  if needed > 0 then
    update public.cards set attendee_id = target_attendee, reserved_at = now()
    where id in (
      select id from public.cards
      where attendee_id is null and manual_reserved = false
      order by order_number for update skip locked limit needed
    );
  end if;
  return query select * from public.cards where attendee_id = target_attendee order by order_number;
end;
$$;

grant execute on function public.reserve_cards(uuid, integer) to authenticated;
