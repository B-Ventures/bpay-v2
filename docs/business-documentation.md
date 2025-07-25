
# bpay Platform - Business Documentation

## Executive Summary

bpay is a revolutionary payment platform that enables users to split payments across multiple funding sources while providing virtual card (bcard) capabilities for secure online transactions. The platform serves consumers, merchants, and administrators through a comprehensive web application with Stripe integration.

---

## Module 1: User Management & Authentication

### Epic 1.1: User Authentication & Profile Management

**Business Value**: Secure user onboarding and identity management

#### User Stories:

**Story 1.1.1**: User Registration and Login
- **As a** new user
- **I want to** register and login securely using Replit Auth
- **So that** I can access the bpay platform safely
- **Acceptance Criteria**:
  - Users can authenticate via Replit OIDC
  - User profiles are automatically created with basic information
  - Sessions are securely managed with HttpOnly cookies
  - Users remain logged in for 1 week unless manually logged out

**Story 1.1.2**: Profile Management
- **As a** registered user
- **I want to** view and update my profile information
- **So that** my account details are accurate for payment processing
- **Acceptance Criteria**:
  - Users can view first name, last name, email, phone number
  - Users can update contact information and address
  - Profile changes are validated and saved to the database
  - Address information is used for Stripe cardholder creation

**Story 1.1.3**: Role-Based Access Control
- **As a** platform administrator
- **I want to** assign different roles to users (user, merchant, admin)
- **So that** access to features is properly controlled
- **Acceptance Criteria**:
  - Default role is "user" for new registrations
  - Merchants can access merchant-specific features
  - Admins can access administrative panels
  - Role changes require admin privileges

---

## Module 2: Funding Sources Management

### Epic 2.1: Payment Method Integration

**Business Value**: Flexible payment source management for split transactions

#### User Stories:

**Story 2.1.1**: Add Credit/Debit Cards
- **As a** user
- **I want to** add my credit and debit cards as funding sources
- **So that** I can use them for payment splitting
- **Acceptance Criteria**:
  - Users can enter card number, expiry, CVV, and cardholder name
  - Real Stripe payment methods are created for live cards
  - Mock payment methods are created for demo/development
  - Card brand is automatically detected (Visa, Mastercard, Amex)
  - Last 4 digits are displayed for identification

**Story 2.1.2**: Funding Source Configuration
- **As a** user
- **I want to** configure default split percentages for each funding source
- **So that** payments are automatically distributed according to my preferences
- **Acceptance Criteria**:
  - Users can set default percentage splits for each card
  - Percentages can be updated at any time
  - Custom names can be assigned to funding sources
  - Balance information is displayed (mock $100 for demo cards)

**Story 2.1.3**: Funding Source Management
- **As a** user
- **I want to** view, edit, and delete my funding sources
- **So that** I can maintain control over my payment methods
- **Acceptance Criteria**:
  - All funding sources are listed with card details
  - Users can update names and default percentages
  - Deletion removes the card from both local database and Stripe
  - Inactive cards are properly marked and handled

### Epic 2.2: Demo Data Generation

**Business Value**: Seamless onboarding experience with sample data

#### User Stories:

**Story 2.2.1**: Automatic Sample Data Creation
- **As a** new user
- **I want to** see sample funding sources when I first log in
- **So that** I can immediately understand how the platform works
- **Acceptance Criteria**:
  - Two sample cards are created automatically for new users
  - Sample cards include "Chase Freedom" (Visa) and "Bank of America" (Mastercard)
  - Default split percentages are pre-configured (60%/40%)
  - Sample cards have mock balances for testing

---

## Module 3: Virtual Cards (bcards) Management

### Epic 3.1: bcard Creation and Management

**Business Value**: Secure virtual payment cards with spending controls

#### User Stories:

**Story 3.1.1**: Create Virtual Cards (bcards)
- **As a** user
- **I want to** create virtual cards funded by my payment sources
- **So that** I can make secure online purchases without exposing real card details
- **Acceptance Criteria**:
  - bcards are created through Stripe Issuing integration
  - Spending limits can be configured per card
  - Merchant restrictions can be applied
  - Cards are immediately available for use after creation
  - Real card details are provided for checkout (number, expiry, CVV)

