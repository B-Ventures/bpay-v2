# bpay Production Setup Guide

## Environment Configuration

### Required Environment Variables
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...  # Production: sk_live_... | Test: sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...  # Production: pk_live_... | Test: pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Webhook signing secret

# Database
DATABASE_URL=postgresql://...  # Production PostgreSQL URL

# Authentication
SESSION_SECRET=your-secure-session-secret  # Generate with: openssl rand -base64 32
ISSUER_URL=https://replit.com/oidc  # Replit OIDC endpoint
REPL_ID=your-repl-id  # Replit application ID
REPLIT_DOMAINS=your-domain.com,your-domain.replit.app  # Comma-separated domains

# Application Mode
NODE_ENV=production  # Controls Stripe test/live mode
```

### Stripe Test Mode Setup
1. Log into Stripe Dashboard
2. Switch to "Test mode" (toggle in top-left)
3. Go to Developers → API Keys
4. Copy test keys (sk_test_... and pk_test_...)
5. Use these keys in development environment

### Stripe Live Mode Setup
1. Complete Stripe account verification
2. Submit business information
3. Enable Stripe Issuing (if not already enabled)
4. Switch to "Live mode" in dashboard
5. Copy live keys (sk_live_... and pk_live_...)
6. Use these keys in production environment

## Stripe Issuing Configuration

### Step 1: Enable Stripe Issuing
1. Navigate to Products → Issuing in Stripe Dashboard
2. Click "Get started with Issuing"
3. Complete business verification process
4. Wait for approval (1-3 business days)

### Step 2: Configure Card Program
1. In Issuing settings, configure:
   - Program name: "bpay"
   - Terms of service URL
   - Privacy policy URL
   - Card design and branding
2. Set up spending controls defaults
3. Configure webhook endpoints

### Step 3: Test Integration
```bash
# Test mode commands
npm run dev  # Starts in test mode
curl -X POST http://localhost:5000/api/bcards \
  -H "Content-Type: application/json" \
  -d '{"name": "Test bcard", "balance": "100.00"}'
```

## Database Migration

### Production Database Setup
```sql
-- Run these commands in your production database
CREATE TABLE cardholders (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    stripe_cardholder_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Update existing virtual_cards table
ALTER TABLE virtual_cards ADD COLUMN stripe_issuing_card_id VARCHAR(255);
ALTER TABLE virtual_cards ADD COLUMN physical_card_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE virtual_cards ADD COLUMN shipping_address JSONB;
ALTER TABLE virtual_cards ADD COLUMN pin_status VARCHAR(50) DEFAULT 'unset';

-- Create indexes for performance
CREATE INDEX idx_cardholders_user_id ON cardholders(user_id);
CREATE INDEX idx_cardholders_stripe_id ON cardholders(stripe_cardholder_id);
CREATE INDEX idx_virtual_cards_stripe_id ON virtual_cards(stripe_issuing_card_id);
```

### Run Migration
```bash
# Development
npm run db:push

# Production
NODE_ENV=production npm run db:push
```

## Webhook Configuration

### Step 1: Set Up Webhook Endpoint
1. In Stripe Dashboard, go to Developers → Webhooks
2. Click "Add endpoint"
3. Enter your endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `issuing.card.created`
   - `issuing.card.updated`
   - `issuing.transaction.created`
   - `issuing.authorization.request`
   - `issuing.authorization.updated`

### Step 2: Configure Webhook Secret
1. Copy the webhook signing secret from Stripe
2. Add to environment variables as `STRIPE_WEBHOOK_SECRET`

## Security Considerations

### PCI DSS Compliance
- bpay handles card data through Stripe Issuing
- Full card numbers are never stored in bpay database
- Only display last 4 digits to users
- All card operations go through Stripe APIs

### API Security
```typescript
// Rate limiting example
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### Authentication Security
- Session-based authentication with secure cookies
- HTTPS-only in production
- Secure session storage in PostgreSQL
- CSRF protection enabled

## Monitoring and Logging

### Application Monitoring
```javascript
// Add to server/index.ts
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log all API requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - ${req.ip}`);
  next();
});
```

### Stripe Event Monitoring
```javascript
// Monitor Stripe events
app.post('/api/webhooks/stripe', (req, res) => {
  const event = req.body;
  
  logger.info('Stripe webhook received', {
    type: event.type,
    id: event.id,
    object: event.data.object.id
  });
  
  // Process event...
});
```

## Performance Optimization

### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_virtual_cards_user_id ON virtual_cards(user_id);
CREATE INDEX idx_funding_sources_user_id ON funding_sources(user_id);
```

### Caching Strategy
```javascript
// Redis caching for user data
const redis = require('redis');
const client = redis.createClient();

// Cache user data
app.get('/api/auth/user', async (req, res) => {
  const userId = req.user.claims.sub;
  const cached = await client.get(`user:${userId}`);
  
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  const user = await storage.getUser(userId);
  await client.setex(`user:${userId}`, 300, JSON.stringify(user)); // 5 min cache
  res.json(user);
});
```

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Stripe Issuing enabled and configured
- [ ] Database migrations run
- [ ] Webhook endpoints configured
- [ ] SSL certificates installed
- [ ] Monitoring and logging set up

### Post-Deployment
- [ ] Test bcard creation
- [ ] Test payment processing
- [ ] Verify webhook events
- [ ] Monitor error logs
- [ ] Performance testing
- [ ] Security audit

## Testing Strategy

### Unit Tests
```javascript
// Test Stripe Issuing service
import { stripeIssuingService } from '../services/stripe-issuing';

describe('StripeIssuingService', () => {
  it('should create cardholder', async () => {
    const user = { firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
    const cardholder = await stripeIssuingService.createCardholder(user);
    expect(cardholder.id).toBeDefined();
  });
});
```

### Integration Tests
```javascript
// Test full payment flow
describe('Payment Flow', () => {
  it('should process payment with splits', async () => {
    const response = await request(app)
      .post('/api/process-payment')
      .send({
        amount: '100.00',
        merchant: 'Test Store',
        splits: [{ percentage: 100, fundingSourceId: 1 }]
      });
    
    expect(response.status).toBe(200);
    expect(response.body.transaction).toBeDefined();
  });
});
```

## Backup and Recovery

### Database Backups
```bash
# Daily backup script
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20240101.sql
```

### Disaster Recovery
1. Database restoration process
2. Environment variable recovery
3. Stripe configuration restoration
4. SSL certificate renewal
5. Monitoring system restoration

## Support and Maintenance

### Common Issues
1. **Stripe API Rate Limits**: Implement exponential backoff
2. **Webhook Failures**: Set up retry mechanisms
3. **Database Connection Issues**: Use connection pooling
4. **Card Creation Failures**: Implement proper error handling

### Maintenance Tasks
- Monthly security updates
- Quarterly performance reviews
- Annual security audits
- Regular backup testing
- Stripe account review

This production setup guide ensures a secure, scalable, and maintainable bpay deployment with proper Stripe Issuing integration.