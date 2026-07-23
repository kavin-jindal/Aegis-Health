-- ============================================================
-- AEGIS: All tables + RLS + seed data
-- ============================================================

CREATE TABLE family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  relation text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE member_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE UNIQUE,
  full_name text,
  relation text,
  date_of_birth date,
  gender text,
  location text,
  blood_group text,
  profile_photo_url text,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  name text NOT NULL,
  specialty text,
  phone text,
  clinic text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE checkups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL,
  checkup_date date NOT NULL,
  diagnosis text,
  notes text,
  follow_up_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE checkup_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkup_id uuid REFERENCES checkups(id) ON DELETE CASCADE,
  family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  title text,
  file_url text,
  file_type text,
  file_size bigint,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE checkup_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkup_id uuid REFERENCES checkups(id) ON DELETE CASCADE,
  family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method text,
  payment_date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL,
  name text NOT NULL,
  dosage text,
  frequency text,
  start_date date,
  end_date date,
  reminder_times text[],
  created_at timestamptz DEFAULT now()
);

CREATE TABLE medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_url text,
  record_type text,
  record_date date,
  hospital text,
  cost numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE checkup_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkup_id uuid REFERENCES checkups(id) ON DELETE CASCADE,
  family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size int,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE checkup_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkup_id uuid REFERENCES checkups(id) ON DELETE CASCADE,
  family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method text,
  payment_date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE fitness_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  steps int,
  calories int,
  water_ml int,
  sleep_hours numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE emergency_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  blood_group text,
  allergies text,
  conditions text,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE scraped_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_name text NOT NULL,
  seller text NOT NULL,
  price numeric,
  mrp numeric,
  pack_size text,
  in_stock boolean DEFAULT true,
  url text,
  scraped_at timestamptz DEFAULT now()
);

CREATE TABLE assistant_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  role text,
  content text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_name text,
  admin_email text,
  family_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- RLS: Enable on all tables with permissive allow-all policies
-- TEMPORARY: replace with per-family policy once auth is added.
-- ============================================================

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
-- TEMPORARY: replace with per-family policy once auth is added.
CREATE POLICY "allow_all_family_members" ON family_members FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE member_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_member_profiles" ON member_profiles FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
-- TEMPORARY: replace with per-family policy once auth is added.
CREATE POLICY "allow_all_doctors" ON doctors FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE checkups ENABLE ROW LEVEL SECURITY;
-- TEMPORARY: replace with per-family policy once auth is added.
CREATE POLICY "allow_all_checkups" ON checkups FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
-- TEMPORARY: replace with per-family policy once auth is added.
CREATE POLICY "allow_all_medicines" ON medicines FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
-- TEMPORARY: replace with per-family policy once auth is added.
CREATE POLICY "allow_all_medical_records" ON medical_records FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE fitness_logs ENABLE ROW LEVEL SECURITY;
-- TEMPORARY: replace with per-family policy once auth is added.
CREATE POLICY "allow_all_fitness_logs" ON fitness_logs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE emergency_info ENABLE ROW LEVEL SECURITY;
-- TEMPORARY: replace with per-family policy once auth is added.
CREATE POLICY "allow_all_emergency_info" ON emergency_info FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE checkup_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_checkup_documents" ON checkup_documents FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE checkup_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_checkup_payments" ON checkup_payments FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE scraped_prices ENABLE ROW LEVEL SECURITY;
-- TEMPORARY: replace with per-family policy once auth is added.
CREATE POLICY "allow_all_scraped_prices" ON scraped_prices FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;
-- TEMPORARY: replace with per-family policy once auth is added.
CREATE POLICY "allow_all_assistant_messages" ON assistant_messages FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_admin_settings" ON admin_settings FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Seed: 5 family members
-- ============================================================

INSERT INTO family_members (id, name, relation) VALUES
  ('a1b2c3d4-e5f6-4789-a012-345678901001', 'Sarthak', 'self'),
  ('a1b2c3d4-e5f6-4789-a012-345678901002', 'Priya', 'daughter'),
  ('a1b2c3d4-e5f6-4789-a012-345678901003', 'Dad', 'father'),
  ('a1b2c3d4-e5f6-4789-a012-345678901004', 'Mom', 'mother'),
  ('a1b2c3d4-e5f6-4789-a012-345678901005', 'Ananya', 'daughter');

-- ============================================================
-- Storage buckets: create via Supabase Dashboard
-- 1. "medical-records" (Public: ON)
-- 2. "profile-photos" (Public: ON)
-- 3. "checkup-documents" (Public: ON)
-- This cannot be done via SQL — must be done in the dashboard.
-- ============================================================
