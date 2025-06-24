-- Add publication_code to requests table
ALTER TABLE requests ADD COLUMN publication_code VARCHAR(15) NULL;

-- Add a unique index to the new column
CREATE UNIQUE INDEX idx_publication_code_requests ON requests(publication_code);

-- Backfill existing requests with a placeholder code
UPDATE requests SET publication_code = CONCAT('S-', LPAD(id, 6, '0')) WHERE publication_code IS NULL; 