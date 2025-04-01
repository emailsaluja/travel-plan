-- Create places_cache table
create table if not exists places_cache (
  key text primary key,
  data jsonb not null,
  timestamp bigint not null
);

-- Create predictions_cache table
create table if not exists predictions_cache (
  key text primary key,
  data jsonb not null,
  timestamp bigint not null
);

-- Create nearby_places_cache table
create table if not exists nearby_places_cache (
  key text primary key,
  data jsonb not null,
  timestamp bigint not null
);

-- Add indexes for timestamp columns
create index if not exists places_cache_timestamp_idx on places_cache(timestamp);
create index if not exists predictions_cache_timestamp_idx on predictions_cache(timestamp);
create index if not exists nearby_places_cache_timestamp_idx on nearby_places_cache(timestamp);

-- Add RLS policies
alter table places_cache enable row level security;
alter table predictions_cache enable row level security;
alter table nearby_places_cache enable row level security;

-- Allow read access to all authenticated users
create policy "Allow read access to all authenticated users for places_cache"
  on places_cache for select
  to authenticated
  using (true);

create policy "Allow read access to all authenticated users for predictions_cache"
  on predictions_cache for select
  to authenticated
  using (true);

create policy "Allow read access to all authenticated users for nearby_places_cache"
  on nearby_places_cache for select
  to authenticated
  using (true);

-- Allow write access to all authenticated users
create policy "Allow write access to all authenticated users for places_cache"
  on places_cache for insert
  to authenticated
  with check (true);

create policy "Allow write access to all authenticated users for predictions_cache"
  on predictions_cache for insert
  to authenticated
  with check (true);

create policy "Allow write access to all authenticated users for nearby_places_cache"
  on nearby_places_cache for insert
  to authenticated
  with check (true);

-- Allow update access to all authenticated users
create policy "Allow update access to all authenticated users for places_cache"
  on places_cache for update
  to authenticated
  using (true);

create policy "Allow update access to all authenticated users for predictions_cache"
  on predictions_cache for update
  to authenticated
  using (true);

create policy "Allow update access to all authenticated users for nearby_places_cache"
  on nearby_places_cache for update
  to authenticated
  using (true);

-- Allow delete access to all authenticated users
create policy "Allow delete access to all authenticated users for places_cache"
  on places_cache for delete
  to authenticated
  using (true);

create policy "Allow delete access to all authenticated users for predictions_cache"
  on predictions_cache for delete
  to authenticated
  using (true);

create policy "Allow delete access to all authenticated users for nearby_places_cache"
  on nearby_places_cache for delete
  to authenticated
  using (true); 