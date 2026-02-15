-- Add cover_image_path column to products table
-- Spec: specs/entity-cover/spec.md → ROO-72
ALTER TABLE products ADD COLUMN cover_image_path TEXT;
