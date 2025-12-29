
# Notification Service
---

## Overview

The Notification Service is a robust, production-ready Node.js microservice designed to handle email and push notifications, device token management, and health monitoring for distributed systems. It is built with Express, Sequelize (MySQL), Nodemailer, Firebase, Kafka, Redis, and includes a comprehensive middleware and security stack. The service is suitable for cloud-native deployments (e.g., AWS EC2, PM2, Docker) and is fully tested with Jest.

---

## Features

- **Email Notifications**: Send emails with connection pooling, retry logic, and logging
- **Push Notifications**: Send push notifications via Firebase Cloud Messaging (FCM)
- **Device Token Management**: Register, update, and remove device tokens
- **Kafka Integration**: Consume notification events from Kafka topics
- **MySQL Database**: Store email logs, device tokens, and notification metadata
- **Comprehensive API**: RESTful endpoints for sending, retrying, and auditing notifications
- **Health Checks**: Multi-service health endpoints for monitoring and load balancers
- **Security**: JWT authentication, rate limiting, CORS, security headers
- **Logging**: Centralized logging with Winston
- **Testing**: Jest test suite with high coverage

---

## Architecture

- **Express.js**: Main web framework
- **Sequelize ORM**: MySQL database access and migrations
- **Nodemailer**: Email sending with connection pooling and retry
- **Firebase Admin SDK**: Push notifications
- **Kafka**: Event-driven notification consumption
- **Redis**: Optional caching layer
- **Winston**: Logging
- **Jest**: Testing

### Directory Structure

```
app/
  boundedContext/           # Domain logic
  config/                   # Centralized config
  controllers/              # API controllers
  db_con/                   # DB and Redis clients
  firebase/                 # FCM setup and functions
  kafka/                    # Kafka consumer and config
  middleware/               # Auth, validation, error, rate limiting
  models/                   # Sequelize models
  repositories/             # Data access
  routes/                   # Express routes
  services/                 # Email, notification, and business logic
  tests/                    # Jest test files
  utils/                    # Utility functions and logging
migrations/                 # SQL and JS migration scripts
scripts/                    # Health check and migration scripts
uploads/                    # File uploads (if used)
Dockerfile                  # Docker support
server.js                   # Main entry point
.env                        # Environment variables
```

---

## Key Endpoints

### Email
- `POST /notification/api/v1/email/send` — Send an email
- `POST /notification/api/v1/email/retry/:topic` — Retry failed emails by topic
- `GET /notification/api/v1/email/stats` — Get email statistics (success/failure/total)
- `GET /notification/api/v1/email/logs` — Get paginated email logs (with filters)

### Device Tokens
- `POST /notification/api/v1/device-tokens/register` — Register a device token
- `DELETE /notification/api/v1/device-tokens/:id` — Remove a device token

### Health
- `GET /notification/api/v1/health` — Service health (DB, email, Redis, Kafka, Firebase)
- `GET /notification/api/v1/health/detailed` — Detailed health and config info
- `GET /healthCheck` — Legacy health check

---

## Technical Details

### Email Service
- Uses Nodemailer with connection pooling (`maxConnections` configurable)
- Retry logic with exponential backoff for transient SMTP errors
- Logs all email attempts (success/failure) to MySQL (`email_logs` table)
- Supports CC, BCC, HTML, and text content
- Email logs endpoint supports pagination, filtering by status, topic, date, and correlation ID

### Push Notifications
- Uses Firebase Admin SDK
- Sends push notifications to device tokens
- Device tokens are managed via REST endpoints

### Kafka Integration
Consuming messages from Kafka topics is handled by the Kafka consumer in `app/kafka/consumer.js` and related config in `app/kafka/config/kafkaConfig.js`.

**Important:**

- When you create a new Kafka topic for notifications, you must add the topic name to the Kafka configuration in the codebase (see `app/kafka/config/kafkaConfig.js`).
- Update the topic list or subscription logic so the consumer will listen to the new topic.
- Restart the service after making changes to the topic configuration.

This ensures the notification service will process messages from all required topics.

### Database
- MySQL (configurable via `.env`)
- Sequelize models and migrations for all tables
- Connection pooling and retry logic

### Middleware
- JWT authentication (optional and required variants)
- Rate limiting (global and per-endpoint)
- Input validation for all endpoints
- Correlation ID tracking for distributed tracing
- Security headers (Helmet)
- CORS (configurable)

### Logging
- Winston logger with file and console output
- Logs all API requests, errors, and service events

### Testing
- Jest test suite with high coverage
- Mocks for external services (SMTP, Firebase, DB)
- Test scripts for all major endpoints and error cases

---

## Environment Variables (`.env`)

- See `.env` file for all configuration options
- **Important:** Update SMTP, Firebase, Kafka, and DB credentials for your environment

---

## Running the Service

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
- Copy `.env.example` to `.env` and update values

### 3. Run database migrations
```bash
npm run migrate:mysql
```

### 4. Start the service (development)
```bash
npm run dev
```

### 5. Start the service (production, with PM2)
```bash
pm2 start server.js --name notification-service
```

### 6. Run tests
```bash
npm test
```

---

## Deployment Notes
- Works on Linux (Ubuntu EC2), Windows, Docker, and PM2
- Ensure MySQL, Kafka, and Redis (if used) are accessible
- Configure security groups/firewall for required ports
- Use strong secrets for JWT and SMTP

---

## Contact

**Designer & Developer:** Chathura Jayawardane (<ChathuraJ@inqube.com>)

For questions, issues, or contributions, please contact the developer or open an issue in the repository.
