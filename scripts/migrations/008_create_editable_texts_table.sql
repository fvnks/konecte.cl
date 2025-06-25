-- Create editable_texts table for storing editable content
CREATE TABLE IF NOT EXISTS editable_texts (
  id VARCHAR(255) PRIMARY KEY COMMENT 'Unique identifier for the text, format: page_path:component_id',
  content_current TEXT NOT NULL COMMENT 'The current text content',
  page_path VARCHAR(255) NOT NULL COMMENT 'Path of the page where the text appears',
  component_id VARCHAR(255) NOT NULL COMMENT 'ID of the component within the page',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When this text was first created',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'When this text was last updated'
);

-- Create index for faster lookup by page path
CREATE INDEX idx_editable_texts_page_path ON editable_texts(page_path); 