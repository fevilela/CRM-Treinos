# Overview

This is a CRM system for personal trainers called "CRM Treinos MP". It's a full-stack web application that helps personal trainers manage their clients, create personalized workout plans, and track student progress including body evolution measurements. The system features a comprehensive dashboard with statistics, student management, workout creation, and progress tracking capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built using React with TypeScript, utilizing a modern component-based architecture:
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized production builds

The application follows a page-based routing structure with main sections for Dashboard, Students, Workouts, Progress tracking, and Body Evolution monitoring.

## Backend Architecture
The backend follows a RESTful API pattern using Express.js:
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database interactions
- **Authentication**: Replit Auth integration with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **API Structure**: Organized route handlers in a single routes file
- **Data Layer**: Storage abstraction pattern for database operations

## Database Design
The system uses PostgreSQL with a well-structured schema:
- **Users Table**: Stores personal trainer information (required for Replit Auth)
- **Students Table**: Client information with personal details, goals, and status
- **Workouts Table**: Workout plans categorized by muscle groups
- **Exercises Table**: Individual exercises within workout plans
- **Workout Sessions Table**: Tracking actual workout completions
- **Exercise Performances Table**: Detailed performance metrics per exercise
- **Body Measurements Table**: Physical measurements for progress tracking
- **Sessions Table**: Authentication session storage (required for Replit Auth)

The schema uses PostgreSQL enums for standardized values (gender, status, workout categories) and includes proper relationships between entities.

## Authentication System
Implements Replit's authentication system:
- **Provider**: Replit OpenID Connect integration
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Authorization**: Route-level protection with isAuthenticated middleware
- **User Management**: Automatic user creation/updates via upsert operations

## Component Architecture
The frontend follows a structured component organization:
- **Pages**: Top-level route components (Dashboard, Students, Workouts)
- **Layout Components**: Reusable layout elements (Sidebar, Header)
- **Feature Components**: Domain-specific components (StatsCards, ProgressChart)
- **Modal Components**: Form dialogs for data entry (StudentModal, WorkoutModal)
- **UI Components**: Base design system components from shadcn/ui

# External Dependencies

## Database
- **Neon Database**: PostgreSQL hosting with serverless capabilities
- **Connection**: Uses @neondatabase/serverless for WebSocket-based connections
- **Migration**: Drizzle Kit for schema management and migrations

## Authentication
- **Replit Auth**: OpenID Connect authentication provider
- **Session Storage**: connect-pg-simple for PostgreSQL session persistence
- **Passport.js**: Authentication middleware for OpenID Connect strategy

## UI and Styling
- **Radix UI**: Headless UI components for accessibility and behavior
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library built on Radix UI
- **Font Awesome**: Icon library for UI elements
- **Google Fonts**: Inter and DM Sans font families

## Development and Build
- **Vite**: Frontend build tool and dev server
- **Replit Plugins**: Development environment integration
- **Chart.js**: Data visualization for progress charts
- **TypeScript**: Static type checking across the entire stack

## Form and Validation
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and schema definition
- **@hookform/resolvers**: Integration between React Hook Form and Zod

## API and Data Fetching
- **TanStack Query**: Server state management and caching
- **Fetch API**: HTTP client for API requests with credential handling