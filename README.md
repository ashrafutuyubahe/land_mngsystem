# Rwanda Land Administration API

A comprehensive digital solution for Rwanda's land administration processes, built with NestJS, PostgreSQL, TypeORM, ClickHouse, Redis, and RabbitMQ.

## 🎯 Project Overview

This API digitalizes and streamlines Rwanda's land administration processes by providing a centralized, secure, and efficient way to manage all key land-related workflows including registration, transfers, taxation, construction permits, dispute resolution, and related services.

### 🔧 Advanced Features

- **📊 Analytics**: High-performance analytics with ClickHouse for large-scale data queries
- **⚡ Caching**: Redis-based caching for improved performance
- **📡 Event-Driven Architecture**: RabbitMQ for real-time event processing and notifications
- **🔄 Real-time Updates**: Live notifications for land registration status changes
- **📈 Performance Monitoring**: Comprehensive metrics and health checks

## 🚀 Features

### Core Modules

| Module                          | Description                         | Key Features                                                   |
| ------------------------------- | ----------------------------------- | -------------------------------------------------------------- |
| **Authentication**              | Secure user management with JWT     | Registration, Login, Role-based access control                 |
| **Land Registration**           | Digital land ownership registration | Submit, validate, and approve land ownership claims            |
| **Land Transfer**               | Property ownership changes          | Secure, traceable property transfers and boundary updates      |
| **Land Taxes**                  | Automated tax management            | Calculate and track land-related taxes based on ownership data |
| **Conflict Resolution**         | Land dispute management             | Submit, track, and mediate land disputes                       |
| **Urbanization & Construction** | Building permits and urban planning | Digital application, review, and inspection processes          |
| **Settings**                    | System configuration                | Configure workflows, roles, and system preferences             |

### User Roles

- **👤 CITIZEN**: Land owners and applicants
- **🏢 LAND_OFFICER**: District land management officers
- **🏛️ DISTRICT_ADMIN**: District administrators
- **👔 MAYOR**: Municipal authorities
- **📋 REGISTRAR**: Land registration officials
- **💰 TAX_OFFICER**: Tax collection officers
- **🏗️ URBAN_PLANNER**: Urban development planners
- **⚖️ CONFLICT_MEDIATOR**: Dispute resolution specialists
- **🔧 SUPER_ADMIN**: System administrators

## 🛠️ Technology Stack

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Analytics**: ClickHouse (High-performance analytics database)
- **Caching**: Redis (In-memory data structure store)
- **Message Queue**: RabbitMQ (Event-driven communication)
- **Authentication**: JWT with Passport
- **Validation**: Class Validator
- **Documentation**: Swagger/OpenAPI
- **Language**: TypeScript
- **Containerization**: Docker & Docker Compose

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Docker** and **Docker Compose**
- **Git**

## 🐳 Docker Compose Setup (Recommended)

The easiest way to get started is using Docker Compose which includes all required services:

### 1. Clone the Repository

```bash
git clone https://github.com/ashrafutuyubahe/land_mngsystem.git
cd land-administration-api
```

### 2. Create Environment File

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_NAME=land_management_system

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Application Configuration
PORT=3000
NODE_ENV=development

# ClickHouse Configuration
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_DATABASE=land_analytics
CLICKHOUSE_USERNAME=default
CLICKHOUSE_PASSWORD=

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123

# RabbitMQ Configuration
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=admin
RABBITMQ_PASSWORD=admin123
RABBITMQ_VHOST=

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DEST=./uploads
```

### 3. Create Docker Compose File

Create a `docker-compose.yml` file in the root directory:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15
    container_name: land_postgres
    environment:
      POSTGRES_DB: land_management_system
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 30s
      timeout: 10s
      retries: 5

  # ClickHouse for Analytics
  clickhouse:
    image: clickhouse/clickhouse-server:latest
    container_name: land_clickhouse
    environment:
      CLICKHOUSE_DB: land_analytics
      CLICKHOUSE_USER: default
      CLICKHOUSE_PASSWORD: ''
    ports:
      - '8123:8123' # HTTP interface
      - '9000:9000' # Native interface
    volumes:
      - clickhouse_data:/var/lib/clickhouse
      - ./clickhouse-config:/etc/clickhouse-server/config.d
    healthcheck:
      test:
        [
          'CMD',
          'wget',
          '--quiet',
          '--tries=1',
          '--spider',
          'http://localhost:8123/ping',
        ]
      interval: 30s
      timeout: 10s
      retries: 5

  # Redis for Caching
  redis:
    image: redis:7-alpine
    container_name: land_redis
    command: redis-server --requirepass redis123
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', '--raw', 'incr', 'ping']
      interval: 30s
      timeout: 10s
      retries: 5

  # RabbitMQ for Event-Driven Architecture
  rabbitmq:
    image: rabbitmq:3-management
    container_name: land_rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin123
    ports:
      - '5672:5672' # AMQP port
      - '15672:15672' # Management UI
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ['CMD', 'rabbitmq-diagnostics', 'ping']
      interval: 30s
      timeout: 10s
      retries: 5

volumes:
  postgres_data:
  clickhouse_data:
  redis_data:
  rabbitmq_data:
```

