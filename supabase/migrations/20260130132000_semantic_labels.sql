-- Migration: Add Semantic Labels System
-- Tables for Wikidata-linked semantic labels for products

-- Create semantic_labels table
CREATE TABLE semantic_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  label TEXT NOT NULL,
  wikidata_id TEXT,
  description TEXT,
  CONSTRAINT unique_wikidata_id UNIQUE (wikidata_id)
);

-- Create join table for product-label relationships
CREATE TABLE product_semantic_labels (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  label_id UUID REFERENCES semantic_labels(id) ON DELETE CASCADE,
  idx INTEGER DEFAULT 0,
  PRIMARY KEY (product_id, label_id)
);

-- Enable Row Level Security
ALTER TABLE semantic_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_semantic_labels ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public Read Access
CREATE POLICY "Allow public read access for semantic_labels" ON semantic_labels FOR SELECT USING (true);
CREATE POLICY "Allow public read access for product_semantic_labels" ON product_semantic_labels FOR SELECT USING (true);

-- Create index for efficient label lookups by product
CREATE INDEX idx_product_semantic_labels_product ON product_semantic_labels(product_id);
CREATE INDEX idx_product_semantic_labels_label ON product_semantic_labels(label_id);
