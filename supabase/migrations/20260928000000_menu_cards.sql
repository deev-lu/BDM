-- Speisekarten-Upload für die Website (Saisonkarte + Klassische Karte).
-- Jede Karte ist eine PDF- oder Bilddatei im Storage-Bucket "menu-cards".
-- Pro Karte kann mehrere Dateien geben, aber höchstens eine ist aktiv
-- (= wird auf der Website gezeigt).

create table public.menu_files (
  id           uuid primary key default gen_random_uuid(),
  card         text not null check (card in ('saison', 'klassisch')),
  label        text not null default '',
  storage_path text not null unique,
  mime_type    text not null,
  is_active    boolean not null default false,
  created_at   timestamptz not null default now()
);

create unique index menu_files_one_active_per_card
  on public.menu_files (card) where is_active;

-- Wer darf hochladen? Nur E-Mail-Adressen in dieser Liste – ein beliebiges
-- Supabase-Konto reicht nicht.
create table public.menu_admins (
  email text primary key
);

alter table public.menu_files  enable row level security;
alter table public.menu_admins enable row level security;
-- menu_admins bekommt absichtlich keine Policies: nur is_menu_admin() liest sie.

create function public.is_menu_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.menu_admins
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

create policy "Aktive Karten sind öffentlich, Admins sehen alle"
  on public.menu_files for select
  to anon, authenticated
  using (is_active or (select public.is_menu_admin()));

create policy "Admins legen Karten an"
  on public.menu_files for insert
  to authenticated
  with check ((select public.is_menu_admin()));

create policy "Admins ändern Karten"
  on public.menu_files for update
  to authenticated
  using ((select public.is_menu_admin()))
  with check ((select public.is_menu_admin()));

create policy "Admins löschen Karten"
  on public.menu_files for delete
  to authenticated
  using ((select public.is_menu_admin()));

-- Eine Datei aktivieren und die bisher aktive derselben Karte abschalten,
-- in einem Schritt.
create function public.activate_menu_file(file_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_card text;
begin
  if not public.is_menu_admin() then
    raise exception 'not allowed';
  end if;

  select card into target_card from public.menu_files where id = file_id;
  if target_card is null then
    raise exception 'menu file not found';
  end if;

  update public.menu_files set is_active = false
    where card = target_card and is_active and id <> file_id;
  update public.menu_files set is_active = true
    where id = file_id;
end;
$$;

revoke execute on function public.activate_menu_file(uuid) from public, anon;
grant execute on function public.activate_menu_file(uuid) to authenticated;

-- Storage: öffentlich lesbar (die Website verlinkt die Dateien direkt),
-- schreiben nur Admins. Max. 20 MB, nur PDF und gängige Bildformate.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-cards', 'menu-cards', true, 20971520,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
);

create policy "Admins sehen Karten-Dateien"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'menu-cards' and (select public.is_menu_admin()));

create policy "Admins laden Karten-Dateien hoch"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'menu-cards' and (select public.is_menu_admin()));

create policy "Admins löschen Karten-Dateien"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'menu-cards' and (select public.is_menu_admin()));