**Story 3.1.2**: bcard Status Management
- **As a** user
- **I want to** freeze/unfreeze my virtual cards
- **So that** I can control when and where they can be used
- **Acceptance Criteria**:
  - Cards can be toggled between "active" and "inactive" status
  - Status changes are immediately reflected in Stripe
  - Frozen cards cannot be used for transactions
  - Status changes are logged for audit purposes

**Story 3.1.3**: Secure Card Details Access
- **As a** user
- **I want to** access my virtual card details for online checkout
- **So that** I can complete purchases securely
- **Acceptance Criteria**:
  - Full card details are available through authenticated endpoint
  - Card number, expiry, CVV, and cardholder name are provided
  - Details are only accessible to the card owner
  - Demo cards return test card numbers for development

### Epic 3.2: Spending Controls and Limits

**Business Value**: Enhanced financial control and fraud prevention

#### User Stories:

**Story 3.2.1**: Spending Limit Configuration
- **As a** user
- **I want to** set spending limits on my virtual cards
- **So that** I can control my spending and prevent unauthorized large transactions
- **Acceptance Criteria**:
  - Monthly spending limits can be configured during card creation
  - Limits are enforced by Stripe Issuing
  - Users are notified when approaching limits
  - Limits can be adjusted after card creation

**Story 3.2.2**: Merchant Category Controls
- **As a** user
- **I want to** restrict virtual cards to specific merchant categories
- **So that** cards can only be used for intended purposes
- **Acceptance Criteria**:
  - Allowed and blocked merchant categories can be configured
  - Category restrictions are enforced by Stripe
  - Common categories are provided as presets
  - Custom category restrictions can be added

---

## Module 4: Payment Processing & Splitting

### Epic 4.1: Split Payment Engine

**Business Value**: Core payment splitting functionality with multi-source funding

#### User Stories:

**Story 4.1.1**: Configure Payment Splits
- **As a** user
- **I want to** configure how payments are split across my funding sources
- **So that** I can optimize my payment strategy based on rewards, balances, and preferences
- **Acceptance Criteria**:
  - Splits can be configured by percentage or fixed amounts
  - Total splits must equal 100% for percentage-based splits
  - Real-time validation ensures splits are mathematically correct
  - Split configurations can be saved as templates

**Story 4.1.2**: Process Split Payments
- **As a** user
- **I want to** execute payments that are automatically split across my funding sources
- **So that** I can pay merchants while optimizing my payment distribution
- **Acceptance Criteria**:
  - Funds are captured from each source according to split configuration
  - 2.9% bpay fee is calculated and applied
  - All charges must succeed before payment completion
  - Failed charges result in transaction rollback
  - Virtual card is loaded with the total amount for merchant use

**Story 4.1.3**: Balance Validation
- **As a** user
- **I want to** have my available balances validated before payment processing
- **So that** payments only proceed when I have sufficient funds
- **Acceptance Criteria**:
  - Available balances are checked for each funding source
  - Insufficient funds prevent payment processing
  - Clear error messages indicate which sources lack funds
  - Mock balances are used for demo/development cards

### Epic 4.2: Payment Demo System

**Business Value**: Risk-free demonstration of payment splitting capabilities

#### User Stories:

**Story 4.2.1**: Interactive Payment Demo
- **As a** potential user
- **I want to** try the payment splitting feature without real money
- **So that** I can understand the platform before committing
- **Acceptance Criteria**:
  - Demo environment uses mock payment processing
  - Sample merchant checkout experience
  - Real-time split calculation and visualization
  - No actual charges are processed in demo mode

**Story 4.2.2**: Demo Mode Toggle
- **As a** user
- **I want to** switch between demo and live payment modes
- **So that** I can test features safely before using real payments
- **Acceptance Criteria**:
  - Demo mode toggle is clearly visible and accessible
  - Demo mode uses mock data and simulated transactions
  - Live mode uses real Stripe integration
  - Mode switching is immediate and clearly indicated

---

## Module 5: Transaction Management & History

### Epic 5.1: Transaction Recording and Tracking

**Business Value**: Comprehensive transaction history and audit trail

#### User Stories:

**Story 5.1.1**: Transaction History Viewing
- **As a** user
- **I want to** view my complete transaction history
- **So that** I can track my spending and payment patterns
- **Acceptance Criteria**:
  - All transactions are displayed in chronological order
  - Transaction details include amount, merchant, date, and status
  - Split information shows how payment was distributed
  - Fees are clearly displayed separately from transaction amounts

