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
