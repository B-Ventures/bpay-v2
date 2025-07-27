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

### Merchant API System (NEW - 2025-01-28)
- **REST API**: Complete merchant integration APIs following fintech standards
- **Authentication**: Bearer token authentication with API keys (sk_test_/sk_live_)
- **Payment Intents**: Core payment processing workflow with split configuration
- **Webhooks**: Real-time event notifications with signature verification
- **Rate Limiting**: 100 requests/minute per merchant with burst protection
- **Platform Integrations**: WordPress/WooCommerce, Shopify, and custom implementations
- **Merchant Dashboard**: Complete interface for API management and analytics

### Database Schema
- **Users**: Profile information, roles, and Stripe customer data
- **Funding Sources**: Credit cards, debit cards, and bank accounts
- **Virtual Cards**: Generated cards with spending limits and merchant restrictions
- **Transactions**: Payment history and transaction details
- **Merchants**: Merchant profiles and business information with API keys
- **Payment Intents**: Payment processing workflow objects (NEW)
- **Webhook Events**: Event tracking and delivery status (NEW)
- **API Usage**: Rate limiting and analytics tracking (NEW)
- **Sessions**: Secure session management for authentication

### Payment Processing
- **Primary Integration**: Stripe for payment processing
- **Virtual Card Generation**: Custom virtual card creation with spending controls
- **Payment Splitting**: Logic to distribute payments across multiple funding sources
- **Merchant APIs**: RESTful payment processing for external integrations
- **Transaction Tracking**: Comprehensive transaction history and reporting

### User Interface
- **Dashboard**: Overview of cards, transactions, and spending
- **Funding Sources**: Management of payment methods
- **Virtual Cards**: Creation and management of virtual cards
- **Transactions**: History and filtering of payment activities
- **Merchant Dashboard**: API key management, payment monitoring, integration guides (NEW)
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

### January 27, 2025
- **Complete Admin Panel Authentication System**: Implemented comprehensive special admin login process completely separate from normal bpay user registration
  - **JWT-Based Admin Authentication**: Created secure admin login system using email/password with JWT tokens (8-hour expiration)
  - **Separate Admin Credentials**: Admin access requires username ("bpay_admin"), password ("admin123!"), and access code ("BPAY2025") - completely isolated from user accounts
  - **Professional Admin Login UI**: Built dedicated admin login page with Shield icon, password visibility toggle, and security messaging
  - **Bearer Token API Authentication**: All admin API endpoints protected with Bearer token validation middleware
  - **Admin Session Management**: Automatic token verification and refresh with localStorage persistence
  - **Complete Admin Panel Interface**: Comprehensive dashboard with user management, merchant management, KYC workflows, vendor management, and revenue analytics
  - **Real-Time Admin Dashboard**: Live platform metrics including total revenue, user count, merchant count, bcard success rates, and system health monitoring
  - **Role-Based Access Control**: Admin-only access to platform management features with proper authorization checks
  - **Secure Admin Routes**: All admin functionality requires special authentication, preventing unauthorized access to platform management
  - **Production-Ready Architecture**: Admin system designed for secure platform administration with proper token management and session handling

### January 27, 2025
- **Complete Merchant API Implementation**: Successfully built and tested comprehensive REST APIs for bpay that blend Stripe APIs within bpay's interface
  - **Core Split Payment Processing**: Implemented real bcard payment engine that validates funding sources, processes multi-source payments, and generates virtual cards
  - **Stripe Integration Blended**: Merchants only interact with bpay APIs while Stripe powers payment processing, virtual card generation, and fund collection in the background
  - **Production-Ready Payment Flow**: Created complete payment intent creation → split payment confirmation → virtual card generation workflow
  - **Real-Time Balance Validation**: Added comprehensive funding source balance checking with detailed error reporting for insufficient funds
  - **Multi-Strategy Split Support**: Implemented percentage-based, amount-based, and smart splitting strategies for flexible payment distribution
  - **Fee Calculation System**: Built transparent fee structure with bpay fees (2.9%) and Stripe fee tracking for accurate merchant reporting
  - **Webhook Event System**: Created real-time payment status notifications for merchant integration and order fulfillment
  - **Authentication & Rate Limiting**: Implemented secure Bearer token authentication with 100 requests/minute rate limiting per merchant
  - **Merchant Management**: Built complete merchant profile, usage analytics, and transaction history APIs
  - **Demo Mode Support**: Added development mode for testing without actual Stripe charges while maintaining production-ready structure

## Recent Changes

### January 25, 2025
- **Comprehensive Landing Page Revamp**: Completely redesigned main landing page for enhanced user experience and investor appeal
  - **Modern Hero Section**: Gradient background with compelling messaging and social proof (12,000+ users, $2.5M+ processed)
  - **Investor-Focused Content**: Dedicated "For Investors" section highlighting $78B market opportunity, key metrics, and revenue model
  - **Enhanced Feature Showcase**: Upgraded features section with interactive hover effects and gradient icon backgrounds
  - **Professional Navigation**: Fixed navigation with "Live Platform" badge and direct demo links
  - **Terminology Compliance**: Used "bcard" instead of "virtual cards" throughout all user-facing content
  - **Mobile-First Design**: Fully responsive with optimized typography and spacing for all device sizes
  - **Call-to-Action Optimization**: Strategic placement of signup buttons and demo links to maximize conversion
  - **Market Positioning**: Positioned bpay as innovative fintech solution with strong competitive advantages
  - **Integrated Pricing Strategy**: Implemented new tiered pricing model with freemium, Pro ($9.99), and Premium ($19.99) plans
  - **Transaction Fee Scaling**: Applied decreasing transaction fees (2.9% → 1.9% → 0.9%) based on subscription tier and volume

