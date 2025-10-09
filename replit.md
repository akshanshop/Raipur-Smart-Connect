# Overview

Raipur Smart Connect is a unified civic engagement platform designed to bridge the gap between citizens and municipal authorities in Raipur city. The application serves as a comprehensive digital solution for civic services, featuring an AI-powered multilingual chatbot for instant assistance, a smart complaint management system with GPS tracking and photo uploads, and a collaborative community problem-solving hub where citizens can report issues and vote on priorities.

The platform operates as a full-stack web application with both mobile-responsive web interface and API endpoints, enabling citizens to access municipal services 24/7, submit and track complaints with transparency, engage in community-driven problem solving, and receive real-time notifications about city services and alerts.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is built as a Single Page Application (SPA) using React 18 with TypeScript, leveraging Vite as the build tool for optimal development experience and fast builds. The UI framework is based on shadcn/ui components built on top of Radix UI primitives, providing accessible and customizable components with Tailwind CSS for styling.

The application uses Wouter for client-side routing, providing a lightweight alternative to React Router. State management is handled through React Query (TanStack Query) for server state management and caching, with React Hook Form for form handling and validation using Zod schemas.

The component architecture follows a modular approach with shared components for common UI elements like chatbot, complaint forms, community feeds, and maps integration. The styling system uses CSS custom properties for theming with both light and dark mode support.

## Backend Architecture
The server is built with Express.js and TypeScript, following a RESTful API design pattern. The application uses a modular route structure with separate handlers for authentication, chat functionality, complaints, community issues, and file uploads.

File handling is managed through Multer middleware with support for image and video uploads up to 10MB, stored locally with unique naming conventions. The server implements comprehensive error handling and request logging middleware for debugging and monitoring.

The API follows REST conventions with proper HTTP status codes and JSON responses, including pagination support for data-heavy endpoints and proper error responses with meaningful messages.

## Authentication System
Authentication is implemented using independent OAuth 2.0 integration with multiple providers (Google, GitHub, Twitter, Facebook) through Passport.js strategies. The system maintains user sessions using express-session with PostgreSQL session storage via connect-pg-simple.

The database schema supports multiple OAuth providers with fields for oauthProvider and oauthId to track provider-specific user identities. User profiles include civic engagement metrics like contribution scores, complaint counts, and upvote tracking. Session management includes proper security configurations with HTTP-only cookies and CSRF protection.

OAuth routes are available at:
- `/api/auth/google` - Google OAuth authentication
- `/api/auth/github` - GitHub OAuth authentication  
- `/api/auth/twitter` - Twitter OAuth authentication
- `/api/auth/facebook` - Facebook OAuth authentication

Each provider requires client credentials (client ID and client secret) to be configured as environment variables.

## Database Design
The data layer uses Drizzle ORM with PostgreSQL as the primary database, configured to work with Neon's serverless PostgreSQL offering. The database schema includes comprehensive tables for users, complaints, community issues, upvotes, comments, notifications, and chat messages.

Key relationships include user-to-complaints (one-to-many), user-to-upvotes (many-to-many through complaints and community issues), and hierarchical comment structures. The schema supports geolocation data for complaints and community issues, enabling maps integration and location-based filtering.

Session persistence is handled through a dedicated sessions table required for Replit authentication, ensuring secure session management across application restarts.

## AI Integration
The AI functionality is powered by OpenAI's GPT-5 model for the multilingual chatbot assistant. The system processes user queries in English, Hindi, and Marathi, providing contextual responses about Raipur city services including water bills, tax deadlines, bus schedules, and complaint tracking.

The chatbot returns structured JSON responses with message content, response types (info/action/error), and suggested actions with labels and data. Chat history is persisted in the database for continuous conversation context and user experience improvement.

Additional AI features include automatic complaint summarization and priority assessment based on issue descriptions and community engagement metrics.

## Real-time Features
The application implements real-time notifications through a comprehensive notification system that tracks complaint status updates, community engagement activities, and city-wide alerts. While WebSocket implementation is prepared in the architecture, the current implementation uses polling-based updates.

The notification system categorizes messages by type (complaint_update, community_activity, city_alert) and maintains read status for user experience optimization.

# External Dependencies

## Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database with connection pooling via @neondatabase/serverless driver, providing scalable and managed database hosting with WebSocket support for real-time connections

## Authentication Providers
- **Google OAuth 2.0**: OAuth integration for Google account authentication with profile and email access
- **GitHub OAuth 2.0**: OAuth integration for GitHub account authentication with user profile access
- **Twitter OAuth 1.0a**: OAuth integration for Twitter account authentication with user profile access
- **Facebook OAuth 2.0**: OAuth integration for Facebook account authentication with profile and email access

## AI Services
- **OpenAI API**: GPT-5 model integration for multilingual chatbot functionality, natural language processing, and automated content generation including complaint analysis and response generation

## UI and Styling Libraries
- **shadcn/ui**: Component library built on Radix UI primitives providing accessible, customizable components including forms, dialogs, navigation, and data display elements
- **Radix UI**: Headless UI component primitives for building accessible user interfaces with proper ARIA support and keyboard navigation
- **Tailwind CSS**: Utility-first CSS framework for responsive design and consistent styling across the application