### 4. Start All Services

```bash
# Start all services in the background
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 5. Install Dependencies and Run Application

```bash
# Install Node.js dependencies
npm install

# Start the application in development mode
npm run start:dev
```

## 🌐 Service Access Points

Once all services are running, you can access:

| Service                 | URL                       | Credentials           | Purpose                  |
| ----------------------- | ------------------------- | --------------------- | ------------------------ |
| **API**                 | http://localhost:3000     | -                     | Main application         |
| **Swagger Docs**        | http://localhost:3000/api | -                     | API documentation        |
| **PostgreSQL**          | localhost:5432            | postgres/postgres123  | Main database            |
| **ClickHouse HTTP**     | http://localhost:8123     | default/(no password) | Analytics queries        |
| **ClickHouse Native**   | localhost:9000            | default/(no password) | Direct connections       |
| **Redis**               | localhost:6379            | redis123              | Cache operations         |
| **RabbitMQ Management** | http://localhost:15672    | admin/admin123        | Message queue management |
| **RabbitMQ AMQP**       | localhost:5672            | admin/admin123        | Application connections  |

## 📊 Service Usage Examples

### ClickHouse Analytics

```bash
# Query land records analytics
curl -X POST "http://localhost:3000/clickhouse/analytics/land-records" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "district": "Kigali",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "page": 1,
    "limit": 100
  }'

# Get registration statistics
curl -X GET "http://localhost:3000/clickhouse/analytics/statistics" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Redis Caching

```bash
# The application automatically caches land transfer data
# Cache is invalidated when transfers are updated

# Check cache status via API
curl -X GET "http://localhost:3000/land-transfer" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# First call: Database query + cache storage
# Subsequent calls: Served from cache (faster response)
```

### RabbitMQ Events

```bash
# Events are automatically published when:
# - Land is registered
# - Land records are updated
# - Land status changes
# - Transfers are processed

# Check event system health
curl -X GET "http://localhost:3000/events/health" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# View event statistics (Admin only)
curl -X GET "http://localhost:3000/events/stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get all event types
curl -X GET "http://localhost:3000/events/types" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 Development Setup (Alternative)

If you prefer to run services individually:

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Individual Services

```bash
# Start PostgreSQL
docker run -d --name postgres \
  -e POSTGRES_DB=land_management_system \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -p 5432:5432 postgres:15

# Start ClickHouse
docker run -d --name clickhouse \
  -p 8123:8123 -p 9000:9000 \
  clickhouse/clickhouse-server:latest

# Start Redis
docker run -d --name redis \
  -p 6379:6379 \
  redis:7-alpine redis-server --requirepass redis123

# Start RabbitMQ
docker run -d --name rabbitmq \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=admin123 \
  -p 5672:5672 -p 15672:15672 \
  rabbitmq:3-management
```

### 3. Run the Application

```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

## 📚 Enhanced API Endpoints

### Authentication

| Method | Endpoint         | Description       | Access    |
| ------ | ---------------- | ----------------- | --------- |
| POST   | `/auth/register` | Register new user | Public    |
| POST   | `/auth/login`    | User login        | Public    |
| GET    | `/auth/profile`  | Get user profile  | Protected |

### Land Registration

| Method | Endpoint                         | Description              | Access        |
| ------ | -------------------------------- | ------------------------ | ------------- |
| POST   | `/land-registration`             | Register new land        | Protected     |
| GET    | `/land-registration`             | Get land records         | Protected     |
| GET    | `/land-registration/:id`         | Get specific land record | Protected     |
| PATCH  | `/land-registration/:id`         | Update land record       | Protected     |
| POST   | `/land-registration/:id/approve` | Approve land record      | Land Officer+ |
| POST   | `/land-registration/:id/reject`  | Reject land record       | Land Officer+ |
| DELETE | `/land-registration/:id`         | Delete land record       | Protected     |

### Land Transfer (with Redis Caching)

| Method | Endpoint                     | Description            | Access        |
| ------ | ---------------------------- | ---------------------- | ------------- |
| POST   | `/land-transfer`             | Initiate land transfer | Protected     |
| GET    | `/land-transfer`             | Get transfers (cached) | Protected     |
| GET    | `/land-transfer/:id`         | Get specific transfer  | Protected     |
| POST   | `/land-transfer/:id/approve` | Approve transfer       | Land Officer+ |
| POST   | `/land-transfer/:id/reject`  | Reject transfer        | Land Officer+ |

