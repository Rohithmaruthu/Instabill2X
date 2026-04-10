create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  full_name text,
  business_name text,
  display_name text generated always as (coalesce(nullif(trim(business_name), ''), nullif(trim(full_name), ''))) stored,
  upi_id text,
  gstin text,
  logo_path text,
  signature_path text,
  footer_text text,
  invoice_counter integer not null default 0,
  first_invoice_sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_invoice_counter_check check (invoice_counter >= 0)
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  company_name text,
  email text,
  whatsapp_number text,
  gstin text,
  notes text,
  last_used_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint clients_name_not_blank check (length(trim(name)) > 0)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  invoice_count integer not null default 0,
  razorpay_customer_id text,
  razorpay_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint subscriptions_plan_check check (plan in ('free', 'pro')),
  constraint subscriptions_status_check check (status in ('active', 'past_due', 'cancelled', 'trialing', 'expired')),
  constraint subscriptions_invoice_count_check check (invoice_count >= 0)
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  invoice_number text not null,
  issue_date date not null default current_date,
  due_date date,
  status text not null default 'draft',
  kind text not null default 'tax_invoice',
  currency text not null default 'INR',
  gst_rate numeric(5,2) not null default 18,
  subtotal numeric(12,2) not null default 0,
  gst_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  notes text,
  footer_text text,
  share_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  share_url text,
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  open_count integer not null default 0,
  paid_at timestamptz,
  sent_at timestamptz,
  freelancer_name text,
  freelancer_business_name text,
  freelancer_email text,
  freelancer_upi_id text,
  freelancer_gstin text,
  freelancer_logo_path text,
  freelancer_signature_path text,
  client_name text not null,
  client_company_name text,
  client_email text,
  client_whatsapp_number text,
  client_gstin text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint invoices_invoice_number_not_blank check (length(trim(invoice_number)) > 0),
  constraint invoices_client_name_not_blank check (length(trim(client_name)) > 0),
  constraint invoices_status_check check (status in ('draft', 'sent', 'paid', 'overdue')),
  constraint invoices_kind_check check (kind in ('tax_invoice', 'proforma')),
  constraint invoices_gst_rate_check check (gst_rate in (0, 5, 12, 18)),
  constraint invoices_subtotal_check check (subtotal >= 0),
  constraint invoices_gst_amount_check check (gst_amount >= 0),
  constraint invoices_total_amount_check check (total_amount >= 0),
  constraint invoices_open_count_check check (open_count >= 0)
);

create table if not exists public.line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  position integer not null default 0,
  description text not null,
  quantity numeric(12,2) not null default 1,
  rate numeric(12,2) not null default 0,
  amount numeric(12,2) generated always as (round((quantity * rate)::numeric, 2)) stored,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint line_items_description_not_blank check (length(trim(description)) > 0),
  constraint line_items_quantity_check check (quantity > 0),
  constraint line_items_rate_check check (rate >= 0)
);

create table if not exists public.invoice_events (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  event_type text not null,
  event_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint invoice_events_type_check check (
    event_type in (
      'invoice_created',
      'invoice_updated',
      'invoice_sent',
      'invoice_paid',
      'invoice_duplicated',
      'client_opened'
    )
  )
);

create index if not exists clients_user_id_idx on public.clients (user_id);
create index if not exists clients_user_id_name_idx on public.clients (user_id, lower(name));
create index if not exists clients_user_id_last_used_at_idx on public.clients (user_id, last_used_at desc);

create unique index if not exists invoices_user_id_invoice_number_idx
  on public.invoices (user_id, invoice_number);
create index if not exists invoices_user_id_status_idx on public.invoices (user_id, status);
create index if not exists invoices_user_id_created_at_idx on public.invoices (user_id, created_at desc);
create index if not exists invoices_user_id_due_date_idx on public.invoices (user_id, due_date);
create index if not exists invoices_share_token_idx on public.invoices (share_token);
create index if not exists invoices_client_id_idx on public.invoices (client_id);

create index if not exists line_items_invoice_id_position_idx on public.line_items (invoice_id, position);
create index if not exists line_items_user_id_description_idx on public.line_items (user_id, lower(description));

create index if not exists invoice_events_invoice_id_created_at_idx
  on public.invoice_events (invoice_id, created_at desc);
create index if not exists invoice_events_user_id_type_idx
  on public.invoice_events (user_id, event_type, created_at desc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
before update on public.clients
for each row
execute function public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();

drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at
before update on public.invoices
for each row
execute function public.set_updated_at();

drop trigger if exists line_items_set_updated_at on public.line_items;
create trigger line_items_set_updated_at
before update on public.line_items
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
after insert on public.profiles
for each row
execute function public.handle_new_subscription();

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.subscriptions enable row level security;
alter table public.invoices enable row level security;
alter table public.line_items enable row level security;
alter table public.invoice_events enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "clients_select_own" on public.clients;
create policy "clients_select_own"
on public.clients
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "clients_insert_own" on public.clients;
create policy "clients_insert_own"
on public.clients
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "clients_update_own" on public.clients;
create policy "clients_update_own"
on public.clients
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "clients_delete_own" on public.clients;
create policy "clients_delete_own"
on public.clients
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
on public.subscriptions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "subscriptions_insert_own" on public.subscriptions;
create policy "subscriptions_insert_own"
on public.subscriptions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "subscriptions_update_own" on public.subscriptions;
create policy "subscriptions_update_own"
on public.subscriptions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "invoices_public_read_by_token" on public.invoices;
create policy "invoices_public_read_by_token"
on public.invoices
for select
to anon, authenticated
using (share_token is not null);

drop policy if exists "invoices_select_own" on public.invoices;
create policy "invoices_select_own"
on public.invoices
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "invoices_insert_own" on public.invoices;
create policy "invoices_insert_own"
on public.invoices
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "invoices_update_own" on public.invoices;
create policy "invoices_update_own"
on public.invoices
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "invoices_delete_own" on public.invoices;
create policy "invoices_delete_own"
on public.invoices
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "line_items_select_own" on public.line_items;
create policy "line_items_select_own"
on public.line_items
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "line_items_insert_own" on public.line_items;
create policy "line_items_insert_own"
on public.line_items
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "line_items_update_own" on public.line_items;
create policy "line_items_update_own"
on public.line_items
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "line_items_delete_own" on public.line_items;
create policy "line_items_delete_own"
on public.line_items
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "invoice_events_select_own" on public.invoice_events;
create policy "invoice_events_select_own"
on public.invoice_events
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "invoice_events_insert_own" on public.invoice_events;
create policy "invoice_events_insert_own"
on public.invoice_events
for insert
to authenticated
with check (auth.uid() = user_id or user_id is null);

insert into storage.buckets (id, name, public)
values ('instabill-assets', 'instabill-assets', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "instabill_assets_public_read" on storage.objects;
create policy "instabill_assets_public_read"
on storage.objects
for select
to public
using (bucket_id = 'instabill-assets');

drop policy if exists "instabill_assets_owner_insert" on storage.objects;
create policy "instabill_assets_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'instabill-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "instabill_assets_owner_update" on storage.objects;
create policy "instabill_assets_owner_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'instabill-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'instabill-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "instabill_assets_owner_delete" on storage.objects;
create policy "instabill_assets_owner_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'instabill-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);
