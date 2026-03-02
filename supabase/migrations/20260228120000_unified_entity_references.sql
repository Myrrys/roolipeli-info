-- Migration: Unified Entity References
-- Spec: specs/entity-references/spec.md → ROO-26
--
-- Replaces per-entity reference tables (product_references, game_references)
-- with a single polymorphic entity_references table.
-- Adds reference support for publishers and creators.
-- Public read, admin-only write via app_metadata.

-- 1. Create entity_references table
CREATE TABLE entity_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  reference_type TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  citation_details JSONB
);

-- 2. Entity type constraint
ALTER TABLE entity_references
  ADD CONSTRAINT chk_entity_type
  CHECK (entity_type IN ('product', 'game', 'publisher', 'creator'));

-- 3. Composite index for primary lookup pattern
CREATE INDEX idx_entity_references_lookup
  ON entity_references (entity_type, entity_id);

-- 4. Enable Row Level Security
ALTER TABLE entity_references ENABLE ROW LEVEL SECURITY;

-- 5. RLS: Public read access
CREATE POLICY "Allow public read access for entity_references"
  ON entity_references FOR SELECT
  USING (true);

-- 6. RLS: Admin-only INSERT
CREATE POLICY "Admin insert access for entity_references"
  ON entity_references FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- 7. RLS: Admin-only UPDATE
CREATE POLICY "Admin update access for entity_references"
  ON entity_references FOR UPDATE
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- 8. RLS: Admin-only DELETE
CREATE POLICY "Admin delete access for entity_references"
  ON entity_references FOR DELETE
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- 9. Cleanup trigger function (shared by all entity tables)
CREATE OR REPLACE FUNCTION cleanup_entity_references()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM entity_references
  WHERE entity_type = TG_ARGV[0]
    AND entity_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 10. Cleanup triggers for each entity table
CREATE TRIGGER trg_products_cleanup_references
  AFTER DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_entity_references('product');

CREATE TRIGGER trg_games_cleanup_references
  AFTER DELETE ON games
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_entity_references('game');

CREATE TRIGGER trg_publishers_cleanup_references
  AFTER DELETE ON publishers
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_entity_references('publisher');

CREATE TRIGGER trg_creators_cleanup_references
  AFTER DELETE ON creators
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_entity_references('creator');

-- 11. Insert validation trigger function
CREATE OR REPLACE FUNCTION validate_entity_reference()
RETURNS TRIGGER AS $$
DECLARE
  entity_exists BOOLEAN;
BEGIN
  EXECUTE format(
    'SELECT EXISTS(SELECT 1 FROM %I WHERE id = $1)',
    CASE NEW.entity_type
      WHEN 'product' THEN 'products'
      WHEN 'game' THEN 'games'
      WHEN 'publisher' THEN 'publishers'
      WHEN 'creator' THEN 'creators'
      ELSE NULL
    END
  ) INTO entity_exists USING NEW.entity_id;

  IF NOT entity_exists THEN
    RAISE EXCEPTION 'Entity % with id % does not exist',
      NEW.entity_type, NEW.entity_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Validation trigger BEFORE INSERT OR UPDATE
CREATE TRIGGER trg_validate_entity_reference
  BEFORE INSERT OR UPDATE ON entity_references
  FOR EACH ROW
  EXECUTE FUNCTION validate_entity_reference();

-- 13. Data migration from product_references
INSERT INTO entity_references (id, entity_type, entity_id, reference_type, label, url, citation_details, created_at)
SELECT id, 'product', product_id, reference_type, label, url, citation_details, created_at
FROM product_references;

-- 14. Data migration from game_references
INSERT INTO entity_references (id, entity_type, entity_id, reference_type, label, url, citation_details, created_at)
SELECT id, 'game', game_id, reference_type, label, url, citation_details, created_at
FROM game_references;

-- 15. Drop old tables
DROP TABLE product_references;
DROP TABLE game_references;
