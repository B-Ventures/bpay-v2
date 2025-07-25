# bpay - Payment Splitting Platform

## Overview

bpay is a full-stack payment splitting platform that allows users to combine multiple funding sources and divide any payment amount based on their preferences. The application provides a comprehensive solution for managing virtual cards, funding sources, and transactions with integrated Stripe payment processing.

## User Preferences

Preferred communication style: Simple, everyday language.
Card terminology: Use "bcard" instead of "virtual cards" in user interfaces and customer communications.
Payment processing: Implement Stripe Issuing for card generation in production mode with proper testing/sandbox configuration.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite for development and building
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: PostgreSQL-based session storage
- **Payment Processing**: Stripe integration

### Database Design
- **ORM**: Drizzle with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` for type sharing
- **Migration Strategy**: Drizzle Kit for schema management
- **Connection**: Neon serverless PostgreSQL

## Key Components

### Authentication System
- **Provider**: Replit Auth with OIDC
- **Session Storage**: PostgreSQL-based sessions using connect-pg-simple
- **User Management**: Automatic user creation and profile management
- **Role-based Access**: User, merchant, and admin roles

### Database Schema
- **Users**: Profile information, roles, and Stripe customer data
- **Funding Sources**: Credit cards, debit cards, and bank accounts
- **Virtual Cards**: Generated cards with spending limits and merchant restrictions
- **Transactions**: Payment history and transaction details
- **Merchants**: Merchant profiles and business information
- **Sessions**: Secure session management for authentication

### Payment Processing
- **Primary Integration**: Stripe for payment processing
- **Virtual Card Generation**: Custom virtual card creation with spending controls
- **Payment Splitting**: Logic to distribute payments across multiple funding sources
- **Transaction Tracking**: Comprehensive transaction history and reporting

### User Interface
- **Dashboard**: Overview of cards, transactions, and spending
- **Funding Sources**: Management of payment methods
- **Virtual Cards**: Creation and management of virtual cards
- **Transactions**: History and filtering of payment activities
- **Admin Panel**: Administrative controls for user and merchant management

## Data Flow

1. **User Authentication**: Users authenticate via Replit Auth, creating or updating user profiles
2. **Funding Source Management**: Users add credit cards, bank accounts, or other payment methods
3. **Virtual Card Creation**: Users create virtual cards with specific spending limits and merchant restrictions
4. **Payment Processing**: Transactions are processed through Stripe with payment splitting logic
5. **Transaction Recording**: All transactions are logged with detailed information
6. **Reporting**: Users can view transaction history and spending analytics

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Replit Auth service
- **Payment Processing**: Stripe API
- **UI Components**: Radix UI primitives
- **Form Management**: React Hook Form with Zod validation

### Development Tools
- **Build System**: Vite with React plugin
- **Type Checking**: TypeScript with strict mode
- **Database Management**: Drizzle Kit for migrations
- **Code Quality**: ESLint configuration (implied)

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express backend
- **Hot Module Replacement**: Vite HMR for fast development
- **Database**: Environment-based PostgreSQL connection
- **Authentication**: Replit Auth with development configuration

### Production Build
- **Frontend**: Vite build to `dist/public`
- **Backend**: ESBuild bundling to `dist/index.js`
- **Static Assets**: Served by Express in production
- **Environment Variables**: Database URL, session secrets, Stripe keys

### Key Configuration
- **Session Management**: Secure HTTP-only cookies with 1-week expiration
- **CORS**: Configured for Replit domains
- **Security**: HTTPS-only in production with secure session cookies
- **Database**: Connection pooling with Neon serverless PostgreSQL

### Monitoring and Error Handling
- **Request Logging**: Comprehensive API request logging
- **Error Handling**: Global error handler with proper status codes
- **Performance Monitoring**: Request duration tracking
- **Development Tools**: Replit-specific development plugins and error overlays

## Recent Changes

### January 25, 2025
- **True Browser Extension Implementation**: Completely redesigned banner integration to provide authentic browser extension behavior
  - **Non-Intrusive Banner Mode**: bpay extension operates ONLY within top banner, never modifying merchant site content
  - **Merchant Site Integrity**: Original checkout form always remains visible and functional in banner mode
  - **Complete Extension Flow**: All bpay functionality (splits, processing, card generation) contained within banner overlay
  - **Proper Card Handoff**: Extension populates generated card details into merchant's existing payment form
  - **Extension-Style UX**: Professional overlay with "Extension" badge and compact responsive design
  - **Dual Integration Demo**: Clear distinction between addon (embedded) and banner (overlay) integration approaches
  - **Natural Checkout Experience**: Fixed banner mode to behave like normal checkout - removed special "bcard Ready!" messages and styling
  - **Correct Pricing**: Fixed checkout demo pricing calculations to match subtotal ($2,277.00 + $182.16 tax = $2,459.16 total)

### January 24, 2025
- **Unified bcard Creation Flow**: Successfully consolidated two separate bcard creation interfaces into single comprehensive process
  - **Eliminated Duplicate Interfaces**: Removed inconsistent creation approaches between Quick Actions and Virtual Cards tab
  - **Auto-populated Cardholder Names**: System now automatically fills cardholder names from user account registration data
  - **Two-Step Creation Process**: Implemented step 1 (bcard details) and step 2 (funding source percentage splits)
  - **Real-time Calculation**: Added live amount calculations as users adjust percentage splits across funding sources
  - **Enhanced Validation**: System ensures funding splits total exactly 100% before allowing bcard creation
  - **Database Schema Updates**: Added balance field to funding sources with proper decimal handling for mock balances
  - **Error Resolution**: Fixed TypeScript errors related to decimal balance parsing from database responses
- **Critical Security Fix - Balance Validation**: Implemented mandatory funding source balance validation before any bcard generation
  - **Pre-Processing Validation**: Added comprehensive balance checks that prevent card creation when funding sources lack sufficient funds
  - **Detailed Error Reporting**: Enhanced error messages show exactly which funding sources have insufficient balance
  - **Mock Balance Simulation**: Each mock funding source now limited to $100 to simulate realistic balance constraints
  - **Fee Calculation**: System now validates total amount including 2.9% bpay fees before processing
  - **User-Friendly Error Messages**: Frontend displays detailed breakdown of required vs available funds per source
  - **Test Mode Detection**: Automatically detects test vs live Stripe keys for appropriate API endpoint usage

### January 23, 2025
- **Complete Stripe Issuing Integration**: Fully integrated real virtual card generation using Stripe Issuing APIs
  - **Fund Capture Flow**: Implemented real payment processing to capture funds from user funding sources into bpay's pool account
  - **Real Virtual Card Creation**: Replaced mock card generation with authentic Stripe Issuing API calls for production-ready virtual cards
  - **Cardholder Management**: Added Stripe cardholder creation with proper user information and address handling
  - **Secure Card Details**: Implemented secure endpoint for retrieving full card details for merchant checkout
  - **Card Management Features**: Added freeze/unfreeze functionality and proper card status management
  - **Payment Demo Integration**: Updated payment demo page to demonstrate complete end-to-end flow with real APIs
  - **Database Schema Updates**: Enhanced user schema with phoneNumber and address fields required for Stripe Issuing

### January 20, 2025
- **Real Stripe Integration Implementation**: Upgraded from mock payment processing to authentic Stripe API calls
  - Updated funding source creation to use real Stripe payment methods instead of mock IDs
  - Modified payment processing endpoint to create actual Stripe payment intents
  - Added fallback to mock processing only when real Stripe calls fail
  - Enabled testing with actual Stripe Issuing test cards and test payment methods
  - Fixed payment demo page to work with both real and mock payment processing

- **Comprehensive Demo Mode System**: Implemented global demo mode toggle with persistent state
  - Created DemoModeProvider for application-wide state management
  - Added compact, responsive demo mode toggle with tooltip functionality
  - Integrated demo mode across funding sources, payment splitter, and transactions
  - Toggle persists across browser sessions using localStorage
  - Positioned toggle strategically below headers for optimal mobile experience
  - Fixed all demo mode integration issues in payment demo page

- **Mobile-First UI Redesign**: Enhanced responsive design and user experience
  - Completely redesigned transactions tab with card-based layout instead of table
  - Improved mobile navigation with flexible tab positioning and demo toggle placement
  - Added comprehensive transaction details including dates, virtual card names, and descriptions
  - Enhanced header responsiveness with proper spacing and element positioning
  - Fixed mobile overflow issues and improved touch-friendly interactions

### January 19, 2025
- **Fixed Funding Source Creation**: Resolved critical Stripe integration issues
  - Replaced unsafe raw card data handling with mock payment methods for development
  - Fixed Stripe live mode conflicts by using generated mock payment method IDs
  - Implemented safe development approach that avoids Stripe security restrictions
  - Successfully tested funding source creation with test card data (4242424242424242)

- **Enhanced Demo Mode Support**: Improved payment demo accessibility
  - Added demo funding sources for unauthenticated users (Chase Freedom, Bank of America)
  - Updated PaymentSplitter component to work with both authenticated and demo modes
  - Fixed AddFundingModal to handle demo mode gracefully with appropriate messaging
  - Resolved authentication conflicts in payment demo flow

### January 17, 2025
- **Enhanced bcard Generation Flow**: Implemented realistic payment processing simulation
  - Added step-by-step progress tracking for each funding source deduction
  - Created real-time balance collection display showing collected vs remaining amounts
  - Added visual progress indicators with checkmarks for completed steps
  - Improved timing to reflect actual processing duration (1.5 seconds per funding source)
  - Enhanced user experience with detailed processing steps and expected completion times

- **Multi-Step Payment Demo**: Redesigned payment flow with 5 distinct steps
  - Step 1: Checkout configuration
  - Step 2: Payment split configuration  
  - Step 3: Realistic bcard generation with progress tracking
  - Step 4: Merchant checkout auto-fill
  - Step 5: Payment completion

- **Improved User Experience**: Added comprehensive visual feedback during bcard creation
  - Real-time progress bar with smooth animations
  - Individual funding source processing status
  - Balance collection tracking with collected/remaining amounts
  - Processing time estimates based on number of funding sources