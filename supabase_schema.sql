-- =======================================================
-- SUPABASE POSTGRESQL DATABASE SCHEMA - SCULPT & GLOW
-- =======================================================
-- Copy and paste this script directly into your Supabase SQL Editor
-- to instantly generate the live tables, constraints, and seed data.

-- 1. DROP EXISTING TABLES IF APPLICABLE (FOR CLEAN SLATE REBUILD)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS staff_shifts CASCADE;
DROP TABLE IF EXISTS waitlist CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS weight_logs CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS machines CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- 2. CREATE SYSTEM PREFERENCES TABLE
CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  salon_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  vat_rate NUMERIC DEFAULT 15,
  currency TEXT DEFAULT 'R',
  hours JSONB,
  sms_template TEXT,
  email_template TEXT
);

-- 3. CREATE USERS & RBAC TABLE
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'receptionist', 'therapist')),
  email TEXT,
  pin TEXT,
  commission_rate NUMERIC DEFAULT 10
);

-- 4. CREATE CRM CLIENTS RECORDS TABLE
CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  dob DATE,
  gender TEXT,
  allergies TEXT,
  medical TEXT,
  preferred_staff TEXT,
  loyalty_points INTEGER DEFAULT 0,
  vip_tier TEXT DEFAULT 'Bronze',
  notes TEXT,
  profile_photo TEXT
);

-- 5. CREATE CLIENTS BODY MEASUREMENTS WEIGHT LOGS TABLE
CREATE TABLE weight_logs (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  weight NUMERIC NOT NULL,
  waist NUMERIC,
  hips NUMERIC,
  photo TEXT
);

-- 6. CREATE CLINICAL EQUIPMENT TABLE
CREATE TABLE machines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  serial TEXT,
  purchase_date DATE,
  warranty_expiry DATE,
  service_interval NUMERIC DEFAULT 100, -- hours of use
  current_status TEXT DEFAULT 'Available' CHECK (current_status IN ('Available', 'In use', 'Maintenance', 'Out of service')),
  total_usage_hours NUMERIC DEFAULT 0,
  purchase_cost NUMERIC DEFAULT 0,
  revenue_generated NUMERIC DEFAULT 0
);

-- 7. CREATE SERVICES CATALOG TABLE
CREATE TABLE services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration INTEGER NOT NULL, -- minutes
  price NUMERIC NOT NULL,
  vat NUMERIC DEFAULT 15,
  required_machine TEXT REFERENCES machines(id) ON DELETE SET NULL,
  required_staff_type TEXT DEFAULT 'therapist',
  consumables JSONB -- [{itemId: 'inv-1', quantity: 50}]
);

-- 8. CREATE CLINICAL CONSUMABLES INVENTORY TABLE
CREATE TABLE inventory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 0,
  alert_at NUMERIC DEFAULT 10,
  unit TEXT DEFAULT 'pcs',
  cost NUMERIC DEFAULT 0,
  sell_price NUMERIC DEFAULT 0,
  supplier TEXT
);

-- 9. CREATE RETAIL PRODUCTS CATALOG TABLE
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC NOT NULL,
  stock INTEGER DEFAULT 0,
  image TEXT,
  description TEXT
);

-- 10. CREATE APPOINTMENTS SCHEDULE TABLE
CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  staff_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  room TEXT NOT NULL,
  machine_id TEXT REFERENCES machines(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  duration INTEGER NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Checked-in', 'In-progress', 'Completed', 'Cancelled', 'No-show')),
  notes TEXT
);

-- 11. CREATE SCHEDULER WAITLIST TABLE
CREATE TABLE waitlist (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  preferred_staff_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  date DATE DEFAULT CURRENT_DATE,
  notes TEXT
);

-- 12. CREATE INVOICES BILLING TABLE
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  items JSONB NOT NULL, -- [{name: 'Cleanser', quantity: 1, price: 320}]
  subtotal NUMERIC NOT NULL,
  tax NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  payments JSONB, -- [{date: '2026-05-30', amount: 320, method: 'Card', txnId: 'TXN-90211'}]
  status TEXT DEFAULT 'Unpaid' CHECK (status IN ('Paid', 'Partial', 'Unpaid', 'Refunded')),
  refund_reason TEXT
);

-- 13. CREATE QUOTATIONS TABLE
CREATE TABLE quotes (
  id TEXT PRIMARY KEY,
  quote_number TEXT UNIQUE NOT NULL,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  items JSONB NOT NULL,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Converted', 'Expired'))
);

-- 14. CREATE OPERATIONAL EXPENSES TABLE
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL
);

-- 15. CREATE STAFF ROSTER SHIFTS TABLE
CREATE TABLE staff_shifts (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  type TEXT DEFAULT 'Shift',
  is_leave BOOLEAN DEFAULT FALSE
);

