-- Create bug_reports table for storing bug reports from users
CREATE TABLE IF NOT EXISTS bug_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  page_url VARCHAR(2048),
  description TEXT NOT NULL,
  steps_to_reproduce TEXT,
  browser_device VARCHAR(255),
  user_id VARCHAR(255),
  status ENUM('new', 'in_review', 'in_progress', 'fixed', 'wont_fix', 'duplicate', 'cannot_reproduce') DEFAULT 'new',
  admin_notes TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create index for faster lookup by status
CREATE INDEX idx_bug_reports_status ON bug_reports(status);

-- Create index for faster lookup by user_id
CREATE INDEX idx_bug_reports_user_id ON bug_reports(user_id);

-- Create index for faster lookup by is_read
CREATE INDEX idx_bug_reports_is_read ON bug_reports(is_read); 