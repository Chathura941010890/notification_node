-- Migration to update email_logs table structure for MySQL
-- Add new columns for enhanced email logging

-- Check and add columns one by one
SET @dbname = DATABASE();
SET @tablename = 'email_logs';

-- Add correlation_id column if it doesn't exist
SET @query = CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN correlation_id VARCHAR(255)');
SET @query = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'correlation_id') = 0,
               @query, 'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add cc column if it doesn't exist
SET @query = CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN cc TEXT');
SET @query = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'cc') = 0,
               @query, 'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add bcc column if it doesn't exist
SET @query = CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN bcc TEXT');
SET @query = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'bcc') = 0,
               @query, 'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add text_content column if it doesn't exist
SET @query = CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN text_content TEXT');
SET @query = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'text_content') = 0,
               @query, 'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add html_content column if it doesn't exist
SET @query = CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN html_content TEXT');
SET @query = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'html_content') = 0,
               @query, 'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add retry_count column if it doesn't exist
SET @query = CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN retry_count INT DEFAULT 0');
SET @query = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'retry_count') = 0,
               @query, 'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add updated_at column if it doesn't exist
SET @query = CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
SET @query = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'updated_at') = 0,
               @query, 'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create indexes (MySQL will ignore if they already exist)
CREATE INDEX idx_email_logs_correlation_id ON email_logs(correlation_id);
CREATE INDEX idx_email_logs_topic ON email_logs(topic);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_topic_status ON email_logs(topic, status);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at);

-- Update existing records to have default values
UPDATE email_logs 
SET 
    cc = COALESCE(cc, '[]'),
    bcc = COALESCE(bcc, '[]'),
    text_content = COALESCE(text_content, ''),
    html_content = COALESCE(html_content, ''),
    retry_count = COALESCE(retry_count, 0),
    updated_at = COALESCE(updated_at, created_at)
WHERE cc IS NULL OR updated_at IS NULL;