-- 16. CREATE SECURITY AUDIT LOGS TABLE
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  action TEXT NOT NULL,
  details TEXT,
  prev_value TEXT,
  new_value TEXT
);


-- =======================================================
-- SEED DATA POPULATION
-- =======================================================

-- A. SEED BRAND SETTINGS
INSERT INTO settings VALUES (
  'set-1',
  'Sculpt & Glow Body shaping and Wellness Studio',
  '+27 (12) 998-2020',
  'info@sculptglow.co.za',
  'Shop 5, Glenwood Galleria, Garstfontein Rd, Pretoria East',
  15,
  'R',
  '{"weekdayStart": "08:00", "weekdayEnd": "18:00", "weekendStart": "09:00", "weekendEnd": "14:00"}',
  'Hi {client}, ready to get sculpted? Reminder for your {service} at Sculpt & Glow Pretoria East on {date} at {time}.',
  'Dear {client},\n\nWe look forward to hosting you for your scheduled wellness treatment {service} on {date} at {time}.\n\nRemember to wear comfortable activewear for infrared roll/cardio sessions.\n\nWarm regards,\nSculpt & Glow'
);

-- B. SEED RBAC USERS
INSERT INTO users VALUES ('usr-1', 'owner', 'Victoria Owner', 'owner', 'owner@sculptglow.co.za', '1234', 10);
INSERT INTO users VALUES ('usr-2', 'reception', 'Sarah Desk', 'receptionist', 'reception@sculptglow.co.za', '5678', 10);
INSERT INTO users VALUES ('usr-3', 'therapist', 'Jessica Laser', 'therapist', 'jessica@sculptglow.co.za', '9999', 12);

-- C. SEED CLIENTS CRM
INSERT INTO clients VALUES (
  'cli-101',
  'Alice Smith',
  'alice.smith@gmail.com',
  '+27 (82) 019-2834',
  '1990-06-15',
  'Female',
  'Lanolin, Peanuts',
  'Sensitive skin prone to redness',
  'Jessica Laser',
  34,
  'Silver',
  'Prefers lukewarm towels. Doing the Postpartum body rest program.',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
);
INSERT INTO clients VALUES (
  'cli-102',
  'Catherine Du Pont',
  'catherine.dp@hotmail.com',
  '+27 (71) 022-7711',
  '1995-02-10',
  'Female',
  'Penicillin, Lavender',
  'None',
  'Jessica Laser',
  62,
  'Gold',
  'A regular member. Loves Cryo Fat Freezing and Korean Corrective Facials.',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
);

-- D. SEED WEIGHT LOGS
INSERT INTO weight_logs VALUES ('wl-1', 'cli-101', '2026-05-01', 68.5, 78, 98, '/cover.jpg');
INSERT INTO weight_logs VALUES ('wl-2', 'cli-101', '2026-05-15', 66.8, 76, 96, '/logo.jpg');

-- E. SEED HARDWARE MACHINES
INSERT INTO machines VALUES ('vacutherm-alpha', 'Vacutherm Treadmill Pro', 'VT-990-X', '2025-02-15', '2027-02-15', 100, 'Available', 42.5, 280000.00, 19125.00);
INSERT INTO machines VALUES ('body-roller-1', 'Infrared Lymphatic Roller 1', 'IR-882-M', '2025-06-10', '2026-06-10', 150, 'Available', 124.0, 85000.00, 43400.00);
INSERT INTO machines VALUES ('rf-cavitation-unit', '3-in-1 RF Cavitation Sculptor', 'RF-441-Y', '2025-11-01', '2026-11-01', 80, 'Available', 68.0, 120000.00, 64600.00);
INSERT INTO machines VALUES ('cryo-angel-360', 'Cryo Angel 360 Fat Freezer', 'CA-360-Z', '2025-08-20', '2027-08-20', 120, 'Available', 32.0, 195000.00, 57600.00);

-- F. SEED SERVICES
INSERT INTO services VALUES ('srv-1', 'Vacutherm Treadmill Session', 'Infrared vacuum cardio for fat burning.', 'Body Contouring', 30, 450.00, 15, 'vacutherm-alpha', 'therapist', '[{"itemId": "inv-3", "quantity": 2}]');
INSERT INTO services VALUES ('srv-2', 'Infrared Body Roll Session', 'Deep tissue roll lymphatic rollers.', 'Drainage & Recovery', 45, 350.00, 15, 'body-roller-1', 'receptionist', '[{"itemId": "inv-3", "quantity": 1}]');
INSERT INTO services VALUES ('srv-3', 'Cavitation Body Sculpting', 'Non-invasive fat melting.', 'Body Contouring', 45, 950.00, 15, 'rf-cavitation-unit', 'therapist', '[{"itemId": "inv-1", "quantity": 50}, {"itemId": "inv-2", "quantity": 2}]');
INSERT INTO services VALUES ('srv-6', 'Cryo Angel 360 Fat Freezing', 'Cold lipid crystallisation freezer.', 'Body Contouring', 60, 1800.00, 15, 'cryo-angel-360', 'therapist', '[{"itemId": "inv-2", "quantity": 2}, {"itemId": "inv-3", "quantity": 2}]');
INSERT INTO services VALUES ('srv-11', 'Korean Corrective Facial', 'Seoul corrective glass-skin infusions.', 'Facials & Wellness', 60, 950.00, 15, NULL, 'therapist', '[{"itemId": "inv-4", "quantity": 1}, {"itemId": "inv-2", "quantity": 2}]');
INSERT INTO services VALUES ('srv-12', 'Full 3-in-1 Roster (Nails, Hair, Feet)', 'Blowout, luxury manicure, and pedicure.', 'Hair & Beauty', 120, 850.00, 15, NULL, 'receptionist', '[{"itemId": "inv-5", "quantity": 1}]');

