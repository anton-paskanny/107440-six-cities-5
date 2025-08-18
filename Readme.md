# Personal Project «Six Cities»

- Student: [Anton Paskanny](https://www.linkedin.com/in/anton-paskanny/).
- Mentor: [Yaroslav Denisenko](https://www.linkedin.com/in/yaroslav-denisenko/).

---

## About

**Six Cities** is a service for travelers who don't want to overpay for accommodation rental. Choose one of six popular cities for travel and get an up-to-date list of rental offers.

## Project Overview

This is a backend service for the "Six Cities" project. The main features include rental offer management, user authentication, comments system, and favorites functionality. The service provides both REST API and CLI interfaces.

## Project Structure

- **`src`** - Backend services (Node.js, TypeScript)
- **`shared`** - Shared libraries and utilities
- **`mocks`** - Mock data and server configuration

## Technical Architecture

### Backend Services

The project uses a modular architecture where each service handles a specific domain:

- **REST API** - Main application server with all endpoints
- **CLI Application** - Command-line interface for data management
- **Database Services** - MongoDB integration for data persistence
- **File Services** - File upload and management
- **Authentication** - JWT-based user authentication

### Security Features

The application includes comprehensive security measures to protect against common web vulnerabilities:

- **Rate Limiting** - Multi-tier rate limiting system with different limits for different endpoint types:
  - Public endpoints: 100 requests/minute per IP
  - Authentication endpoints: 5 requests/minute per IP (prevents brute force attacks)
  - File upload endpoints: 10 requests/minute per IP
  - User API endpoints: 1000 requests/minute per authenticated user
- **Security Headers** - Helmet.js integration providing:
  - X-Frame-Options (clickjacking protection)
  - X-Content-Type-Options (MIME type sniffing protection)
  - X-XSS-Protection (XSS protection)
  - Content-Security-Policy (CSP)
- **CORS Protection** - Configurable cross-origin resource sharing with production/development modes
- **Request Size Limits** - Protection against large payload attacks (10MB limit)
- **Input Validation** - Comprehensive request validation using class-validator
- **Authentication Middleware** - JWT token validation and private route protection

### Technology Stack

- **Backend Framework**: Node.js with Express
- **Language**: TypeScript
- **Database**: MongoDB
- **Authentication**: JWT-based
- **File Handling**: Multer for uploads
- **Validation**: class-validator for request validation
- **Security**: Helmet.js, express-rate-limit
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest

### Key Features

- User registration and JWT authentication
- Rental offer management (CRUD operations)
- City-based offer filtering
- Comments and reviews system
- Favorites functionality
- Premium offers highlighting
- File uploads for offer images
- Search and filtering capabilities
- Pagination and sorting
- CLI tools for data management

### Development Scenarios

1. Creating new rental offers
2. Editing existing offers
3. Deleting offers
4. Getting list of rental offers
5. Getting detailed offer information
6. Getting list of comments for offers
7. Adding comments to offers
8. Creating new users
9. User login to private area
10. User logout from private area
11. Checking user status
12. Getting premium offers for cities
13. Getting list of favorite offers
14. Adding/removing offers to/from favorites

### Development Approach

- RESTful API design with proper HTTP methods
- Modular architecture with clear separation of concerns
- Comprehensive error handling and validation
- CLI tools for data generation and management
- Full frontend integration provided for reference

### Security Improvements

The application has been enhanced with modern security practices to address common web vulnerabilities:

#### **Vulnerabilities Addressed**

- **DDoS Attacks** - Rate limiting prevents resource exhaustion and abuse
- **Brute Force Attacks** - Low rate limits on authentication endpoints
- **Clickjacking** - X-Frame-Options header protection
- **XSS Attacks** - Security headers and input validation
- **CSRF Attacks** - CORS configuration and token validation
- **File Upload Abuse** - Rate limiting and size restrictions
- **Information Disclosure** - Security headers prevent sensitive data leakage

#### **Security Architecture**

- **Defense in Depth** - Multiple layers of security controls
- **Zero Trust** - All requests are validated and rate-limited
- **Secure by Default** - Security features enabled out of the box
- **Configurable Security** - Environment-based security settings
- **Monitoring Ready** - Rate limit headers for observability

#### **Compliance & Standards**

- **OWASP Top 10** - Addresses major web application security risks
- **Modern Web Standards** - Implements current security best practices
- **Production Ready** - Enterprise-grade security features

### Configuration & Environment

The application supports environment-based configuration for security and deployment settings:

```bash
# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=60000        # Time window in milliseconds
RATE_LIMIT_MAX_PUBLIC=100         # Public endpoint limit
RATE_LIMIT_MAX_AUTH=5             # Authentication endpoint limit
RATE_LIMIT_MAX_UPLOAD=10          # File upload limit
RATE_LIMIT_MAX_USER_API=1000      # User API limit

# Security Configuration
NODE_ENV=development              # Environment mode
HOST=localhost                    # Server host
PORT=4000                        # Server port
JWT_SECRET=your-secret-key       # JWT signing secret
SALT=your-salt-value             # Password hashing salt
MAX_REQUEST_SIZE=10mb             # Maximum request body size
```

### Getting Started

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Configure environment variables** (see above)
4. **Start development server**: `npm run start:dev`
5. **Build for production**: `npm run build`

The repository was created for learning on the professional online course [Node.js. REST API Design](https://htmlacademy.ru/profession/fullstack) from [HTML Academy](https://htmlacademy.ru).
