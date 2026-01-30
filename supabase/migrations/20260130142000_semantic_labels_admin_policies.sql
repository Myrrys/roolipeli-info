-- Migration: Add admin write policies for semantic labels
-- Fixes missing RLS write policies from initial migration

-- Admin write policies for semantic_labels
CREATE POLICY "Allow admin insert for semantic_labels" 
  ON semantic_labels FOR INSERT 
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Allow admin update for semantic_labels" 
  ON semantic_labels FOR UPDATE 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Allow admin delete for semantic_labels" 
  ON semantic_labels FOR DELETE 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Admin write policies for product_semantic_labels
CREATE POLICY "Allow admin insert for product_semantic_labels" 
  ON product_semantic_labels FOR INSERT 
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Allow admin update for product_semantic_labels" 
  ON product_semantic_labels FOR UPDATE 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Allow admin delete for product_semantic_labels" 
  ON product_semantic_labels FOR DELETE 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
