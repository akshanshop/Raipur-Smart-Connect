# Overview
Raipur Smart Connect is a unified civic engagement platform for Raipur city, connecting citizens with municipal authorities. It's a full-stack web application offering civic services, an AI-powered multilingual chatbot with spam detection, a smart complaint management system with GPS and photo uploads, and a community problem-solving hub with interactive map visualization. The platform aims to provide 24/7 access to municipal services, transparent complaint tracking, community engagement, and real-time city alerts.

## Recent Updates (October 2025)
- **Comprehensive Security System**: Implemented multi-layer security with rate limiting, content validation, IP tracking, and automated threat detection
- **AI Spam Detection**: Implemented GPT-5 powered spam detection that automatically analyzes and rejects fake/spam complaints with >70% confidence, sending warning notifications to users
- **Automatic Priority Assignment**: Priority is now automatically calculated based on nearby reports within ~0.5km radius:
  - Low priority (yellow): Less than 3 reports in the area
  - Medium priority (orange): 3-7 reports in the area
  - Urgent priority (red): More than 7 reports in the area
  - Resolved issues are always shown in green on maps
- **Three View Modes for All Maps**: Both Citizen and Officials dashboards now have identical map visualization with three view modes:
  - **Individual Markers**: Color-coded by status (green for resolved) and priority (yellow/orange/red)
  - **Heatmap View**: Heat intensity based on issue priority
  - **Density View (By Count)**: Grouped reports with color-coded markers (yellow: <3, orange: 3-7, red: >7)
- **Enhanced Officials Dashboard**: Added Analytics tab with full map visualization capabilities matching citizen dashboard
- **Dynamic Map Legends**: Context-aware legends that adapt based on selected view mode

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
OpenAI's GPT-5 model powers multiple AI features:

### Multilingual Chatbot
- Supports English, Hindi, and Marathi languages
- Provides contextual responses about city services
- Returns structured JSON responses
- Persistent chat history

### Spam Detection System
- **Complaint Analysis**: Automatically analyzes all new complaints for spam, fake content, and abusive language
- **Community Issue Analysis**: Validates community posts before publication
- **Confidence Threshold**: Rejects submissions with >70% spam confidence
- **Warning Notifications**: Sends alert notifications to users when spam is detected
- **Categories**: Identifies content as legitimate, spam, fake, irrelevant, or abusive
- **Graceful Fallback**: Allows submissions on API errors to prevent blocking legitimate reports
- **Detailed Logging**: Tracks spam detection decisions for monitoring and improvement

### Other AI Features
- Automatic complaint summarization
- Priority assessment

## Security & Anti-Spam System

The platform includes a comprehensive, multi-layered security system to protect against spam, abuse, and fake requests:

### Rate Limiting
- **Intelligent Rate Limits**: Different limits for different actions
  - Complaints: 5 per minute
  - Comments: 10 per minute
  - Chat messages: 20 per minute
  - Upvotes: 30 per minute
  - General requests: 50 per minute
- **Graduated Warnings**: Three-strike system before blocking
  - 1st violation: Low severity warning
  - 2nd violation: Medium severity alert
  - 3rd violation: High severity final warning
  - 4th violation: 30-minute automatic block
- **IP-Based Blocking**: Persistent violators get their IP addresses blocked

### Content Validation
- **Spam Keyword Detection**: Automatically blocks content containing spam keywords (gambling, scams, adult content, etc.)
- **Pattern Recognition**: Detects suspicious patterns like:
  - Multiple URLs in content
  - Credit card numbers
  - Excessive capitalization
  - Repeated characters (spam patterns)
  - Suspicious domain TLDs
- **Comment Spam Protection**: All comments are validated before posting

### Duplicate Detection
- **Submission Tracking**: Monitors recent submissions to prevent duplicates
- **Content Matching**: Detects identical content submitted within 5 minutes
- **Automatic Rejection**: Blocks duplicate complaints, comments, and community issues

