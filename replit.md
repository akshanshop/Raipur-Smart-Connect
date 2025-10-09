# Overview
Raipur Smart Connect is a unified civic engagement platform for Raipur city, connecting citizens with municipal authorities. It's a full-stack web application offering civic services, an AI-powered multilingual chatbot, a smart complaint management system with GPS and photo uploads, and a community problem-solving hub. The platform aims to provide 24/7 access to municipal services, transparent complaint tracking, community engagement, and real-time city alerts.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is a Single Page Application (SPA) built with React 18 and TypeScript, using Vite for fast builds. UI components are from shadcn/ui (built on Radix UI) with Tailwind CSS for styling. Wouter handles client-side routing. State management uses React Query for server state and caching, and React Hook Form with Zod for form handling. The architecture is modular, with shared components and CSS custom properties for theming (light/dark mode).

## Backend Architecture
The server is built with Express.js and TypeScript, following a RESTful API design. It features a modular route structure for authentication, chat, complaints, community issues, and file uploads. Multer handles image and video uploads. The API uses standard HTTP status codes, JSON responses, pagination, and comprehensive error handling.

## Authentication System
Authentication uses independent OAuth 2.0 integration via Passport.js with Google, GitHub, Twitter, and Facebook. User sessions are managed using express-session with PostgreSQL storage (connect-pg-simple). The database supports multiple OAuth providers and tracks civic engagement metrics. Session management includes HTTP-only cookies and CSRF protection. OAuth routes are available at `/api/auth/google`, `/api/auth/github`, `/api/auth/twitter`, and `/api/auth/facebook`.

## Database Design
Drizzle ORM with PostgreSQL (Neon's serverless offering) is used for the data layer. The schema includes tables for users, complaints, community issues, upvotes, comments, notifications, chat messages, and sessions. Key relationships exist between users and complaints, and users and upvotes. 

### GPS Location Requirements
All complaints and community issues require mandatory GPS location data:
- Latitude and longitude fields are NOT NULL in the database
- Forms automatically request device location on load
- Submission is blocked without valid GPS coordinates
- Validation ensures coordinates are within valid ranges (latitude: -90 to 90, longitude: -180 to 180)
- Users see real-time GPS status indicators with captured coordinates
- Retry functionality available if initial GPS request fails
- This ensures accurate issue mapping and prevents fake location submissions

## AI Integration
OpenAI's GPT-5 model powers a multilingual chatbot in English, Hindi, and Marathi, providing contextual responses about city services. The chatbot returns structured JSON, and chat history is persisted. Additional AI features include automatic complaint summarization and priority assessment.

## Real-time Features
A notification system provides updates on complaint status, community activities, and city alerts. While WebSockets are architecturally prepared, current implementation uses polling for updates. Notifications are categorized and read status is maintained.

## Officials Dashboard
The Officials Dashboard provides municipal staff with tools to manage civic issues. It includes role-based access control, statistics overview, priority distribution, issue management (search, filter, resolve with proof, delete), and a heatmap visualization of issues. The UI/UX features modern animations, glass morphism, and interactive OpenStreetMap integration via Leaflet with dual view modes (heatmap/markers), priority-based visualization, and custom marker styling.

# External Dependencies

## Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database.

## Authentication Providers
- **Google OAuth 2.0**: For Google account authentication.
- **GitHub OAuth 2.0**: For GitHub account authentication.
- **Twitter OAuth 1.0a**: For Twitter account authentication.
- **Facebook OAuth 2.0**: For Facebook account authentication.

## AI Services
- **OpenAI API**: Integrates GPT-5 for the multilingual chatbot and content generation.

## UI and Styling Libraries
- **shadcn/ui**: Component library built on Radix UI primitives.
- **Radix UI**: Headless UI component primitives.
- **Tailwind CSS**: Utility-first CSS framework.

## Maps and Geolocation
- **Leaflet**: Open-source JavaScript library for interactive maps.
- **React Leaflet**: React components for Leaflet maps.
- **OpenStreetMap**: Free, open-source map tiles for displaying Raipur city.
- **leaflet.heat**: Heatmap plugin for Leaflet to visualize issue density.

## Development and Build Tools
- **Vite**: Frontend build tool and development server.
- **TypeScript**: Static type checking for frontend and backend.

## File Upload and Storage
- **Multer**: Handles multipart form data for file uploads.

## Form Handling and Validation
- **React Hook Form**: Form state management and validation.
- **Zod**: Schema validation library.
- **Hookform Resolvers**: Integration between React Hook Form and Zod.

## Date and Time Utilities
- **date-fns**: Utility library for date formatting and manipulation.