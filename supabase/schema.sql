-- شغّل هذا الملف مرة واحدة داخل Supabase SQL Editor
create extension if not exists "pgcrypto";

create table if not exists public.attendees (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  guests_count integer not null check (guests_count between 1 and 10),
  phone text not null unique check (phone ~ '^[0-9]{11,15}$'),
  created_at timestamptz not null default now()
);

alter table public.attendees enable row level security;

drop policy if exists "public can register attendance" on public.attendees;
create policy "public can register attendance"
on public.attendees for insert
to anon
with check (
  char_length(name) between 2 and 80
  and guests_count between 1 and 10
  and phone ~ '^[0-9]{11,15}$'
);

drop policy if exists "signed in clients can view attendees" on public.attendees;
create policy "signed in clients can view attendees"
on public.attendees for select
to authenticated
using (true);

create index if not exists attendees_created_at_idx on public.attendees (created_at desc);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  order_number integer not null unique,
  code text not null unique,
  attendee_id uuid references public.attendees(id) on delete set null,
  reserved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.cards add column if not exists note text check (char_length(note) <= 500);
alter table public.cards add column if not exists manual_reserved boolean not null default false;

alter table public.cards enable row level security;

drop policy if exists "signed in users can view cards" on public.cards;
create policy "signed in users can view cards"
on public.cards for select to authenticated using (true);

drop policy if exists "signed in users can add cards" on public.cards;
create policy "signed in users can add cards"
on public.cards for insert to authenticated with check (true);

drop policy if exists "signed in users can update cards" on public.cards;
create policy "signed in users can update cards"
on public.cards for update to authenticated using (true) with check (true);

create index if not exists cards_attendee_idx on public.cards (attendee_id);
drop index if exists public.cards_available_idx;
create index cards_available_idx on public.cards (order_number) where attendee_id is null and manual_reserved = false;

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
  if requested_count < 1 or requested_count > 10 then
    raise exception 'Invalid card count';
  end if;

  select count(*) into already_reserved from public.cards where attendee_id = target_attendee;
  needed := greatest(requested_count - already_reserved, 0);

  if needed > (select count(*) from public.cards where attendee_id is null and manual_reserved = false) then
    raise exception 'Not enough available cards';
  end if;

  if needed > 0 then
    update public.cards
    set attendee_id = target_attendee, reserved_at = now()
    where id in (
      select id from public.cards
      where attendee_id is null and manual_reserved = false
      order by order_number
      for update skip locked
      limit needed
    );
  end if;

  return query select * from public.cards where attendee_id = target_attendee order by order_number;
end;
$$;

grant execute on function public.reserve_cards(uuid, integer) to authenticated;