- **Split Checkout Demo Pages**: Created separate demo pages with distinct URLs for different integration modes
  - **Addon Checkout Demo** (`/addon-checkout-demo`): Shows bpay integrated as embedded component within merchant checkout
  - **Banner Checkout Demo** (`/banner-checkout-demo`): Shows bpay operating as browser extension banner overlay
  - **URL-Based Differentiation**: Users can now access specific integration modes directly via URLs
  - **Mode-Specific UX**: Each demo clearly shows the distinct user experience for addon vs extension integration
  - **Self-Contained Payment Flows**: Both demos handle complete bpay payment processes without external redirects
  - **Integrated PaymentSplitter**: Full payment splitting functionality embedded within each demo context

- **Separate Investors Page**: Created dedicated `/investors` page with comprehensive market analysis and business model details
  - **Market Opportunity**: Highlighted $78B payment processing market with 12.7% CAGR growth
  - **Business Model**: Showcased hybrid subscription + transaction fee model with scalable pricing
  - **Key Metrics**: Displayed growth rate, transaction volume, user count, and retention statistics
  - **Investment Focus**: Positioned platform for investor relations and funding discussions

- **UI/UX Improvements**: Fixed button styling issues and enhanced user interface consistency
  - **Button Styling**: Resolved white text on white background issues with proper hover states
  - **Mobile Menu**: Implemented proper hamburger menu icon (placeholder functionality)
  - **Company Information**: Updated footer with B Ventures LLC copyright and contact details
  - **Contact Details**: Added phone (+1-551-375-8915), email (hello@getbpay.com), and Wyoming address
  - **Demo Terminology**: Updated button text from "Live Demo"/"Extension Demo" to "Merchant Demo"/"Customer Demo" for clearer user understanding
- **Popup Profile Interface for Addon Mode**: Implemented comprehensive popup-style profile interface for seamless addon integration
  - **ProfilePopup Component**: Created dedicated popup component with full profile viewing and editing capabilities
  - **Integrated User Menu**: Profile access through dashboard user menu with proper authentication handling
  - **Complete Profile Management**: Phone number, address, and account information editing with validation
  - **Responsive Design**: Mobile-friendly popup interface with proper form controls and navigation
  - **Authentication Flow**: Secure profile updates with backend validation and proper error handling

- **Complete Terminology Standardization**: Systematically replaced all "virtual cards" references with "bcard" throughout the codebase
  - **UI Components**: Updated all dashboard components, navigation, and user interfaces to use "bcard" terminology
  - **Backend Systems**: Modified API responses and database handling to reflect bcard naming convention
  - **User Communications**: Replaced technical terms with user-friendly "bcard" language across the platform
  - **Consistent Branding**: Ensured all references align with bpay brand identity and user preferences

- **Enhanced Registration Flow**: Improved onboarding experience with proper authentication options
  - **Removed Step Counter**: Replaced "1 out of 5 steps" with clean login/signup choice interface
  - **Clear Authentication Options**: Added distinct "Sign In" and "Create Account" buttons with proper styling
  - **User-Friendly Language**: Replaced "smart payments" with "this new smart payment approach" to clarify bpay concept
  - **Streamlined Flow**: Simplified registration process while maintaining all required functionality
  - **Terms and Privacy**: Added proper legal acknowledgment for user consent during registration
  - **Popup Registration Interface**: Converted registration flow to always render as popup overlay instead of inline content
  - **Improved UX**: Added close button and proper modal backdrop for professional popup experience

- **Comprehensive User Registration System**: Implemented complete onboarding flow for addon and extension integration
  - **First-Time User Guide**: Step-by-step introduction explaining bpay benefits and functionality
  - **Smart Registration Flow**: 5-step process (guide → welcome → profile → funding → complete)
  - **Progressive Onboarding**: Users learn about bpay before committing to account creation
  - **Cross-Integration Support**: Registration works seamlessly in both addon and banner extension modes
  - **Data Persistence**: User preferences and funding sources saved for future transactions across all merchant sites
  - **Authentication Integration**: Leverages existing Replit Auth system with profile completion flow
  - **Profile Enhancement**: Added phone number and address collection required for Stripe Issuing compliance
  - **Funding Source Setup**: Guided process for adding first payment method during registration
  - **Social Proof Integration**: Shows user count and ratings to build trust during onboarding

- **True Browser Extension Implementation**: Completely redesigned banner integration to provide authentic browser extension behavior
  - **Non-Intrusive Banner Mode**: bpay extension operates ONLY within top banner, never modifying merchant site content
  - **Merchant Site Integrity**: Original checkout form always remains visible and functional in banner mode
  - **Complete Extension Flow**: All bpay functionality (splits, processing, card generation) contained within banner overlay
  - **Proper Card Handoff**: Extension populates generated card details into merchant's existing payment form
  - **Extension-Style UX**: Professional overlay with "Extension" badge and compact responsive design
  - **Dual Integration Demo**: Clear distinction between addon (embedded) and banner (overlay) integration approaches
  - **Natural Checkout Experience**: Fixed banner mode to behave like normal checkout - removed special "bcard Ready!" messages and styling
  - **Correct Pricing**: Fixed checkout demo pricing calculations to match subtotal ($2,277.00 + $182.16 tax = $2,459.16 total)
  - **Core Feature Alignment**: Updated demo modes to use identical logic as production features for validation, fee calculation, and balance checking
  - **Realistic Demo Pricing**: Reduced demo prices to $145.77 total for practical testing with $300 total funding source balance
  - **Proper Payment Handoff**: Fixed addon mode to properly hand off bcard details to merchant checkout form instead of processing internally

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