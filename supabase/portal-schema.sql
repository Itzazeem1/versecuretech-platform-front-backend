-- VersecureTech portal schema (run in Supabase SQL editor)
-- Projects, support tickets, message history, attachments

create extension if not exists pgcrypto;

create table if not exists portal_projects (
  id uuid primary key default gen_random_uuid(),
  client_email text not null,
  title text not null,
  status text not null default 'queued' check (status in ('queued','in_progress','review','done')),
  progress int not null default 0 check (progress >= 0 and progress <= 100),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists portal_projects_client_email_idx on portal_projects (lower(client_email));

create table if not exists portal_tickets (
  id uuid primary key default gen_random_uuid(),
  client_email text not null,
  subject text not null,
  priority text not null default 'normal' check (priority in ('normal','high','urgent')),
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists portal_tickets_client_email_idx on portal_tickets (lower(client_email));
create index if not exists portal_tickets_status_idx on portal_tickets (status);

create table if not exists portal_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references portal_tickets(id) on delete cascade,
  author_email text not null,
  author_role text not null check (author_role in ('client','admin')),
  body text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists portal_ticket_messages_ticket_idx on portal_ticket_messages (ticket_id, created_at);

create table if not exists portal_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references portal_tickets(id) on delete cascade,
  message_id uuid references portal_ticket_messages(id) on delete set null,
  file_name text not null,
  mime_type text not null default 'application/octet-stream',
  byte_size bigint not null default 0,
  url text not null,
  uploaded_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists portal_attachments_ticket_idx on portal_attachments (ticket_id);

alter table portal_projects enable row level security;
alter table portal_tickets enable row level security;
alter table portal_ticket_messages enable row level security;
alter table portal_attachments enable row level security;

-- Clients read own rows; writes go through server service role in production.
drop policy if exists portal_projects_select_own on portal_projects;
create policy portal_projects_select_own on portal_projects
  for select to authenticated
  using (lower(client_email) = lower(auth.jwt() ->> 'email'));

drop policy if exists portal_tickets_select_own on portal_tickets;
create policy portal_tickets_select_own on portal_tickets
  for select to authenticated
  using (lower(client_email) = lower(auth.jwt() ->> 'email'));

drop policy if exists portal_messages_select_own on portal_ticket_messages;
create policy portal_messages_select_own on portal_ticket_messages
  for select to authenticated
  using (
    exists (
      select 1 from portal_tickets t
      where t.id = ticket_id and lower(t.client_email) = lower(auth.jwt() ->> 'email')
    )
  );

drop policy if exists portal_attachments_select_own on portal_attachments;
create policy portal_attachments_select_own on portal_attachments
  for select to authenticated
  using (
    exists (
      select 1 from portal_tickets t
      where t.id = ticket_id and lower(t.client_email) = lower(auth.jwt() ->> 'email')
    )
  );


-- Storage bucket for ticket attachments (run in Supabase → Storage or SQL)
-- Create a public bucket named: portal-uploads
insert into storage.buckets (id, name, public)
values ('portal-uploads', 'portal-uploads', true)
on conflict (id) do nothing;

-- Allow public read of portal uploads
drop policy if exists portal_uploads_public_read on storage.objects;
create policy portal_uploads_public_read on storage.objects
  for select to public
  using (bucket_id = 'portal-uploads');

-- Writes should use the service role from server.mjs (bypasses RLS)
