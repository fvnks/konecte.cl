-- Create bug_reports table for storing bug reports from users
CREATE TABLE IF NOT EXISTS bug_reports (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NULL COMMENT 'Name of the person reporting the bug (optional)',
  email VARCHAR(100) NULL COMMENT 'Email of the person reporting the bug (optional)',
  page_url VARCHAR(2048) NULL COMMENT 'URL of the page where the bug was found',
  description TEXT NOT NULL COMMENT 'Description of the bug',
  steps_to_reproduce TEXT NULL COMMENT 'Steps to reproduce the bug (optional)',
  browser_device VARCHAR(500) NULL COMMENT 'Browser and device information (optional)',
  user_id VARCHAR(36) NULL COMMENT 'ID of the user if logged in',
  status ENUM('new', 'in_review', 'in_progress', 'fixed', 'wont_fix', 'duplicate', 'cannot_reproduce') DEFAULT 'new' COMMENT 'Status of the bug report',
  admin_notes TEXT NULL COMMENT 'Notes from administrators (internal)',
  is_read BOOLEAN DEFAULT FALSE COMMENT 'Whether the bug report has been read by an admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When the bug report was submitted',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'When the bug report was last updated'
);

-- Create index for faster lookup by status
CREATE INDEX idx_bug_reports_status ON bug_reports(status);

-- Create index for faster lookup by user_id
CREATE INDEX idx_bug_reports_user_id ON bug_reports(user_id);

-- Create index for faster lookup by is_read
CREATE INDEX idx_bug_reports_is_read ON bug_reports(is_read); 