-- Demo auth users + profiles seed
-- Password for all seeded accounts: Tasker2026!

with demo_users as (
  select * from (
    values
      ('0b9dcb0c-7b2b-4a30-9e29-0c8e3f9f8a11', 'amelia.parker@dmqdemo.com', 'Amelia Parker', 'user'),
      ('6c97a4d5-b7c0-4f0c-b69f-6e8c3f1e1a22', 'liam.brooks@dmqdemo.com', 'Liam Brooks', 'user'),
      ('8f2ed2f4-5a4a-4f3d-92ff-9a23a7e9b033', 'sofia.reed@dmqdemo.com', 'Sofia Reed', 'user'),
      ('1b4e6d8a-3e1d-4c0e-8b93-1c9bcb7a6b44', 'noah.howell@dmqdemo.com', 'Noah Howell', 'user'),
      ('f2c7b2a1-4b6a-4e6c-8e3f-7287b113c955', 'mia.lawson@dmqdemo.com', 'Mia Lawson', 'user'),
      ('a7c46c9f-0d48-4c1b-8c5c-9f02c3e8d666', 'ethan.gray@dmqdemo.com', 'Ethan Gray', 'user'),
      ('d3b39f11-1e9c-4c0f-b5e1-67f8c3b7a777', 'ava.ross@dmqdemo.com', 'Ava Ross', 'user'),
      ('4f8f2e7a-9b6c-4d9e-9f24-96b9f23e4888', 'oliver.cole@dmqdemo.com', 'Oliver Cole', 'user'),
      ('c7a8b0f3-5b21-4e38-9c8e-95bf7b0d2999', 'isla.hayes@dmqdemo.com', 'Isla Hayes', 'user'),
      ('e2a4c7d8-1b4f-4e49-9d9e-6c0b0e3f1aaa', 'jack.mason@dmqdemo.com', 'Jack Mason', 'user'),
      ('f1c0a9b8-2d3e-4f5a-8b7c-9d0e1f2a3b11', 'admin.riley@dmqdemo.com', 'Riley Admin', 'admin'),
      ('9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c22', 'admin.morgan@dmqdemo.com', 'Morgan Admin', 'admin')
  ) as t(id, email, full_name, role)
)
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  created_at,
  updated_at
)
select
  id,
  (select id from auth.instances limit 1),
  'authenticated',
  'authenticated',
  email,
  crypt('Tasker2026!', gen_salt('bf')),
  now(),
  now(),
  jsonb_build_object('full_name', full_name),
  jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
  now(),
  now()
from demo_users
on conflict (email) do nothing;

with demo_users as (
  select * from (
    values
      ('0b9dcb0c-7b2b-4a30-9e29-0c8e3f9f8a11', 'amelia.parker@dmqdemo.com', 'Amelia Parker', 'user'),
      ('6c97a4d5-b7c0-4f0c-b69f-6e8c3f1e1a22', 'liam.brooks@dmqdemo.com', 'Liam Brooks', 'user'),
      ('8f2ed2f4-5a4a-4f3d-92ff-9a23a7e9b033', 'sofia.reed@dmqdemo.com', 'Sofia Reed', 'user'),
      ('1b4e6d8a-3e1d-4c0e-8b93-1c9bcb7a6b44', 'noah.howell@dmqdemo.com', 'Noah Howell', 'user'),
      ('f2c7b2a1-4b6a-4e6c-8e3f-7287b113c955', 'mia.lawson@dmqdemo.com', 'Mia Lawson', 'user'),
      ('a7c46c9f-0d48-4c1b-8c5c-9f02c3e8d666', 'ethan.gray@dmqdemo.com', 'Ethan Gray', 'user'),
      ('d3b39f11-1e9c-4c0f-b5e1-67f8c3b7a777', 'ava.ross@dmqdemo.com', 'Ava Ross', 'user'),
      ('4f8f2e7a-9b6c-4d9e-9f24-96b9f23e4888', 'oliver.cole@dmqdemo.com', 'Oliver Cole', 'user'),
      ('c7a8b0f3-5b21-4e38-9c8e-95bf7b0d2999', 'isla.hayes@dmqdemo.com', 'Isla Hayes', 'user'),
      ('e2a4c7d8-1b4f-4e49-9d9e-6c0b0e3f1aaa', 'jack.mason@dmqdemo.com', 'Jack Mason', 'user'),
      ('f1c0a9b8-2d3e-4f5a-8b7c-9d0e1f2a3b11', 'admin.riley@dmqdemo.com', 'Riley Admin', 'admin'),
      ('9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c22', 'admin.morgan@dmqdemo.com', 'Morgan Admin', 'admin')
  ) as t(id, email, full_name, role)
)
insert into public.profiles (id, email, full_name, role)
select id, email, full_name, role
from demo_users
on conflict (id) do update
set email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    updated_at = now();
