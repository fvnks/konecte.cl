-- Add publication_code to properties table
ALTER TABLE properties ADD COLUMN publication_code VARCHAR(15) NULL;

-- Add a unique index to the new column
CREATE UNIQUE INDEX idx_publication_code_properties ON properties(publication_code);

-- Backfill existing properties with a placeholder code to avoid issues
-- This will be updated later by a backfill script
UPDATE properties SET publication_code = CONCAT('P-', LPAD(id, 6, '0')) WHERE publication_code IS NULL; 