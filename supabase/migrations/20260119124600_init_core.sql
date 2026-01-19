-- Create Enums
CREATE TYPE product_type AS ENUM (
  'Core Rulebook', 
  'Adventure', 
  'Supplement', 
  'Zine', 
  'Quickstart', 
  'Other'
);

CREATE TYPE product_lang AS ENUM ('fi', 'sv', 'en');

-- Create Tables
CREATE TABLE publishers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  publisher_id UUID REFERENCES publishers(id) ON DELETE SET NULL,
  product_type product_type NOT NULL DEFAULT 'Other',
  year INTEGER,
  isbn TEXT,
  description TEXT,
  lang product_lang NOT NULL DEFAULT 'fi'
);

CREATE TABLE products_creators (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  role TEXT,
  PRIMARY KEY (product_id, creator_id, role)
);

-- Enable Row Level Security
ALTER TABLE publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE products_creators ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public Read Access
CREATE POLICY "Allow public read access for publishers" ON publishers FOR SELECT USING (true);
CREATE POLICY "Allow public read access for creators" ON creators FOR SELECT USING (true);
CREATE POLICY "Allow public read access for products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public read access for products_creators" ON products_creators FOR SELECT USING (true);

-- RLS Policies: Restricted Write Access (for now Admin key / service_role bypasses this)
-- We will refine this later with specific roles.
