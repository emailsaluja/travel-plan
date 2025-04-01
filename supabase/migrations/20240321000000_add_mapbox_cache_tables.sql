-- Create mapbox_geocoding_cache table
create table if not exists mapbox_geocoding_cache (
  key text primary key,
  data jsonb not null,
  timestamp bigint not null
);

-- Create mapbox_routes_cache table
create table if not exists mapbox_routes_cache (
  key text primary key,
  data jsonb not null,
  timestamp bigint not null
);

-- Add indexes for timestamp columns
create index if not exists mapbox_geocoding_cache_timestamp_idx on mapbox_geocoding_cache(timestamp);
create index if not exists mapbox_routes_cache_timestamp_idx on mapbox_routes_cache(timestamp);

-- Add RLS policies
alter table mapbox_geocoding_cache enable row level security;
alter table mapbox_routes_cache enable row level security;

-- Allow read access to all authenticated users
create policy "Allow read access to all authenticated users for mapbox_geocoding_cache"
  on mapbox_geocoding_cache for select
  to authenticated
  using (true);

create policy "Allow read access to all authenticated users for mapbox_routes_cache"
  on mapbox_routes_cache for select
  to authenticated
  using (true);

-- Allow write access to all authenticated users
create policy "Allow write access to all authenticated users for mapbox_geocoding_cache"
  on mapbox_geocoding_cache for insert
  to authenticated
  with check (true);

create policy "Allow write access to all authenticated users for mapbox_routes_cache"
  on mapbox_routes_cache for insert
  to authenticated
  with check (true);

-- Allow update access to all authenticated users
create policy "Allow update access to all authenticated users for mapbox_geocoding_cache"
  on mapbox_geocoding_cache for update
  to authenticated
  using (true);

create policy "Allow update access to all authenticated users for mapbox_routes_cache"
  on mapbox_routes_cache for update
  to authenticated
  using (true);

-- Allow delete access to all authenticated users
create policy "Allow delete access to all authenticated users for mapbox_geocoding_cache"
  on mapbox_geocoding_cache for delete
  to authenticated
  using (true);

create policy "Allow delete access to all authenticated users for mapbox_routes_cache"
  on mapbox_routes_cache for delete
  to authenticated
  using (true); 