## Development and Build Tools
- **Vite**: Frontend build tool and development server providing fast hot module replacement, optimized builds, and TypeScript support
- **TypeScript**: Static type checking for both frontend and backend code, improving code quality and developer experience
- **Replit Development Plugins**: Integration with Replit's development environment including error overlay, cartographer, and development banner features

## File Upload and Storage
- **Multer**: Multipart form data handling for file uploads with support for images and videos, including file validation and size limits

## Form Handling and Validation
- **React Hook Form**: Form state management and validation with TypeScript support
- **Zod**: Schema validation library for runtime type checking and form validation rules
- **Hookform Resolvers**: Integration between React Hook Form and Zod for seamless form validation

## Date and Time Utilities
- **date-fns**: Utility library for date formatting, manipulation, and relative time calculations used throughout the application for timestamps and scheduling

# Recent Changes

## Project Setup - September 28, 2025
Successfully imported and configured the Raipur Smart Connect project for Replit environment:

### Development Environment
- ✅ Verified Node.js 20 environment and all npm dependencies
- ✅ Configured development workflow running on port 5000 with webview output
- ✅ Frontend properly configured with `allowedHosts: true` for Replit proxy compatibility
- ✅ Server configured to bind to `0.0.0.0:5000` for proper network access
- ✅ Vite development server integrated with Express backend middleware

### Deployment Configuration
- ✅ Configured autoscale deployment target for production
- ✅ Build command: `npm run build` (compiles frontend and backend)
- ✅ Production command: `npm run start`

### Current Status
The application is fully functional and ready for development. The project uses a sophisticated architecture combining:
- Express.js backend with TypeScript support via tsx
- React frontend with Vite dev server integration
- Single-port deployment strategy (backend serves frontend assets)
- Modern full-stack development setup optimized for Replit environment

## Replit Environment Setup - September 30, 2025
Successfully completed GitHub import and Replit environment configuration:

### Database Configuration
- ✅ Created PostgreSQL database with Neon integration
- ✅ Pushed database schema with all tables (users, complaints, community issues, upvotes, comments, notifications, chat messages, sessions)
- ✅ Verified database connectivity and schema integrity

### Authentication Setup
- ✅ Replit Auth fully configured and operational
- ℹ️ OAuth providers (Google/GitHub) available but require credentials:
  - To enable Google OAuth: Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
  - To enable GitHub OAuth: Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET

### AI Integration
- ✅ OpenAI integration configured using GPT-5 model
- ℹ️ To enable chatbot functionality: Set OPENAI_API_KEY environment variable
- ✅ Graceful fallback implemented when API key is not available

### Development Workflow
- ✅ Workflow configured to run `npm run dev` on port 5000
- ✅ Webview output type properly set for frontend preview
- ✅ Vite HMR and hot reload working correctly
- ✅ Build process verified and functional

### File Management
- ✅ Updated .gitignore to exclude uploads directory
- ✅ All development dependencies installed and verified

### Environment Variables Required for Full Functionality
1. **Required (Already Set):**
   - DATABASE_URL (PostgreSQL connection)
   - SESSION_SECRET (Session encryption)
   - REPLIT_DOMAINS (Replit Auth)

2. **Optional for Enhanced Features:**
   - OPENAI_API_KEY (AI chatbot functionality)
   - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (Google OAuth)
   - GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET (GitHub OAuth)

## Officials Dashboard Implementation - October 9, 2025
Successfully implemented a comprehensive Officials Dashboard for municipal staff to manage civic issues:

### Role-Based Access Control
- ✅ Enhanced authentication system to support role-based user types (citizen/official)
- ✅ Implemented ProtectedRoute component for secure route guarding
- ✅ Officials automatically redirected to dashboard upon login
- ✅ Non-officials cannot access officials-only routes (404 fallback)

### Dashboard Features
- ✅ **Statistics Overview**: Real-time metrics showing total issues, solved count, pending count, and urgent priority breakdown
- ✅ **Priority Distribution**: Visual breakdown of issues by urgency level (urgent/high/medium/low)
- ✅ **Issues Management**: Comprehensive table with search, filtering by status and priority
- ✅ **Issue Resolution**: Officials can mark issues resolved with resolution notes and screenshot uploads
- ✅ **Issue Deletion**: Officials can delete inappropriate or duplicate issues
- ✅ **Heatmap Visualization**: Geographic distribution of issues with location data

### API Endpoints
- ✅ `GET /api/officials/dashboard/stats` - Aggregated statistics and priority breakdown
- ✅ `GET /api/officials/issues` - Complete list of all issues with metadata
- ✅ `GET /api/officials/dashboard/heatmap` - Location-based issue data for visualization
- ✅ `DELETE /api/officials/issues/:id` - Remove issues (officials only)
- ✅ `POST /api/officials/issues/:id/resolve` - Mark issues as resolved with proof uploads

### Type Safety & Security
- ✅ Fully typed TypeScript interfaces for all dashboard data (DashboardStats, IssueItem, HeatmapPoint)
- ✅ No unsafe type assertions - proper type annotations throughout
- ✅ Middleware authentication protection on all officials endpoints
- ✅ Role verification at both route and API levels

### Technical Implementation
- Frontend: React component with Tabs (Issues/Heatmap), Search, Filters, and Dialog modals
- Backend: Express routes with authentication middleware and Multer for file uploads
- Database: Leverages existing complaints and community issues tables with join queries
- File Storage: Resolution screenshots stored in uploads directory with unique identifiers