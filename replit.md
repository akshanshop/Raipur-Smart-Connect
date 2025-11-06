# Overview
Raipur Smart Connect is a unified civic engagement platform that connects citizens with Raipur municipal authorities. It provides 24/7 access to municipal services, transparent complaint tracking, community engagement, and real-time city alerts. Key features include an AI-powered multilingual chatbot, a smart complaint management system with GPS and photo uploads, a community problem-solving hub with interactive map visualization, and a system for voting on nearby complaints. The platform aims to enhance civic participation and streamline municipal operations.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is a Single Page Application (SPA) built with React 18 and TypeScript, using Vite for fast builds. UI components leverage shadcn/ui (built on Radix UI) with Tailwind CSS for styling. Wouter handles client-side routing. State management uses React Query, and form handling is managed by React Hook Form with Zod validation. The architecture is modular and supports theming (light/dark mode).

## Backend Architecture
The server is built with Express.js and TypeScript, following a RESTful API design. It features a modular route structure for authentication, chat, complaints, community issues, and file uploads (handled by Multer). The API adheres to standard HTTP status codes, JSON responses, pagination, and comprehensive error handling.

## Authentication System
Authentication utilizes independent OAuth 2.0 integration via Passport.js with Google, GitHub, Twitter, and Facebook. User sessions are managed using express-session with PostgreSQL storage. The system supports multiple OAuth providers, tracks civic engagement metrics, and includes HTTP-only cookies and CSRF protection.

## Database Design
Drizzle ORM with Neon's serverless PostgreSQL is used. The schema includes tables for users, complaints, community issues, upvotes, comments, notifications, chat messages, and sessions. All complaints and community issues require mandatory GPS location data, ensuring accurate mapping and preventing fake submissions through client-side validation and database constraints.

## AI Integration
OpenAI's GPT-5 powers several features:
- **Multilingual Chatbot**: Supports English, Hindi, and Marathi, providing contextual responses and persistent chat history.
- **Spam Detection System**: Automatically analyzes new complaints and community posts for spam, fake content, and abusive language with a >70% confidence threshold. It sends warning notifications to users for detected spam and logs decisions.
- **Other AI Features**: Includes automatic complaint summarization and priority assessment.

## Security & Anti-Spam System
A multi-layered security system is implemented:
- **Rate Limiting**: Intelligent limits for various actions (e.g., 5 complaints/minute, 10 comments/minute) with a three-strike warning system leading to a 30-minute IP-based block for persistent violators.
- **Content Validation**: Detects and blocks content containing spam keywords, suspicious patterns (e.g., multiple URLs, credit card numbers, excessive capitalization), and suspicious domain TLDs.
- **Duplicate Detection**: Prevents duplicate submissions of complaints, comments, and community issues by tracking recent activity and content matching.
- **Automated Warning System**: Sends instant, severity-based warnings to users for violations.
- **Security Monitoring (Officials Only)**: Provides officials with a dashboard to view real-time security metrics, activity logs, and manual controls for unblocking users or IPs.

## Real-time Features
A comprehensive notification system provides updates on complaint status, community activities, and city alerts through multiple channels:
- **In-App Notifications**: Categorized notifications with read status tracking, using polling (architecture prepared for WebSockets).
- **SMS Notifications**: Via Twilio for instant mobile updates.
- **Email Notifications**: Via SendGrid API for reliable, detailed email delivery with professional HTML templates.

Users receive notifications through all available channels when they submit a complaint, when officials acknowledge it, when work begins (in progress), and when the issue is resolved.

## Complaint Management
A comprehensive complaint system includes:
- **Automatic Priority Assignment**: Based on nearby reports within ~0.5km (Low: <3, Medium: 3-7, Urgent: >7).
- **Nearby Complaints Voting**: Users can vote (like/dislike) on complaints within a 7km radius, with net scores and status indicators.
- **Map Visualization**: Both Citizen and Officials dashboards offer identical map features with three view modes: Individual Markers (color-coded by status/priority), Heatmap View (intensity by priority), and Density View (grouped reports by count). Dynamic legends adapt to the selected view mode.
- **Officials Dashboard**: Provides role-based access, statistics, issue management (search, filter, resolve with proof, delete), and modern UI/UX.

# External Dependencies

## Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database.

## Authentication Providers
- **Google OAuth 2.0**: For Google account authentication.
- **GitHub OAuth 2.0**: For GitHub account authentication.
- **Twitter OAuth 1.0a**: For Twitter account authentication.
- **Facebook OAuth 2.0**: For Facebook account authentication.

## AI Services
- **OpenAI API**: Integrates GPT-5 for chatbot and content generation.

## Communication Services
- **Twilio**: For real-time SMS and WhatsApp notifications (complaint status updates). Requires environment variables: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`.
- **SendGrid**: For sending email notifications about complaint submissions, status updates, and resolutions. Uses SendGrid's reliable API for email delivery, which works perfectly on Render and other cloud platforms. Requires environment variables: `SENDGRID_API_KEY` (SendGrid API key with Mail Send permissions), `SENDGRID_FROM_EMAIL` (verified sender email address from SendGrid account - must be verified in SendGrid settings).

## UI and Styling Libraries
- **shadcn/ui**: Component library built on Radix UI primitives.
- **Radix UI**: Headless UI component primitives.
- **Tailwind CSS**: Utility-first CSS framework.

## Maps and Geolocation
- **Leaflet**: JavaScript library for interactive maps.
- **React Leaflet**: React components for Leaflet maps.
- **OpenStreetMap**: Free, open-source map tiles.
- **leaflet.heat**: Heatmap plugin for Leaflet.

## Development and Build Tools
- **Vite**: Frontend build tool and development server.
- **TypeScript**: Static type checking.

## File Upload and Storage
- **Multer**: Handles multipart form data for file uploads.

## Form Handling and Validation
- **React Hook Form**: Form state management and validation.
- **Zod**: Schema validation library.
- **Hookform Resolvers**: Integration for React Hook Form and Zod.

## Date and Time Utilities
- **date-fns**: Utility library for date formatting and manipulation.