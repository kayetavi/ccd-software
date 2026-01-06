create table projects (
  id uuid primary key default gen_random_uuid(),
  project_name text
);

create table corrosion_loops (
  id uuid primary key default gen_random_uuid(),
  project_id uuid,
  loop_name text,
  fluid text,
  phase text,
  temp_min int,
  temp_max int,
  temp_band text,
  sulfur boolean,
  chloride boolean,
  created_at timestamptz default now()
);

create table circuits (
  id uuid primary key default gen_random_uuid(),
  loop_id uuid,
  circuit_name text,
  material text,
  temperature int,
  design_thickness numeric,
  minimum_thickness numeric,
  created_at timestamptz default now()
);