-- G. SEED INVENTORY CONSUMABLES
INSERT INTO inventory VALUES ('inv-1', 'Premium Ultrasonic Gel', 2400, 500, 'ml', 0.05, 0, 'Sculpt-Supplies South Africa');
INSERT INTO inventory VALUES ('inv-2', 'Disposable Vinyl Gloves (Box 100)', 92, 20, 'box', 120.00, 0, 'Medical-Direct SA');
INSERT INTO inventory VALUES ('inv-3', 'Alcohol Disinfectant Wipes', 150, 30, 'pack', 65.00, 0, 'Medical-Direct SA');
INSERT INTO inventory VALUES ('inv-4', 'Korean Corrective Glass-Skin Ampoule', 12, 3, 'vial', 220.00, 450.00, 'Seoul Cosmetics Ltd');
INSERT INTO inventory VALUES ('inv-5', 'Luxury Gel Polish (OPI Gelcolor)', 18, 5, 'bottle', 180.00, 280.00, 'Nail-Tech Distributors');

-- H. SEED RETAIL PRODUCTS
INSERT INTO products VALUES ('prd-1', 'Korean Glow Daily Cleanser', 'Facial Products', 320.00, 15, 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=300', 'Foaming cleanser with green tea for glass glow.');
INSERT INTO products VALUES ('prd-2', 'Sculpt & Slim Thermogenic Gel', 'Weight Loss Products', 480.00, 24, 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=300', 'Sweat thermogenic gel for rollers targeting curves.');
INSERT INTO products VALUES ('prd-3', 'Korean Corrective Peptide Serum', 'Facial Products', 750.00, 8, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300', 'Matrix peptide serum restoring skin elasticity.');
INSERT INTO products VALUES ('prd-4', 'Sculpt & Glow Detox Shake (Vanilla)', 'Weight Loss Products', 550.00, 18, 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=300', 'Low-carb prebiotic meal replacement vanilla shake.');

-- I. SEED HISTORIC APPOINTMENTS
INSERT INTO appointments VALUES ('apt-201', 'cli-101', 'srv-1', 'usr-3', 'Treatment Room 1', 'vacutherm-alpha', '2026-05-30', '10:00', 30, 'Completed', 'Sweated heavily, client extremely pleased.');
INSERT INTO appointments VALUES ('apt-202', 'cli-102', 'srv-6', 'usr-3', 'Treatment Room 2', 'cryo-angel-360', '2026-05-30', '11:30', 60, 'Completed', 'Cryo lower abdomen successful.');

-- J. SEED INVOICES
INSERT INTO invoices VALUES (
  'inv-5001',
  'INV-2026-0001',
  'apt-201',
  'cli-101',
  '2026-05-30',
  '2026-05-30',
  '[{"name": "Vacutherm Treadmill Session [Service]", "price": 450, "quantity": 1}]',
  391.30,
  58.70,
  0,
  450.00,
  '[{"date": "2026-05-30", "amount": 450, "method": "Card", "txnId": "TXN-90211"}]',
  'Paid',
  ''
);

-- K. SEED EXPENSES
INSERT INTO expenses VALUES ('exp-1', 'Stock Purchases', 'Korean ampoules box replenishment', 2600.00, '2026-05-02');
INSERT INTO expenses VALUES ('exp-2', 'Rent', 'Studio Pretoria East monthly rental', 12000.00, '2026-05-01');

-- L. SEED STAFF SHIFTS
INSERT INTO staff_shifts VALUES ('shf-1', 'usr-3', '2026-05-30', '09:00', '18:00', 'Shift', FALSE);
INSERT INTO staff_shifts VALUES ('shf-2', 'usr-2', '2026-05-30', '08:00', '17:00', 'Shift', FALSE);

-- M. SEED AUDIT LOGS
INSERT INTO audit_logs VALUES ('log-1', 'SaaS Platform Technician', CURRENT_TIMESTAMP, 'System Init', 'Sculpt & Glow custom cloud DB structure generated successfully.', '', '');
