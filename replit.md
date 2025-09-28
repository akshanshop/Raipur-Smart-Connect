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