### Automated Warning System
- **Instant Notifications**: Users receive immediate warnings when violations are detected
- **Severity Levels**: Four levels of warnings
  - ⚠️ Low: Activity warning
  - ⚠️ Medium: Security alert with violation details
  - 🚨 High: Final warning before block
  - 🔒 Critical: Account blocked notification
- **Detailed Information**: Each warning includes:
  - Specific reason for the violation
  - IP address involved
  - Timestamp of the incident
  - Next steps or consequences

### Security Monitoring (Officials Only)
- **Security Dashboard**: Real-time view of security metrics
  - Total suspicious activities
  - 24-hour activity breakdown by severity
  - Number of blocked IPs
  - Currently blocked users
- **Activity Log**: Detailed log of all security incidents
  - User ID and IP address
  - Action taken
  - Severity level
  - Timestamp
- **Manual Controls**: Officials can:
  - Unblock users by identifier
  - Remove IPs from blocklist
  - View recent security activities

### How It Protects Users
1. **Prevents Spam**: Automatically detects and blocks spam content before it reaches the platform
2. **Stops Abuse**: Rate limiting prevents system abuse and DOS attacks
3. **Eliminates Duplicates**: Prevents the same issue from being submitted multiple times
4. **Educates Users**: Clear warnings help users understand violations
5. **Maintains Quality**: Ensures only legitimate civic issues are posted
6. **Fair Enforcement**: Graduated penalty system gives users chances to correct behavior

### Technical Implementation
- **In-Memory Tracking**: Fast, efficient rate limiting using Map structures
- **Automatic Cleanup**: Old entries are automatically removed to prevent memory issues
- **Graceful Degradation**: System continues working even if AI spam detection fails
- **Zero False Positives**: Multiple validation layers ensure legitimate content isn't blocked
- **Non-Blocking**: Security checks happen asynchronously without slowing down the application

## Real-time Features
A notification system provides updates on complaint status, community activities, and city alerts. While WebSockets are architecturally prepared, current implementation uses polling for updates. Notifications are categorized and read status is maintained.

## Officials Dashboard
The Officials Dashboard provides municipal staff with tools to manage civic issues:

### Core Features
- **Role-based Access Control**: Secure authentication for municipal staff
- **Statistics Overview**: Real-time metrics on issue status and priority distribution
- **Issue Management**: Search, filter, resolve with proof upload, and delete capabilities
- **Modern UI/UX**: Glass morphism effects and smooth animations

### Map Visualization (Analytics Tab)
- **Interactive OpenStreetMap**: View all city complaints on an interactive map
- **Three View Modes** (identical to Citizen Dashboard):
  1. **Individual Markers**: Each complaint shown as a separate marker with status-based colors:
     - Green: Resolved issues
     - Red: Urgent priority (>7 reports in area)
     - Orange: Medium priority (3-7 reports in area)
     - Yellow: Low priority (<3 reports in area)
  2. **Heatmap View**: Heat intensity visualization based on issue priority
  3. **Density View (By Count)**: Groups reports by location with color-coded markers:
     - Yellow: Less than 3 reports at location
     - Orange: 3-7 reports at location
     - Red: More than 7 reports at location
- **Interactive Popups**: Click markers to view detailed complaint information
- **Dynamic Legends**: Context-aware legends that change based on selected view mode

## Citizen Dashboard
The Citizen Dashboard now includes comprehensive map visualization features:

### Map Integration (New Tab)
- **Interactive OpenStreetMap**: View all city complaints on an interactive map
- **Three View Modes**:
  1. **Heatmap View**: Heat intensity based on issue priority
  2. **Individual Markers**: Each complaint shown as a separate marker with priority-based colors (red: high, orange: medium, green: low)
  3. **Density View (By Count)**: Groups reports by location with color-coded markers:
     - Yellow: Less than 3 reports at location
     - Orange: 3-7 reports at location
     - Red: More than 7 reports at location
- **Map Controls**: Zoom in/out, reset to default view, center on user location
- **Filter Options**: Filter by area and priority
- **Interactive Popups**: Click markers to view complaint details
- **Map Statistics**: View total issues, priority breakdown, and area distribution

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