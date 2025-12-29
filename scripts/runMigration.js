const { Sequelize } = require('sequelize');
const config = require('../app/config');

async function runMigration() {
    console.log('Starting manual migration...');
    
    const sequelize = new Sequelize(
        config.database.database,
        config.database.username,
        config.database.password,
        {
            host: config.database.host,
            port: config.database.port,
            dialect: config.database.dialect,
            logging: console.log
        }
    );

    try {
        // Test connection
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');

        // Run the migration SQL for MySQL
        const migrationSQL = `
            -- Add new columns if they don't exist (MySQL syntax)
            SET @dbname = DATABASE();
            SET @tablename = 'email_logs';

            -- Add correlation_id column
            SET @query = CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN correlation_id VARCHAR(255)');
            SET @query = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                           WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'correlation_id') = 0,
                           @query, 'SELECT 1');
            PREPARE stmt FROM @query;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;

            -- Add cc column
            SET @query = CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN cc TEXT');
            SET @query = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                           WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'cc') = 0,
                           @query, 'SELECT 1');
            PREPARE stmt FROM @query;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;

            -- Add bcc column
            SET @query = CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN bcc TEXT');
            SET @query = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                           WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'bcc') = 0,
                           @query, 'SELECT 1');
            PREPARE stmt FROM @query;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;

            -- Add text_content column
            SET @query = CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN text_content TEXT');
            SET @query = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                           WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'text_content') = 0,
                           @query, 'SELECT 1');
            PREPARE stmt FROM @query;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;

            -- Add html_content column
            SET @query = CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN html_content TEXT');
            SET @query = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                           WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'html_content') = 0,
                           @query, 'SELECT 1');
            PREPARE stmt FROM @query;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;

            -- Add retry_count column
            SET @query = CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN retry_count INT DEFAULT 0');
            SET @query = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                           WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'retry_count') = 0,
                           @query, 'SELECT 1');
            PREPARE stmt FROM @query;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;

            -- Add updated_at column
            SET @query = CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
            SET @query = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                           WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'updated_at') = 0,
                           @query, 'SELECT 1');
            PREPARE stmt FROM @query;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_email_logs_correlation_id ON email_logs(correlation_id);
            CREATE INDEX IF NOT EXISTS idx_email_logs_topic ON email_logs(topic);
            CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
            CREATE INDEX IF NOT EXISTS idx_email_logs_topic_status ON email_logs(topic, status);
            CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

            -- Update existing records with default values
            UPDATE email_logs 
            SET 
                cc = COALESCE(cc, '[]'),
                bcc = COALESCE(bcc, '[]'),
                text_content = COALESCE(text_content, ''),
                html_content = COALESCE(html_content, ''),
                retry_count = COALESCE(retry_count, 0),
                updated_at = COALESCE(updated_at, created_at)
            WHERE updated_at IS NULL OR cc IS NULL;
        `;

        await sequelize.query(migrationSQL);
        console.log('✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

if (require.main === module) {
    runMigration();
}

module.exports = runMigration;
