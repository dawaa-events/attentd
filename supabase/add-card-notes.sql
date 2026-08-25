-- شغّل هذا الملف مرة واحدة داخل Supabase SQL Editor
alter table public.cards
add column if not exists note text
check (char_length(note) <= 500);