### ClickHouse Analytics

| Method | Endpoint                             | Description                  | Access     |
| ------ | ------------------------------------ | ---------------------------- | ---------- |
| POST   | `/clickhouse/analytics/land-records` | Query land records analytics | Protected  |
| GET    | `/clickhouse/analytics/statistics`   | Get registration statistics  | Protected  |
| GET    | `/clickhouse/health`                 | ClickHouse health check      | Protected  |
| POST   | `/clickhouse/sync/all`               | Sync all data to ClickHouse  | Admin only |

### Event System (RabbitMQ)

| Method | Endpoint         | Description           | Access     |
| ------ | ---------------- | --------------------- | ---------- |
| GET    | `/events/health` | Event system health   | Protected  |
| GET    | `/events/stats`  | Event statistics      | Admin only |
| GET    | `/events/types`  | Available event types | Protected  |
| POST   | `/events/test`   | Publish test event    | Admin only |

### Additional Modules

Similar patterns apply for:

- `/land-taxes` - Land taxation management
- `/conflict-resolution` - Dispute management
- `/urbanization` - Construction permits
- `/settings` - System configuration

## 🧪 Testing with Postman

### Register a New User

```http
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+250788123456",
  "nationalId": "1199800012345671",
  "role": "citizen",
  "district": "Kigali",
  "sector": "Nyarugenge",
  "cell": "Kiyovu"
}
```

### Login

```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

### Register Land (Protected - Triggers Events)

```http
POST http://localhost:3000/land-registration
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "parcelNumber": "KG-001-2024-001",
  "upiNumber": "UPI-001-2024-001",
  "area": 500.75,
  "district": "Kigali",
  "sector": "Nyarugenge",
  "cell": "Kiyovu",
  "village": "Kiyovu I",
  "description": "Residential plot with garden",
  "landUseType": "residential",
  "marketValue": 50000000,
  "governmentValue": 45000000
}
```

### Query Analytics (ClickHouse)

```http
POST http://localhost:3000/clickhouse/analytics/land-records
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "district": "Kigali",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "page": 1,
  "limit": 50
}
```

### Test Event System

```http
POST http://localhost:3000/events/test
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "type": "land.registered",
  "payload": {
    "landId": "test-land-123",
    "parcelNumber": "TEST-001",
    "district": "Kigali"
  },
  "metadata": {
    "source": "test",
    "version": "1.0.0"
  }
}
```

## 📁 Enhanced Project Structure

```
src/
├── auth/                      # Authentication module
│   ├── dto/                  # Data transfer objects
│   ├── entities/             # User entity
│   ├── enums/               # User roles
│   ├── guards/              # JWT & Role guards
│   ├── strategies/          # Passport strategies
│   └── decorators/          # Custom decorators
├── land-registration/        # Land registration module
├── land-transfer/           # Land transfer module (with Redis caching)
├── land-taxes/             # Land taxation module
├── conflict-resolution/     # Dispute resolution module
├── urbanization/           # Construction permits module
├── settings/               # System settings module
├── clickhouse/             # ClickHouse analytics module
│   ├── clickhouse.service.ts    # Analytics service
│   ├── clickhouse.controller.ts # Analytics endpoints
│   └── clickhouse.module.ts     # Module configuration
├── redis/                  # Redis caching module
│   ├── redis.service.ts         # Cache operations
│   └── redis.module.ts          # Redis configuration
├── events/                 # Event-driven architecture module
│   ├── event.service.ts         # RabbitMQ event publishing
│   ├── event.controller.ts      # Event management endpoints
│   └── event.module.ts          # RabbitMQ configuration
├── common/                 # Shared utilities
│   └── enums/             # Status enums
├── app.module.ts          # Main application module
└── main.ts               # Application entry point
```

## 🔧 Configuration Files

### Docker Compose Services

The application uses the following services in `docker-compose.yml`:

- **PostgreSQL**: Main relational database
- **ClickHouse**: High-performance analytics database
- **Redis**: In-memory caching layer
- **RabbitMQ**: Message broker for events

### Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_NAME=land_management_system

# Analytics
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_DATABASE=land_analytics

# Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123

# Events
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=admin
RABBITMQ_PASSWORD=admin123
```

## � Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
DB_HOST=your_production_db_host
DB_PASSWORD=secure_production_password
JWT_SECRET=very-secure-production-jwt-secret

# Analytics
CLICKHOUSE_HOST=your_clickhouse_host
CLICKHOUSE_PASSWORD=secure_clickhouse_password

# Cache
REDIS_HOST=your_redis_host
REDIS_PASSWORD=secure_redis_password

