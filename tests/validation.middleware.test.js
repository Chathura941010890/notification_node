const { validateEmailData, validateNotificationData } = require('../app/middleware/validation');

describe('Validation Middleware Tests', () => {
    let req, res, next;

    beforeEach(() => {
        req = testHelper.createMockRequest();
        res = testHelper.createMockResponse();
        next = testHelper.createMockNext();
    });

    describe('validateEmailData', () => {
        test('should pass validation with valid email data', () => {
            req.body = {
                to: ['test@example.com'],
                subject: 'Test Subject',
                text: 'Test message'
            };

            validateEmailData(req, res, next);

            expect(next).toHaveBeenCalledWith();
            expect(next).not.toHaveBeenCalledWith(expect.any(Error));
        });

        test('should fail validation with empty recipients', () => {
            req.body = {
                to: [],
                subject: 'Test Subject',
                text: 'Test message'
            };

            validateEmailData(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('Recipients (to) field is required')
            }));
        });

        test('should fail validation without subject', () => {
            req.body = {
                to: ['test@example.com'],
                subject: '',
                text: 'Test message'
            };

            validateEmailData(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('Subject field is required')
            }));
        });

        test('should fail validation without text or html', () => {
            req.body = {
                to: ['test@example.com'],
                subject: 'Test Subject'
            };

            validateEmailData(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('Either text or html content is required')
            }));
        });

        test('should pass validation with html content only', () => {
            req.body = {
                to: ['test@example.com'],
                subject: 'Test Subject',
                html: '<h1>Test message</h1>'
            };

            validateEmailData(req, res, next);

            expect(next).toHaveBeenCalledWith();
        });

        test('should validate email format', () => {
            req.body = {
                to: ['invalid-email'],
                subject: 'Test Subject',
                text: 'Test message'
            };

            validateEmailData(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('Invalid email addresses')
            }));
        });

        test('should validate CC and BCC email formats', () => {
            req.body = {
                to: ['test@example.com'],
                cc: ['invalid-cc-email'],
                bcc: ['valid@example.com'],
                subject: 'Test Subject',
                text: 'Test message'
            };

            validateEmailData(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('Invalid CC email addresses')
            }));
        });
    });

    describe('validateNotificationData', () => {
        test('should pass validation with valid notification data', () => {
            req.body = {
                deviceTokens: ['token1', 'token2'],
                title: 'Test Title',
                body: 'Test body'
            };

            validateNotificationData(req, res, next);

            expect(next).toHaveBeenCalledWith();
        });

        test('should fail validation with empty device tokens', () => {
            req.body = {
                deviceTokens: [],
                title: 'Test Title',
                body: 'Test body'
            };

            validateNotificationData(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('Device tokens are required')
            }));
        });

        test('should fail validation without title', () => {
            req.body = {
                deviceTokens: ['token1'],
                title: '',
                body: 'Test body'
            };

            validateNotificationData(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('Title is required')
            }));
        });

        test('should fail validation without body', () => {
            req.body = {
                deviceTokens: ['token1'],
                title: 'Test Title',
                body: ''
            };

            validateNotificationData(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('Body is required')
            }));
        });

        test('should validate device token format', () => {
            req.body = {
                deviceTokens: ['valid-token', '', 'another-token'],
                title: 'Test Title',
                body: 'Test body'
            };

            validateNotificationData(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('All device tokens must be non-empty strings')
            }));
        });
    });
});
