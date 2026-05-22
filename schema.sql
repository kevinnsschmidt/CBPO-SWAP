-- ============================================================
-- CBPO Swap Board — Supabase Schema
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- LISTINGS
create table if not exists listings (
  id          text primary key,
  name        text not null,
  current_port text not null,
  desired_ports text[] not null,
  contact     text not null,
  notes       text default '',
  created_at  timestamptz default now()
);

-- LOCKS (48-hour review holds per officer per chain)
create table if not exists locks (
  chain_key   text not null,
  officer_id  text not null,
  locked_at   timestamptz not null,
  expires_at  timestamptz not null,
  primary key (chain_key, officer_id)
);

-- MESSAGES (per-chain chat)
create table if not exists messages (
  id          text primary key,
  chain_key   text not null,
  sender_id   text not null,
  sender_name text not null,
  text        text not null,
  created_at  timestamptz default now()
);
create index if not exists messages_chain_key_idx on messages(chain_key);

-- READ RECEIPTS (per user per chain, stored locally but synced)
create table if not exists read_receipts (
  chain_key   text not null,
  user_id     text not null,
  read_at     timestamptz not null,
  primary key (chain_key, user_id)
);

-- ── Row Level Security ────────────────────────────────────────
-- This is a public peer board — all data is readable/writable by anyone
-- with the anon key. Adjust if you add authentication later.

alter table listings      enable row level security;
alter table locks         enable row level security;
alter table messages      enable row level security;
alter table read_receipts enable row level security;

create policy "public_all" on listings      for all using (true) with check (true);
create policy "public_all" on locks         for all using (true) with check (true);
create policy "public_all" on messages      for all using (true) with check (true);
create policy "public_all" on read_receipts for all using (true) with check (true);

-- ── Realtime ──────────────────────────────────────────────────
-- Enable realtime for instant chat delivery
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table locks;
alter publication supabase_realtime add table listings;
