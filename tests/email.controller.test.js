const request = require('supertest');
const express = require('express');
const { sendEmailController, getEmailStatsController, getEmailLogsController } = require('../app/controllers/email.controller');
const { validateEmailData } = require('../app/middleware/validation');
const { addCorrelationId } = require('../app/middleware/common');
const { errorHandler } = require('../app/middleware/errorHandler');

// Create test app
const app = express();
app.use(express.json());
app.use(addCorrelationId);

// Test routes
app.post('/email/send', validateEmailData, sendEmailController);
app.get('/email/stats', getEmailStatsController);
app.get('/email/logs', getEmailLogsController);

// Add error handler middleware
app.use(errorHandler);

// Mock emailService
jest.mock('../app/services/emailService', () => ({
    sendEmailWithRetry: jest.fn(),
    logEmailAttempt: jest.fn(),
    getEmailStats: jest.fn(),
    getEmailLogs: jest.fn(),
    getEmailLogsCount: jest.fn()
}));

// Mock the database connection
jest.mock('../app/db_con/index.js', () => ({
  define: jest.fn(() => ({
    create: jest.fn(() => Promise.resolve({})),
    findAll: jest.fn(() => Promise.resolve([]))
  })),
  close: jest.fn(() => Promise.resolve()),
  authenticate: jest.fn(() => Promise.resolve())
}));

// Mock EmailLog model
jest.mock('../app/models/emailLog.model', () => ({
    create: jest.fn(() => Promise.resolve({})),
    findAll: jest.fn(() => Promise.resolve([]))
}));

const emailService = require('../app/services/emailService');

describe('Email Controller Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        // Ensure any database connections are closed
        jest.clearAllMocks();
    });

    describe('POST /email/send', () => {
        test('should send email successfully', async () => {
            const mockResult = {
                success: true,
                messageId: 'test-message-id',
                response: 'Email sent'
            };

            emailService.sendEmailWithRetry.mockResolvedValue(mockResult);
            emailService.logEmailAttempt.mockResolvedValue();

            const emailData = {
                to: ['test@example.com'],
                subject: 'Test Subject',
                text: 'Test message',
                topic: 'test-topic'
            };

            const response = await request(app)
                .post('/email/send')
                .send(emailData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.messageId).toBe('test-message-id');
            expect(response.headers['x-correlation-id']).toBeDefined();
        });

        test('should validate required fields', async () => {
            const invalidData = {
                to: [], // Empty array
                subject: 'Test Subject'
                // Missing text/html
            };

            const response = await request(app)
                .post('/email/send')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('required');
        });

        test('should validate email addresses', async () => {
            const invalidData = {
                to: ['invalid-email'],
                subject: 'Test Subject',
                text: 'Test message'
            };

            const response = await request(app)
                .post('/email/send')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Invalid email');
        });
    });

    describe('GET /email/stats', () => {
        test('should get email statistics', async () => {
            const mockStats = {
                success: 100,
                failure: 5,
                total: 105
            };

            emailService.getEmailStats.mockResolvedValue(mockStats);

            const response = await request(app)
                .get('/email/stats')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.stats).toEqual(mockStats);
        });

        test('should get statistics for specific topic', async () => {
            const mockStats = {
                success: 50,
                failure: 2,
                total: 52
            };

            emailService.getEmailStats.mockResolvedValue(mockStats);

            const response = await request(app)
                .get('/email/stats?topic=test-topic')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.topic).toBe('test-topic');
            expect(emailService.getEmailStats).toHaveBeenCalledWith('test-topic', expect.any(String));
        });
    });

    describe('GET /email/logs', () => {
        test('should get email logs with pagination', async () => {
            const mockLogs = [
                {
                    id: 1,
                    correlationId: 'test-correlation-1',
                    topic: 'test-topic',
                    recipients: ['test1@example.com'],
                    cc: [],
                    bcc: [],
                    subject: 'Test Subject 1',
                    status: 'success',
                    errorMessage: null,
                    retryCount: 0,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 2,
                    correlationId: 'test-correlation-2', 
                    topic: 'test-topic',
                    recipients: ['test2@example.com'],
                    cc: [],
                    bcc: [],
                    subject: 'Test Subject 2',
                    status: 'failure',
                    errorMessage: 'SMTP Error',
                    retryCount: 1,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            emailService.getEmailLogs.mockResolvedValue(mockLogs);
            emailService.getEmailLogsCount.mockResolvedValue(2);

            const response = await request(app)
                .get('/email/logs?page=1&limit=50')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.pagination.currentPage).toBe(1);
            expect(response.body.pagination.totalRecords).toBe(2);
            expect(response.body.pagination.limit).toBe(50);
        });

        test('should filter email logs by status', async () => {
            emailService.getEmailLogs.mockResolvedValue([]);
            emailService.getEmailLogsCount.mockResolvedValue(0);

            const response = await request(app)
                .get('/email/logs?status=failure')
                .expect(200);

            expect(emailService.getEmailLogs).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'failure' }),
                0,
                50
            );
        });
    });
});