**Story 5.1.2**: Transaction Details and Receipts
- **As a** user
- **I want to** view detailed information about each transaction
- **So that** I can understand exactly how my payment was processed
- **Acceptance Criteria**:
  - Detailed view shows all funding sources used
  - Individual amounts charged to each source
  - Fee breakdown and total amounts
  - Virtual card used for the transaction
  - Stripe transaction IDs for reference

**Story 5.1.3**: Mobile-Optimized Transaction View
- **As a** mobile user
- **I want to** easily view and navigate my transaction history on mobile devices
- **So that** I can manage my payments on the go
- **Acceptance Criteria**:
  - Card-based layout optimized for mobile screens
  - Touch-friendly navigation and interactions
  - Responsive design adapts to different screen sizes
  - Essential information is easily accessible

---

## Module 6: Merchant Integration

### Epic 6.1: Merchant Portal and API

**Business Value**: Enable businesses to accept bpay payments

#### User Stories:

**Story 6.1.1**: Merchant Registration
- **As a** business owner
- **I want to** register as a merchant on the bpay platform
- **So that** I can accept bpay payments from customers
- **Acceptance Criteria**:
  - Merchants can register with business information
  - Business email and website are validated
  - Unique API keys are generated for each merchant
  - Merchant status can be activated/deactivated

**Story 6.1.2**: Merchant API Integration
- **As a** merchant
- **I want to** integrate bpay into my e-commerce platform
- **So that** customers can pay using bpay splitting functionality
- **Acceptance Criteria**:
  - RESTful API endpoints for payment processing
  - Comprehensive API documentation
  - Webhook support for payment notifications
  - Test and live API keys for development and production

**Story 6.1.3**: Merchant Dashboard
- **As a** merchant
- **I want to** view my transaction volume and payment analytics
- **So that** I can understand my bpay payment performance
- **Acceptance Criteria**:
  - Dashboard shows total volume and transaction count
  - Transaction history filtered by merchant
  - Revenue analytics and reporting
  - Payment method breakdowns

---

## Module 7: Administrative Functions

### Epic 7.1: Platform Administration

**Business Value**: Comprehensive platform management and oversight

#### User Stories:

**Story 7.1.1**: User Management
- **As an** administrator
- **I want to** view and manage all platform users
- **So that** I can ensure platform security and compliance
- **Acceptance Criteria**:
  - Complete user list with profile information
  - Ability to view user roles and permissions
  - User activity monitoring and audit logs
  - Account suspension and reactivation capabilities

**Story 7.1.2**: Transaction Monitoring
- **As an** administrator
- **I want to** monitor all platform transactions
- **So that** I can detect fraud and ensure platform health
- **Acceptance Criteria**:
  - Real-time transaction monitoring dashboard
  - Fraud detection and alert systems
  - Transaction volume and revenue analytics
  - Dispute and chargeback management

**Story 7.1.3**: Merchant Oversight
- **As an** administrator
- **I want to** manage merchant accounts and API access
- **So that** only legitimate businesses can integrate with bpay
- **Acceptance Criteria**:
  - Merchant verification and approval process
  - API key management and rotation
  - Merchant performance monitoring
  - Revenue sharing and fee management

---

## Module 8: Security & Compliance

### Epic 8.1: Financial Security and PCI Compliance

**Business Value**: Secure handling of financial data and regulatory compliance

#### User Stories:

**Story 8.1.1**: Secure Card Data Handling
- **As a** platform operator
- **I want to** ensure all card data is handled securely
- **So that** we maintain PCI DSS compliance and user trust
- **Acceptance Criteria**:
  - No full card numbers stored locally
  - All sensitive data encrypted in transit and at rest
  - Stripe tokenization for secure card storage
  - Regular security audits and compliance checks

**Story 8.1.2**: Session Security
- **As a** user
- **I want to** have my sessions secured with proper authentication
- **So that** my account and financial data are protected
- **Acceptance Criteria**:
  - Secure session management with HttpOnly cookies
  - HTTPS enforcement in production
  - Session timeout and renewal mechanisms
  - Multi-factor authentication support

