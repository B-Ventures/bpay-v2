# bpay - Payment Splitting Platform

## Overview
bpay is a full-stack payment splitting platform designed to enable users to combine multiple funding sources and divide any payment amount based on their preferences. It offers comprehensive management of virtual cards (bcards), funding sources, and transactions, powered by integrated Stripe payment processing. The project aims to capture a significant share of the $78 billion payment processing market by offering an innovative solution for both consumers and merchants.

## User Preferences
Preferred communication style: Simple, everyday language.
Card terminology: Use "bcard" instead of "virtual cards" in user interfaces and customer communications.
Payment processing: Implement Stripe Issuing for card generation in production mode with proper testing/sandbox configuration.
Stripe API: Confirmed that Stripe uses the same API credentials (publishable key, secret key) for all services (Payment Processing, Card Issuing, Identity, Connect). Feature toggles control which APIs are used, not credential separation.

## Recent Changes (Updated 2025-01-01)
### Major Code Cleanup & Documentation Project
- ✅ **Resolved All TypeScript Errors**: Fixed 6 LSP diagnostics in server/admin-api.ts
- ✅ **Eliminated Code Duplication**: Removed redundant vendor-management.tsx file
- ✅ **Added Comprehensive Documentation**: Created ARCHITECTURE.md, TECHNICAL_DEBT.md, and CLEANUP_NOTES.md
- ✅ **Standardized API Patterns**: Consistent fetch patterns and error handling throughout frontend
- ✅ **Added Component Documentation**: JSDoc comments explaining purpose and features for all major components
- ✅ **Improved Code Organization**: Clear separation of concerns with dedicated admin folders and proper file structure

## System Architecture
### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library, utilizing Radix UI primitives
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: PostgreSQL-based session storage
- **Payment Processing**: Stripe integration
- **Merchant API System**: REST API for merchant integrations, including payment intents, webhooks, and rate limiting.

### Database Design
- **ORM**: Drizzle with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` for type sharing
- **Migration Strategy**: Drizzle Kit
- **Connection**: Neon serverless PostgreSQL
- **Key Schemas**: Users, Funding Sources, Virtual Cards (bcards), Transactions, Merchants, Payment Intents, Webhook Events, API Usage, Sessions.

### UI/UX Decisions
- **Terminology**: Consistent use of "bcard" throughout the platform.
- **Design Principles**: Mobile-first, responsive design with clear call-to-actions.
- **Dashboard**: Overview of cards, transactions, and spending.
- **Merchant Dashboard**: API key management, payment monitoring, integration guides.
- **Admin Panel**: Secure administrative controls for user and merchant management.
- **Payment Flow**: Multi-step payment demo to showcase bcard generation and splitting.
- **Internationalization**: Complete multi-language support (English/Arabic) with RTL/LTR handling.
- **Subscription Model**: Tiered pricing (Free, PRO, Premium) with dynamic fee calculation based on subscription level.

## External Dependencies
- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Replit Auth service
- **Payment Processing**: Stripe API (Stripe Issuing, Payment Intents)
- **UI Components**: Radix UI primitives, shadcn/ui
- **Form Management**: React Hook Form with Zod validation
- **Development Tools**: Vite, TypeScript, Drizzle Kit, ESLint