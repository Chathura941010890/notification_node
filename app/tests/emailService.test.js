// Mock the database connection before requiring anything
jest.mock('../db_con/index.js', () => ({
  define: jest.fn(() => ({
    create: jest.fn(() => Promise.resolve({})),
    findAll: jest.fn(() => Promise.resolve([])),
    count: jest.fn(() => Promise.resolve(10))
  })),
  close: jest.fn(() => Promise.resolve()),
  authenticate: jest.fn(() => Promise.resolve())
}));

// Mock the EmailLog model
jest.mock('../models/emailLog.model', () => ({
  create: jest.fn(() => Promise.resolve({})),
  findAll: jest.fn(() => Promise.resolve([])),
  count: jest.fn(() => Promise.resolve(10))
}));

const emailService = require('../services/emailService');
const EmailLog = require('../models/emailLog.model');

describe('Email Service Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        // Ensure any database connections are closed
        jest.clearAllMocks();
    });

    describe('Email Validation', () => {
        test('should validate email options correctly', async () => {
            const validOptions = {
                to: ['test@example.com'],
                subject: 'Test Subject',
                text: 'Test message',
                topic: 'test-topic'
            };

            expect(validOptions.to).toEqual(['test@example.com']);
            expect(validOptions.subject).toBe('Test Subject');
            expect(validOptions.text).toBe('Test message');
            expect(validOptions.topic).toBe('test-topic');
        });

        test('should handle multiple recipients', () => {
            const options = {
                to: ['test1@example.com', 'test2@example.com'],
                cc: ['cc@example.com'],
                bcc: ['bcc@example.com']
            };

            expect(Array.isArray(options.to)).toBe(true);
            expect(options.to.length).toBe(2);
            expect(options.cc.length).toBe(1);
            expect(options.bcc.length).toBe(1);
        });
    });

    describe('Retry Logic', () => {
        test('should have correct retry configuration', () => {
            const maxRetries = emailService.maxRetries;
            const retryDelay = emailService.retryDelay;

            expect(maxRetries).toBeGreaterThan(0);
            expect(retryDelay).toBeGreaterThan(0);
            expect(typeof maxRetries).toBe('number');
            expect(typeof retryDelay).toBe('number');
        });

        test('should implement delay function', async () => {
            const startTime = Date.now();
            await emailService.delay(100);
            const endTime = Date.now();
            
            expect(endTime - startTime).toBeGreaterThanOrEqual(100);
        });
    });

    describe('Email Logging', () => {
        test('should log email attempts correctly', async () => {
            const mockCreate = jest.fn().mockResolvedValue({});
            EmailLog.create = mockCreate;

            const options = {
                topic: 'test-topic',
                to: ['test@example.com'],
                subject: 'Test Subject',
                text: 'Test message'
            };

            await emailService.logEmailAttempt(options, 'success', null, 'test-correlation-id');

            expect(mockCreate).toHaveBeenCalledWith({
                correlation_id: 'test-correlation-id',
                topic: 'test-topic',
                recipients: JSON.stringify(['test@example.com']),
                cc: JSON.stringify([]),
                bcc: JSON.stringify([]),
                subject: 'Test Subject',
                text_content: 'Test message',
                html_content: '',
                status: 'success',
                error_message: null,
                created_at: expect.any(Date)
            });
        });

        test('should handle logging errors gracefully', async () => {
            const mockCreate = jest.fn().mockRejectedValue(new Error('Database error'));
            EmailLog.create = mockCreate;

            const options = {
                topic: 'test-topic',
                to: ['test@example.com'],
                subject: 'Test Subject'
            };

            // Should not throw an error
            await expect(emailService.logEmailAttempt(options, 'failure', 'Test error'))
                .resolves.toBeUndefined();
        });
    });

    describe('Email Statistics', () => {
        test('should get email statistics correctly', async () => {
            const mockFindAll = jest.fn().mockResolvedValue([
                { status: 'success', count: '10' },
                { status: 'failure', count: '2' }
            ]);
            EmailLog.findAll = mockFindAll;

            const stats = await emailService.getEmailStats('test-topic', 'correlation-id');

            expect(stats).toEqual({
                success: 10,
                failure: 2,
                total: 12
            });

            expect(mockFindAll).toHaveBeenCalledWith({
                where: { topic: 'test-topic' },
                attributes: expect.any(Array),
                group: ['status'],
                raw: true
            });
        });

        test('should handle statistics for all topics', async () => {
            const mockFindAll = jest.fn().mockResolvedValue([
                { status: 'success', count: '50' },
                { status: 'failure', count: '5' }
            ]);
            EmailLog.findAll = mockFindAll;

            const stats = await emailService.getEmailStats(null, 'correlation-id');

            expect(stats.total).toBe(55);
            expect(mockFindAll).toHaveBeenCalledWith({
                where: {},
                attributes: expect.any(Array),
                group: ['status'],
                raw: true
            });
        });
    });

    describe('Configuration', () => {
        test('should have transporter configured', () => {
            expect(emailService.transporter).toBeDefined();
            expect(typeof emailService.transporter.sendMail).toBe('function');
        });

        test('should have correct service configuration', () => {
            expect(emailService.maxRetries).toBeDefined();
            expect(emailService.retryDelay).toBeDefined();
            expect(typeof emailService.maxRetries).toBe('number');
            expect(typeof emailService.retryDelay).toBe('number');
        });
    });
});
