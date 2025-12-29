'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table exists first
    const tableExists = await queryInterface.tableExists('email_logs');
    
    if (!tableExists) {
      // Create table if it doesn't exist
      await queryInterface.createTable('email_logs', {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },
        correlation_id: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        topic: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        recipients: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        cc: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        bcc: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        subject: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        text_content: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        html_content: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        status: {
          type: Sequelize.ENUM('success', 'failure'),
          allowNull: false,
        },
        error_message: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        retry_count: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW
        }
      });
    } else {
      // Table exists, add missing columns
      const tableInfo = await queryInterface.describeTable('email_logs');
      
      // Add missing columns if they don't exist
      if (!tableInfo.correlation_id) {
        await queryInterface.addColumn('email_logs', 'correlation_id', {
          type: Sequelize.STRING,
          allowNull: true,
        });
      }
      
      if (!tableInfo.cc) {
        await queryInterface.addColumn('email_logs', 'cc', {
          type: Sequelize.TEXT,
          allowNull: true,
        });
      }
      
      if (!tableInfo.bcc) {
        await queryInterface.addColumn('email_logs', 'bcc', {
          type: Sequelize.TEXT,
          allowNull: true,
        });
      }
      
      if (!tableInfo.text_content) {
        await queryInterface.addColumn('email_logs', 'text_content', {
          type: Sequelize.TEXT,
          allowNull: true,
        });
      }
      
      if (!tableInfo.html_content) {
        await queryInterface.addColumn('email_logs', 'html_content', {
          type: Sequelize.TEXT,
          allowNull: true,
        });
      }
      
      if (!tableInfo.retry_count) {
        await queryInterface.addColumn('email_logs', 'retry_count', {
          type: Sequelize.INTEGER,
          defaultValue: 0
        });
      }
      
      if (!tableInfo.updated_at) {
        await queryInterface.addColumn('email_logs', 'updated_at', {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW
        });
      }
    }

    // Add indexes
    await queryInterface.addIndex('email_logs', ['correlation_id'], {
      name: 'idx_email_logs_correlation_id',
      unique: false
    });
    
    await queryInterface.addIndex('email_logs', ['topic'], {
      name: 'idx_email_logs_topic',
      unique: false
    });
    
    await queryInterface.addIndex('email_logs', ['status'], {
      name: 'idx_email_logs_status',
      unique: false
    });
    
    await queryInterface.addIndex('email_logs', ['topic', 'status'], {
      name: 'idx_email_logs_topic_status',
      unique: false
    });
    
    await queryInterface.addIndex('email_logs', ['created_at'], {
      name: 'idx_email_logs_created_at',
      unique: false
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('email_logs', 'idx_email_logs_correlation_id');
    await queryInterface.removeIndex('email_logs', 'idx_email_logs_topic');
    await queryInterface.removeIndex('email_logs', 'idx_email_logs_status');
    await queryInterface.removeIndex('email_logs', 'idx_email_logs_topic_status');
    await queryInterface.removeIndex('email_logs', 'idx_email_logs_created_at');
    
    // Remove added columns (keep original structure)
    await queryInterface.removeColumn('email_logs', 'correlation_id');
    await queryInterface.removeColumn('email_logs', 'cc');
    await queryInterface.removeColumn('email_logs', 'bcc');
    await queryInterface.removeColumn('email_logs', 'text_content');
    await queryInterface.removeColumn('email_logs', 'html_content');
    await queryInterface.removeColumn('email_logs', 'retry_count');
    await queryInterface.removeColumn('email_logs', 'updated_at');
  }
};