**Story 8.1.3**: Fraud Prevention
- **As a** platform operator
- **I want to** implement fraud detection and prevention measures
- **So that** the platform is protected from malicious activities
- **Acceptance Criteria**:
  - Real-time transaction monitoring
  - Suspicious activity detection algorithms
  - Automated account freezing capabilities
  - Integration with Stripe's fraud detection tools

---

## Module 9: Integration & APIs

### Epic 9.1: Stripe Integration Management

**Business Value**: Robust payment processing through Stripe's infrastructure

#### User Stories:

**Story 9.1.1**: Stripe Issuing Integration
- **As a** platform operator
- **I want to** leverage Stripe Issuing for virtual card creation
- **So that** users can receive real, secure virtual cards
- **Acceptance Criteria**:
  - Automatic cardholder creation in Stripe
  - Real-time virtual card provisioning
  - Spending controls and merchant restrictions
  - Balance management and funding

**Story 9.1.2**: Payment Method Management
- **As a** platform operator
- **I want to** securely manage user payment methods through Stripe
- **So that** payment processing is reliable and secure
- **Acceptance Criteria**:
  - Payment method tokenization and storage
  - Real-time payment processing
  - Webhook handling for payment events
  - Error handling and retry mechanisms

**Story 9.1.3**: Multi-Environment Support
- **As a** developer
- **I want to** easily switch between test and production environments
- **So that** development and testing can be done safely
- **Acceptance Criteria**:
  - Automatic environment detection based on API keys
  - Mock data for development and testing
  - Configuration scripts for environment setup
  - Clear separation between test and live data

---

## Module 10: User Experience & Interface

### Epic 10.1: Responsive Web Application

**Business Value**: Intuitive and accessible user interface across all devices

#### User Stories:

**Story 10.1.1**: Mobile-First Design
- **As a** mobile user
- **I want to** access all platform features on my mobile device
- **So that** I can manage payments anywhere, anytime
- **Acceptance Criteria**:
  - Responsive design optimized for mobile screens
  - Touch-friendly interface elements
  - Fast loading times on mobile networks
  - Consistent experience across devices

**Story 10.1.2**: Dashboard and Navigation
- **As a** user
- **I want to** easily navigate between different platform features
- **So that** I can efficiently manage my payments and cards
- **Acceptance Criteria**:
  - Intuitive navigation with clear section labels
  - Quick access to frequently used features
  - Visual indicators for important information
  - Consistent design language throughout

**Story 10.1.3**: Real-Time Updates
- **As a** user
- **I want to** see real-time updates when my data changes
- **So that** I always have the most current information
- **Acceptance Criteria**:
  - Automatic refresh of transaction data
  - Real-time balance updates
  - Immediate reflection of configuration changes
  - Loading states and progress indicators

---

## Module 11: Marketing & Landing

### Epic 11.1: Public-Facing Website

**Business Value**: User acquisition and platform promotion

#### User Stories:

**Story 11.1.1**: Landing Page Experience
- **As a** potential user
- **I want to** understand what bpay offers and how it works
- **So that** I can decide whether to sign up
- **Acceptance Criteria**:
  - Clear value proposition and feature explanations
  - Step-by-step how-it-works section
  - Pricing information and plans
  - Call-to-action buttons for registration

**Story 11.1.2**: Feature Showcases
- **As a** visitor
- **I want to** see detailed information about bpay's capabilities
- **So that** I can understand the benefits before committing
- **Acceptance Criteria**:
  - Interactive demonstrations of key features
  - Security and compliance information
  - Integration examples for merchants
  - Customer testimonials and use cases

---

## Technical Architecture Summary

### Core Technologies:
- **Frontend**: React with TypeScript, Tailwind CSS, Radix UI
- **Backend**: Node.js with Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OIDC
- **Payments**: Stripe API with Issuing integration
- **Deployment**: Replit with autoscale configuration

### Key Integrations:
- **Stripe Issuing**: Virtual card creation and management
- **Stripe Payments**: Payment method storage and processing
- **Replit Auth**: Secure user authentication
- **Neon PostgreSQL**: Serverless database hosting

### Security Features:
- PCI DSS compliance through Stripe
- Secure session management
- HTTPS enforcement
- Data encryption and tokenization
- Fraud detection and prevention

This comprehensive business documentation provides a complete overview of the bpay platform's capabilities, organized by business value and user needs. Each module represents a major functional area, while epics group related features, and user stories define specific functionality from the user's perspective.
