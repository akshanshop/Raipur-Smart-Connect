# Overview
Raipur Smart Connect is a unified civic engagement platform connecting citizens with Raipur municipal authorities. It provides 24/7 access to municipal services, transparent complaint tracking, community engagement, and real-time city alerts. The platform features an AI-powered multilingual chatbot, a smart complaint management system with GPS and photo uploads, a community problem-solving hub with interactive map visualization, and a system for voting on nearby complaints. The project aims to enhance civic participation, streamline municipal operations, and foster a more connected urban environment.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is a React 18 SPA with TypeScript, built using Vite. UI components are developed with shadcn/ui (Radix UI) and styled with Tailwind CSS. Wouter is used for routing, React Query for state management, and React Hook Form with Zod for form handling and validation. The architecture supports theming (light/dark mode) and mobile responsiveness across all layouts.

## Backend Architecture
The server is built with Express.js and TypeScript, following a RESTful API design. It features a modular route structure for authentication, chat, complaints, community issues, and file uploads (Multer). APIs adhere to standard HTTP status codes, JSON responses, pagination, and comprehensive error handling.

## Authentication System
Authentication uses independent OAuth 2.0 integration via Passport.js with Google, GitHub, Twitter, and Facebook. User sessions are managed using express-session with PostgreSQL storage. The system tracks civic engagement metrics, includes HTTP-only cookies, and CSRF protection.

## Database Design
Drizzle ORM with Neon's serverless PostgreSQL is used. The schema includes tables for users, complaints, community issues, upvotes, comments, notifications, chat messages, sessions, communities, community members, token bonuses, user achievements, and official jobs. All complaints and community issues require mandatory GPS location data.

## AI Integration
OpenAI's GPT-5 powers a multilingual chatbot (English and Hindi) with persistent chat history. It also includes an AI-powered spam detection system for complaints and community posts (with >70% confidence threshold), automatic complaint summarization, and priority assessment.

## Security & Anti-Spam System
A multi-layered security system includes intelligent rate limiting for various actions, content validation against spam keywords and suspicious patterns, and duplicate submission detection. An automated warning system notifies users of violations, and officials have a dashboard for security monitoring and manual controls.

## Real-time Features
A comprehensive notification system provides updates via in-app notifications (polling, WebSockets planned), SMS (Twilio), and email (SendGrid) for complaint status, community activities, and city alerts.

## Emergency Alert System
A dedicated emergency reporting system allows citizens to instantly report urgent situations (fire, medical, water, power, gas leak, road hazard). Emergency reports are processed through a separate `/api/emergency` endpoint that:
- Creates complaints with automatic "urgent" priority
- Captures GPS location using browser geolocation API
- Awards 20 tokens (vs 10 for regular complaints)
- Sends immediate SMS and email notifications to the reporter using their stored contact information
- Notifies ALL officials instantly via SMS, email, and in-app notifications
- Generates unique ticket numbers for tracking
Emergency reports bypass normal complaint processing to ensure fastest response times.

## Complaint Management
The system assigns automatic priority based on nearby reports (~0.5km radius). Users can vote on nearby complaints (7km radius). Both citizen and official dashboards feature interactive maps with Individual Markers (color-coded by status/priority), Heatmap View, and Density View. The Officials Dashboard provides role-based access, statistics, and issue management (search, filter, resolve with proof, delete).

## Gamification and Rewards
A comprehensive token and reward system incentivizes civic participation. Users earn tokens for actions like submitting complaints or creating communities. The system includes an achievement system, a token dashboard, an active token bonuses system, and a leaderboard. An extensive rewards catalog allows users to redeem tokens for digital vouchers, discounts, subscriptions, and achievement badges.

## Community Management
Users can create, discover, and join communities with various categories and privacy settings. Creators and admins manage members and community settings. A dedicated `/communities` route provides discovery, user-specific communities, and creation functionalities.

## Official Time-Based Job Management
Officials have a dedicated dashboard to manage assigned and unassigned jobs. Features include time tracking (estimated vs. actual hours using decimal values), job assignment with notifications, status tracking (pending, in_progress, completed/cancelled), priority and categorization, deadline warnings, detailed job information, and a stats dashboard. The officials dashboard includes a separate Issues Management section with an interactive map showing all reported complaints with color-coded markers based on priority and status.

# External Dependencies

## Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database.

## Authentication Providers
- **Google OAuth 2.0**
- **GitHub OAuth 2.0**
- **Twitter OAuth 1.0a**
- **Facebook OAuth 2.0**

## AI Services
- **OpenAI API**: For GPT-5 integration.

## Communication Services
- **Twilio**: For SMS notifications.
- **SendGrid**: For email notifications.

## UI and Styling Libraries
- **shadcn/ui**
- **Radix UI**
- **Tailwind CSS**

## Maps and Geolocation
- **Leaflet**: JavaScript library for interactive maps.
- **React Leaflet**: React components for Leaflet.
- **OpenStreetMap**: Free, open-source map tiles.
- **leaflet.heat**: Heatmap plugin for Leaflet.

## Development and Build Tools
- **Vite**: Frontend build tool.
- **TypeScript**: Static type checking.

## File Upload and Storage
- **Multer**: Handles multipart form data for file uploads.

## Form Handling and Validation
- **React Hook Form**: Form state management.
- **Zod**: Schema validation.
- **Hookform Resolvers**: Integration for React Hook Form and Zod.

## Date and Time Utilities
- **date-fns**: Utility library for date formatting and manipulation.