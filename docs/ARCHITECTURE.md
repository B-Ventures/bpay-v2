# bpay Platform Architecture

## Overview
bpay is a payment splitting platform that enables users to combine multiple funding sources and split payments using virtual cards (bcards). The platform integrates with Stripe for payment processing and card issuing.

## Core Architecture

### Frontend (React + TypeScript)
```
client/src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components  
│   └── payment/        # Payment-specific components
├── pages/              # Route components
│   ├── admin/          # Admin panel pages
│   └── demos/          # Demo checkout flows
├── hooks/              # Custom React hooks
└── lib/                # Utilities and configurations
```

### Backend (Node.js + Express)
```
server/
├── index.ts            # Main server entry point
├── admin-api.ts        # Admin panel API endpoints
├── routes.ts           # Public API routes
├── storage.ts          # Database layer abstraction
└── vite.ts             # Vite development server
```

### Database (PostgreSQL + Drizzle)
```
shared/
└── schema.ts           # Centralized database schema
```

## Core Features

### 1. Payment Splitting System
- **Virtual Cards (bcards)**: Generated cards with predefined amounts
- **Funding Sources**: User credit/debit cards for funding splits
- **Split Logic**: Configurable percentage-based payment splitting

### 2. Demo System
- **Addon Mode**: Embedded payment component
- **Banner Mode**: Browser extension style overlay
- **3D Secure**: Realistic authentication flow simulation

### 3. Admin Panel
- **User Management**: View and manage user accounts
- **Merchant Management**: API key management and monitoring
- **Subscription Management**: Pricing tiers and user subscriptions
- **Vendor Management**: Stripe API configuration
- **KYC Management**: Identity verification oversight

### 4. Authentication
- **User Auth**: Replit Auth with OpenID Connect
- **Admin Auth**: Separate admin authentication system
- **Session Management**: PostgreSQL-based session storage

## Database Schema

### Core Tables
- `users` - User accounts and profiles
- `funding_sources` - User payment methods
- `virtual_cards` - Generated bcards
- `transactions` - Payment records
- `merchants` - Merchant API accounts

### Admin Tables
- `subscription_tiers` - Pricing plans configuration
- `user_subscriptions` - User subscription records
- `kyc_verifications` - Identity verification records
- `payment_vendors` - Stripe configuration

### System Tables
- `sessions` - Authentication sessions
- `merchant_api_usage` - API usage tracking
- `webhook_events` - Webhook event logs
- `payment_intents` - Stripe payment intents

## API Structure

### Public APIs (`/api/`)
- `/auth/*` - Authentication endpoints
- `/payment/*` - Payment processing
- `/merchants/*` - Merchant API endpoints

### Admin APIs (`/api/admin/`)
- `/users` - User management
- `/merchants` - Merchant oversight
- `/subscription-*` - Subscription management
- `/payment-vendors` - Vendor configuration
- `/kyc/*` - KYC management

## Security

### Authentication
- JWT tokens for admin authentication
- Replit Auth for user authentication
- Session-based authentication for web interface

### Authorization
- Role-based access control (user, merchant, admin)
- API key authentication for merchant endpoints
- Rate limiting on public endpoints

### Data Protection
- Encrypted sensitive data storage
- Secure credential management
- CORS protection for merchant domains

## Deployment

### Environment Configuration
- **Development**: Local PostgreSQL + Stripe test keys
- **Production**: Neon PostgreSQL + Stripe live keys
- **Environment Variables**: Managed through Replit Secrets

### Monitoring
- API usage tracking
- Error logging and monitoring
- Performance metrics collection

## Integration Points

### Stripe Integration
- **Payment Processing**: Payment Intents API
- **Card Issuing**: Virtual card generation
- **Identity**: KYC verification
- **Webhooks**: Real-time event processing

### External Services
- **Replit Auth**: User authentication
- **Neon PostgreSQL**: Database hosting
- **Replit Deployments**: Application hosting

## Development Workflow

### Local Development
1. `npm run dev` - Start development server
2. `npm run db:push` - Deploy schema changes
3. Database available via `DATABASE_URL`

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Component documentation required

### Testing Strategy
- Demo flows for user testing
- Admin panel for operational testing
- Stripe test mode for payment testing