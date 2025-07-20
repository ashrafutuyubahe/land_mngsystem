# Rwanda Land Administration API

A comprehensive digital solution for Rwanda's land administration processes, built with NestJS, PostgreSQL, and TypeORM.

## 🎯 Project Overview

This API digitalizes and streamlines Rwanda's land administration processes by providing a centralized, secure, and efficient way to manage all key land-related workflows including registration, transfers, taxation, construction permits, dispute resolution, and related services.

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
- **Authentication**: JWT with Passport
- **Validation**: Class Validator
- **Documentation**: Swagger/OpenAPI
- **Language**: TypeScript

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v12 or higher)
- **Git**

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/ashrafutuyubahe/land_mngsystem.git
cd land-administration-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=land_management_system

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Application Configuration
PORT=3000
NODE_ENV=development

# Redis Configuration (Optional - for caching)
REDIS_HOST=localhost
REDIS_PORT=6379

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DEST=./uploads
```

### 4. Database Setup

Create the PostgreSQL database:

```sql
CREATE DATABASE land_management_system;
```

### 5. Run the Application

```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

The API will be available at: `http://localhost:3000`

API Documentation (Swagger): `http://localhost:3000/api`

## 📚 API Endpoints

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

### Land Transfer

| Method | Endpoint                     | Description            | Access        |
| ------ | ---------------------------- | ---------------------- | ------------- |
| POST   | `/land-transfer`             | Initiate land transfer | Protected     |
| GET    | `/land-transfer`             | Get transfers          | Protected     |
| GET    | `/land-transfer/:id`         | Get specific transfer  | Protected     |
| POST   | `/land-transfer/:id/approve` | Approve transfer       | Land Officer+ |
| POST   | `/land-transfer/:id/reject`  | Reject transfer        | Land Officer+ |

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

### Register Land (Protected)

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

## 📁 Project Structure

```
src/
├── auth/                    # Authentication module
│   ├── dto/                # Data transfer objects
│   ├── entities/           # User entity
│   ├── enums/             # User roles
│   ├── guards/            # JWT & Role guards
│   ├── strategies/        # Passport strategies
│   └── decorators/        # Custom decorators
├── land-registration/      # Land registration module
├── land-transfer/         # Land transfer module
├── land-taxes/           # Land taxation module
├── conflict-resolution/   # Dispute resolution module
├── urbanization/         # Construction permits module
├── settings/             # System settings module
├── common/               # Shared utilities
│   └── enums/           # Status enums
├── app.module.ts         # Main application module
└── main.ts              # Application entry point
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permissions system
- **Password Hashing**: bcrypt encryption
- **Input Validation**: Comprehensive validation using class-validator
- **CORS Protection**: Configurable cross-origin resource sharing

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
DB_HOST=your_production_db_host
DB_PASSWORD=secure_production_password
JWT_SECRET=very-secure-production-jwt-secret
```

### Build for Production

```bash
npm run build
npm run start:prod
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Available Scripts

```bash
npm run start          # Start the application
npm run start:dev      # Start in development mode with hot reload
npm run start:debug    # Start in debug mode
npm run start:prod     # Start in production mode
npm run build          # Build the application
npm run test           # Run tests
npm run test:e2e       # Run end-to-end tests
npm run lint           # Lint the code
npm run format         # Format the code with Prettier
```
## 📄 License

This project is licensed under the UNLICENSED License.

**Made with ❤️ for Rwanda's Digital Transformation**
