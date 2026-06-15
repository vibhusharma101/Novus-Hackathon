-- ============================================================
-- EPRx Exchange — Supabase Seed (run AFTER schema.sql)
-- Supabase Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- seller_credentials table (also in schema.sql; safe to re-run)
create table if not exists seller_credentials (
  id              uuid primary key default gen_random_uuid(),
  recycler_id     uuid not null unique references recyclers(id) on delete cascade,
  email           text not null unique,
  password_hash   text not null,
  created_at      timestamptz not null default now()
);

-- 10 demo seller accounts: vibhu1@gmail.com/Seller@1 … vibhu10@gmail.com/Seller@10
insert into seller_credentials (recycler_id, email, password_hash) values
  ('b38b4f72-8fa4-4405-be7b-cb00343db927', 'vibhu1@gmail.com',  '$2b$10$5s7YuN.ZD/nUtHaLiO/zVO7L6LGebHNk8V09pN3ByeY5suar7ovye'),
  ('9d20fd40-841c-4f84-a981-abef8c1c2a97', 'vibhu2@gmail.com',  '$2b$10$EzeiexfYxJMFy9n1kpQyHOXxMQ53GPnbvfvl6UHHk.KhwSwkudchW'),
  ('77d8c053-66d1-4ca1-a8aa-b784fc456624', 'vibhu3@gmail.com',  '$2b$10$WdB.X6Cp12aLLvA7xdWde.551meMKMH/EvfFFlSKZrE95AvhKQrry'),
  ('0869e172-b5ce-4914-ae61-7f380bd2e709', 'vibhu4@gmail.com',  '$2b$10$iJV.i2oRItP.tc4p/xoOCO47hEiBMX6mKI/hx0NgCi7jb3HaEpTw2'),
  ('424a3313-013b-444d-8211-8e80859d955b', 'vibhu5@gmail.com',  '$2b$10$enxqHhQ2nYmjoOhe0HMRU.wHD0BMxaZBQPYHK4gd81a34Izpras.q'),
  ('6d7f935d-f02c-438b-9716-a8c1d2be3c82', 'vibhu6@gmail.com',  '$2b$10$EcSob1o0Lj/tIImwHv1z9eS4Q6LIuW3Soi/b.SJb1pWizktVQ7b1u'),
  ('d8cfef7c-8c89-4f46-848a-c18ed2d0e843', 'vibhu7@gmail.com',  '$2b$10$vL4gDZi4skW0bMm085et.uo905wvRMqigcrt.kk7Glh5wZgrY2poe'),
  ('bd73d75b-e945-48cb-a948-e4dec8bf8d7c', 'vibhu8@gmail.com',  '$2b$10$GMF7EMgbWQMwE8Lm07XJn.WkzwPJiT1VDZ3LwJlP69XGLewhgeBJi'),
  ('15e4ff6d-7cc5-4f73-b258-7b7c3add9e99', 'vibhu9@gmail.com',  '$2b$10$c9jTaMa28X/AF8k12xlyn.YhmyrLCj2o449lTbNj8fRVivqzrhSU6'),
  ('5f6d3d15-ff7e-4cb0-8329-4ecf885eede0', 'vibhu10@gmail.com', '$2b$10$VW7yPPjhRf3DKK/d3MNOoO.K6gV7nzDxyw4m5WnRrsJSLmb1x0KDO')
on conflict (email) do update set password_hash = excluded.password_hash;
