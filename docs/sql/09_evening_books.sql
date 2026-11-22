-- Les Petits Pas — bonus « Livre du soir ».
-- Cible : projet Supabase `lespetitspas` (local + staging) UNIQUEMENT.
-- Écrit pour relecture ; ne pas exécuter sur une base sans validation.

create table if not exists public.evening_books (
  id uuid primary key default gen_random_uuid(),
  suggestion_date date not null unique,
  title text not null check (char_length(title) between 1 and 200),
  author text,
  cover_url text,
  open_library_key text not null,
  created_at timestamptz not null default now()
);

alter table public.evening_books enable row level security;

drop policy if exists evening_books_select_authenticated on public.evening_books;
create policy evening_books_select_authenticated on public.evening_books
  for select to authenticated using (true);

revoke all on public.evening_books from anon, authenticated, service_role;
grant select on public.evening_books to authenticated;
grant select, insert on public.evening_books to service_role;
