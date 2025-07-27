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
- **`markup`** - Frontend reference - provided for API design guidance
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

### Technology Stack

- **Backend Framework**: Node.js with Express
- **Language**: TypeScript
- **Database**: MongoDB
- **Authentication**: JWT-based
- **File Handling**: Multer for uploads
- **Validation**: Joi for request validation
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

The repository was created for learning on the professional online course [Node.js. REST API Design](https://htmlacademy.ru/profession/fullstack) from [HTML Academy](https://htmlacademy.ru).