# Events
RABBITMQ_HOST=your_rabbitmq_host
RABBITMQ_USERNAME=production_user
RABBITMQ_PASSWORD=secure_rabbitmq_password
```

### Docker Compose for Production

```yaml
version: '3.8'
services:
  app:
    build: .
    environment:
      NODE_ENV: production
    ports:
      - '3000:3000'
    depends_on:
      - postgres
      - clickhouse
      - redis
      - rabbitmq
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: land_management_system
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  clickhouse:
    image: clickhouse/clickhouse-server:latest
    environment:
      CLICKHOUSE_PASSWORD: ${CLICKHOUSE_PASSWORD}
    volumes:
      - clickhouse_data:/var/lib/clickhouse
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

  rabbitmq:
    image: rabbitmq:3-management
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USERNAME}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    restart: unless-stopped

volumes:
  postgres_data:
  clickhouse_data:
  redis_data:
  rabbitmq_data:
```

## �🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permissions system
- **Password Hashing**: bcrypt encryption
- **Input Validation**: Comprehensive validation using class-validator
- **CORS Protection**: Configurable cross-origin resource sharing
- **Redis Security**: Password-protected cache access
- **RabbitMQ Security**: Authenticated message broker access
- **ClickHouse Security**: Secure analytics database connections

## 🎯 Performance Features

### Caching Strategy (Redis)

- **Land Transfer Cache**: Automatic caching of transfer data
- **Cache Invalidation**: Smart cache invalidation on data updates
- **Performance Metrics**: Built-in cache hit/miss tracking

### Analytics (ClickHouse)

- **High-Performance Queries**: Optimized for large datasets
- **Real-time Sync**: Automatic data synchronization
- **Advanced Filtering**: Complex analytics queries

### Event-Driven Architecture (RabbitMQ)

- **Real-time Notifications**: Instant event broadcasting
- **Decoupled Services**: Loose coupling between modules
- **Scalable Messaging**: Reliable message delivery

## 📊 Monitoring and Health Checks

### Service Health Endpoints

```bash
# Application health
curl http://localhost:3000/health

# ClickHouse health
curl http://localhost:3000/clickhouse/health

# Event system health
curl http://localhost:3000/events/health

# RabbitMQ Management UI
http://localhost:15672 (admin/admin123)
```

## 📋 Available Scripts

```bash
# Application Management
npm run start              # Start the application
npm run start:dev          # Start in development mode with hot reload
npm run start:debug        # Start in debug mode
npm run start:prod         # Start in production mode
npm run build              # Build the application

# Testing
npm run test               # Run unit tests
npm run test:e2e           # Run end-to-end tests
npm run test:cov           # Run tests with coverage

# Code Quality
npm run lint               # Lint the code
npm run format             # Format the code with Prettier

# Docker Operations
docker-compose up -d       # Start all services
docker-compose down        # Stop all services
docker-compose logs -f     # View service logs
docker-compose ps          # Check service status
```

## 🔍 Troubleshooting

### Common Issues

1. **Services won't start**

   ```bash
   # Check Docker is running
   docker --version

   # Check ports are available
   netstat -tulpn | grep :5432
   ```

2. **ClickHouse connection issues**

   ```bash
   # Test ClickHouse connection
   curl http://localhost:8123/ping

   # Check ClickHouse logs
   docker-compose logs clickhouse
   ```

3. **Redis connection issues**

   ```bash
   # Test Redis connection
   redis-cli -h localhost -p 6379 -a redis123 ping

   # Check Redis logs
   docker-compose logs redis
   ```

4. **RabbitMQ connection issues**

   ```bash
   # Check RabbitMQ management UI
   http://localhost:15672

   # Check RabbitMQ logs
   docker-compose logs rabbitmq
   ```

### Service Dependencies

The application requires all services to be running:

1. **PostgreSQL** - Main database
2. **ClickHouse** - Analytics database
3. **Redis** - Caching layer
4. **RabbitMQ** - Message broker

### Performance Tips

1. **Enable Caching**: Ensure Redis is properly configured
2. **Analytics Optimization**: Use ClickHouse for large data queries
3. **Event Processing**: Monitor RabbitMQ queue sizes
4. **Database Indexing**: Ensure proper database indexes

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Ensure Docker services work correctly
- Test event-driven workflows

## 📄 License

This project is licensed under the UNLICENSED License.

## 📞 Support

For support and questions:

- Create an issue on GitHub
- Check the troubleshooting section
- Review service logs using Docker Compose

**Made with ❤️ for Rwanda's Digital Transformation**

---

### 🎉 Quick Start Summary

1. **Clone** the repository
2. **Create** `.env` file with provided configuration
3. **Create** `docker-compose.yml` with all services
4. **Run** `docker-compose up -d`
5. **Install** dependencies with `npm install`
6. **Start** the application with `npm run start:dev`
7. **Access** the API at http://localhost:3000/api

All services will be automatically configured and ready to use!
