// Test setup file
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Global test timeout
jest.setTimeout(30000);

// Mock external services for testing
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(() => Promise.resolve({
      messageId: 'test-message-id',
      response: 'test-response'
    }))
  }))
}));

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  messaging: jest.fn(() => ({
    sendMulticast: jest.fn(() => Promise.resolve({
      successCount: 1,
      failureCount: 0,
      responses: [{ success: true }]
    }))
  }))
}));

// Mock Sequelize to prevent database connections during tests
jest.mock('../app/db_con/index.js', () => ({
  define: jest.fn(() => ({
    create: jest.fn(() => Promise.resolve({})),
    findAll: jest.fn(() => Promise.resolve([])),
    count: jest.fn(() => Promise.resolve(10))
  })),
  close: jest.fn(() => Promise.resolve()),
  authenticate: jest.fn(() => Promise.resolve())
}));

// Global test helpers
global.testHelper = {
  createMockRequest: (body = {}, headers = {}) => ({
    body,
    headers,
    correlationId: 'test-correlation-id',
    ip: '127.0.0.1',
    originalUrl: '/test',
    method: 'POST'
  }),
  
  createMockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    return res;
  },
  
  createMockNext: () => jest.fn()
};

// Setup and teardown for database tests
beforeAll(async () => {
  // Setup test database if needed
});

afterAll(async () => {
  // Cleanup test database if needed
  // Close any remaining database connections
  const db = require('../app/db_con/index.js');
  if (db && db.close) {
    await db.close();
  }
});

// Console log suppression for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeEach(() => {
  // Suppress console logs during tests unless explicitly needed
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();
});

afterEach(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});
