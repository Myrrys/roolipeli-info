-- Migration: Add Games Entity
-- Spec: specs/rpg-entity/spec.md → ROO-97
--
-- Creates games, games_creators, game_semantic_labels, game_references,
-- game_based_on tables. Adds nullable game_id FK to products.
-- Public read, admin-only write on all new tables.

-- Create games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  publisher_id UUID REFERENCES publishers(id) ON DELETE SET NULL,
  number_of_players TEXT,
  in_language product_lang,
  url TEXT,
  license TEXT,
  image_url TEXT
);

-- Create games_creators join table
CREATE TABLE games_creators (
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  PRIMARY KEY (game_id, creator_id, role)
);

-- Create game_semantic_labels join table
CREATE TABLE game_semantic_labels (
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES semantic_labels(id) ON DELETE CASCADE,
  idx INTEGER DEFAULT 0,
  PRIMARY KEY (game_id, label_id)
);

-- Create game_references table
CREATE TABLE game_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  reference_type TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  citation_details JSONB
);

-- Create game_based_on table
-- Each row represents one "isBasedOn" relationship.
-- Exactly one of based_on_game_id or based_on_url must be non-null.
CREATE TABLE game_based_on (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  based_on_game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  based_on_url TEXT,
  label TEXT NOT NULL,
  CONSTRAINT check_exactly_one_source CHECK (
    (based_on_game_id IS NOT NULL AND based_on_url IS NULL)
    OR (based_on_game_id IS NULL AND based_on_url IS NOT NULL)
  )
);

-- Add nullable game_id FK to products
ALTER TABLE products
  ADD COLUMN game_id UUID REFERENCES games(id) ON DELETE SET NULL;

-- Enable Row Level Security on all new tables
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE games_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_semantic_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_based_on ENABLE ROW LEVEL SECURITY;

-- RLS: Public read access
CREATE POLICY "Allow public read access for games"
  ON games FOR SELECT USING (true);

CREATE POLICY "Allow public read access for games_creators"
  ON games_creators FOR SELECT USING (true);

CREATE POLICY "Allow public read access for game_semantic_labels"
  ON game_semantic_labels FOR SELECT USING (true);

CREATE POLICY "Allow public read access for game_references"
  ON game_references FOR SELECT USING (true);

CREATE POLICY "Allow public read access for game_based_on"
  ON game_based_on FOR SELECT USING (true);

-- RLS: Admin-only INSERT
CREATE POLICY "Admin insert access for games" ON games
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin insert access for games_creators" ON games_creators
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin insert access for game_semantic_labels" ON game_semantic_labels
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin insert access for game_references" ON game_references
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin insert access for game_based_on" ON game_based_on
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- RLS: Admin-only UPDATE
CREATE POLICY "Admin update access for games" ON games
  FOR UPDATE USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin update access for games_creators" ON games_creators
  FOR UPDATE USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin update access for game_semantic_labels" ON game_semantic_labels
  FOR UPDATE USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin update access for game_references" ON game_references
  FOR UPDATE USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin update access for game_based_on" ON game_based_on
  FOR UPDATE USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- RLS: Admin-only DELETE
CREATE POLICY "Admin delete access for games" ON games
  FOR DELETE USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin delete access for games_creators" ON games_creators
  FOR DELETE USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin delete access for game_semantic_labels" ON game_semantic_labels
  FOR DELETE USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin delete access for game_references" ON game_references
  FOR DELETE USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin delete access for game_based_on" ON game_based_on
  FOR DELETE USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Indexes for FK columns
CREATE INDEX idx_games_publisher ON games(publisher_id);
CREATE INDEX idx_games_creators_game ON games_creators(game_id);
CREATE INDEX idx_games_creators_creator ON games_creators(creator_id);
CREATE INDEX idx_game_semantic_labels_game ON game_semantic_labels(game_id);
CREATE INDEX idx_game_semantic_labels_label ON game_semantic_labels(label_id);
CREATE INDEX idx_game_references_game ON game_references(game_id);
CREATE INDEX idx_game_based_on_game ON game_based_on(game_id);
CREATE INDEX idx_game_based_on_internal ON game_based_on(based_on_game_id);
CREATE INDEX idx_products_game ON products(game_id);
