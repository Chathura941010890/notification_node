const mysql = require('mysql2/promise');
const config = require('../app/config');

async function runMySQLMigration() {
    console.log('Starting MySQL migration...');
    
    let connection;
    
    try {
        // Create connection to MySQL
        connection = await mysql.createConnection({
            host: config.database.host,
            port: config.database.port,
            user: config.database.username,
            password: config.database.password,
            database: config.database.database,
            multipleStatements: true
        });

        console.log('✅ MySQL connection established successfully.');

        // Check if email_logs table exists
        const [tables] = await connection.execute(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = ? AND table_name = 'email_logs'
        `, [config.database.database]);

        if (tables[0].count === 0) {
            console.log('❌ email_logs table does not exist. Please create it first.');
            process.exit(1);
        }

        console.log('📋 Checking existing table structure...');
        const [columns] = await connection.execute(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = ? AND table_name = 'email_logs'
        `, [config.database.database]);

        const existingColumns = columns.map(col => col.column_name);
        console.log('Existing columns:', existingColumns);

        // Add missing columns one by one
        const columnsToAdd = [
            { name: 'correlation_id', sql: 'ADD COLUMN correlation_id VARCHAR(255)' },
            { name: 'cc', sql: 'ADD COLUMN cc TEXT' },
            { name: 'bcc', sql: 'ADD COLUMN bcc TEXT' },
            { name: 'text_content', sql: 'ADD COLUMN text_content TEXT' },
            { name: 'html_content', sql: 'ADD COLUMN html_content TEXT' },
            { name: 'retry_count', sql: 'ADD COLUMN retry_count INT DEFAULT 0' },
            { name: 'updated_at', sql: 'ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
        ];

        for (const column of columnsToAdd) {
            if (!existingColumns.includes(column.name)) {
                try {
                    await connection.execute(`ALTER TABLE email_logs ${column.sql}`);
                    console.log(`✅ Added column: ${column.name}`);
                } catch (error) {
                    console.log(`⚠️  Column ${column.name} might already exist or error occurred:`, error.message);
                }
            } else {
                console.log(`✅ Column ${column.name} already exists`);
            }
        }

        // Create indexes
        const indexesToCreate = [
            'CREATE INDEX idx_email_logs_correlation_id ON email_logs(correlation_id)',
            'CREATE INDEX idx_email_logs_topic ON email_logs(topic)',
            'CREATE INDEX idx_email_logs_status ON email_logs(status)',
            'CREATE INDEX idx_email_logs_topic_status ON email_logs(topic, status)',
            'CREATE INDEX idx_email_logs_created_at ON email_logs(created_at)'
        ];

        for (const indexSQL of indexesToCreate) {
            try {
                await connection.execute(indexSQL);
                console.log(`✅ Created index: ${indexSQL.split(' ')[2]}`);
            } catch (error) {
                if (error.code === 'ER_DUP_KEYNAME') {
                    console.log(`✅ Index ${indexSQL.split(' ')[2]} already exists`);
                } else {
                    console.log(`⚠️  Index creation warning:`, error.message);
                }
            }
        }

        // Update existing records with default values
        await connection.execute(`
            UPDATE email_logs 
            SET 
                cc = COALESCE(cc, '[]'),
                bcc = COALESCE(bcc, '[]'),
                text_content = COALESCE(text_content, ''),
                html_content = COALESCE(html_content, ''),
                retry_count = COALESCE(retry_count, 0)
            WHERE cc IS NULL OR bcc IS NULL OR text_content IS NULL OR retry_count IS NULL
        `);

        console.log('✅ Updated existing records with default values');
        console.log('🎉 MySQL migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        if (error.code) {
            console.error('Error code:', error.code);
        }
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

if (require.main === module) {
    runMySQLMigration();
}

module.exports = runMySQLMigration;
