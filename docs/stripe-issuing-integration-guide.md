# Stripe Issuing Integration Guide for bpay

## Overview
This guide covers how to integrate Stripe Issuing with bpay to enable bcard (virtual card) generation for users. The integration allows customers to benefit from payment splitting and checkout with their personalized bcard.

## Prerequisites
- Active Stripe account with Issuing enabled
- bpay application running with authentication
- Stripe API keys configured in environment variables

## Step 1: Enable Stripe Issuing in Your Account

### 1.1 Request Issuing Access
1. Log into your Stripe Dashboard
2. Navigate to **Products** → **Issuing**
3. Click **Get Started** and follow the onboarding process
4. Complete the required business verification
5. Wait for approval (typically 1-3 business days)

### 1.2 Configure Issuing Settings
1. In the Issuing section, go to **Settings**
2. Configure your issuing program details:
   - Program name: "bpay"
   - Cardholder terms of service
   - Card design and branding
3. Set up webhook endpoints for card events

## Step 2: Set Up Test/Sandbox Environment

### 2.1 Test Mode Configuration
```bash
# Add to your .env file
STRIPE_SECRET_KEY=sk_test_...  # Test secret key
VITE_STRIPE_PUBLIC_KEY=pk_test_...  # Test publishable key
STRIPE_WEBHOOK_SECRET=whsec_test_...  # Test webhook secret
NODE_ENV=development
```

### 2.2 Test Card Program
1. In test mode, create a test card program
2. Use test cardholders and funding sources
3. Test card creation and spending controls

## Step 3: Update bpay Database Schema

### 3.1 Add Issuing-Related Fields
```sql
-- Add to users table
ALTER TABLE users ADD COLUMN stripe_issuing_account_id VARCHAR(255);

-- Add to virtual_cards table (rename to bcards)
ALTER TABLE virtual_cards ADD COLUMN stripe_issuing_card_id VARCHAR(255);
ALTER TABLE virtual_cards ADD COLUMN physical_card_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE virtual_cards ADD COLUMN shipping_address JSONB;
ALTER TABLE virtual_cards ADD COLUMN pin_status VARCHAR(50) DEFAULT 'unset';

-- Add cardholders table
CREATE TABLE cardholders (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    stripe_cardholder_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 3.2 Update Schema File
```typescript
// shared/schema.ts
export const cardholders = pgTable("cardholders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  stripeCardholderId: varchar("stripe_cardholder_id").notNull().unique(),
  status: varchar("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Update virtual_cards table
export const virtualCards = pgTable("virtual_cards", {
  // ... existing fields
  stripeIssuingCardId: varchar("stripe_issuing_card_id"),
  physicalCardRequested: boolean("physical_card_requested").default(false),
  shippingAddress: jsonb("shipping_address"),
  pinStatus: varchar("pin_status").default("unset"),
});
```

## Step 4: Implement Stripe Issuing Service

### 4.1 Create Issuing Service
```typescript
// server/services/stripe-issuing.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export class StripeIssuingService {
  // Create cardholder
  async createCardholder(user: User) {
    const cardholder = await stripe.issuing.cardholders.create({
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone_number: user.phoneNumber,
      status: 'active',
      type: 'individual',
      billing: {
        address: {
          line1: user.address?.line1 || '123 Main St',
          city: user.address?.city || 'San Francisco',
          state: user.address?.state || 'CA',
          postal_code: user.address?.postal_code || '94102',
          country: 'US',
        },
      },
    });
    
    return cardholder;
  }

  // Create bcard (virtual card)
  async createBcard(cardholderId: string, spending_controls: any) {
    const card = await stripe.issuing.cards.create({
      cardholder: cardholderId,
      currency: 'usd',
      type: 'virtual',
      status: 'active',
      spending_controls,
      metadata: {
        source: 'bpay',
        created_by: 'bpay_system',
      },
    });
    
    return card;
  }

  // Update spending controls
  async updateSpendingControls(cardId: string, spending_controls: any) {
    const card = await stripe.issuing.cards.update(cardId, {
      spending_controls,
    });
    
    return card;
  }

  // Freeze/unfreeze card
  async updateCardStatus(cardId: string, status: 'active' | 'inactive') {
    const card = await stripe.issuing.cards.update(cardId, {
      status,
    });
    
    return card;
  }

  // Get card details (for display)
  async getCardDetails(cardId: string) {
    const card = await stripe.issuing.cards.retrieve(cardId);
    return {
      id: card.id,
      last4: card.last4,
      exp_month: card.exp_month,
      exp_year: card.exp_year,
      brand: card.brand,
      status: card.status,
      spending_controls: card.spending_controls,
    };
  }

  // Get sensitive card details (for transactions)
  async getFullCardDetails(cardId: string) {
    const card = await stripe.issuing.cards.retrieve(cardId, {
      expand: ['number', 'cvc'],
    });
    
    return {
      number: card.number,
      cvc: card.cvc,
      exp_month: card.exp_month,
      exp_year: card.exp_year,
    };
  }
}
```

### 4.2 Update Storage Interface
```typescript
// server/storage.ts
export interface IStorage {
  // Existing methods...
  
  // Cardholder methods
  createCardholder(data: any): Promise<any>;
  getCardholderByUserId(userId: string): Promise<any>;
  updateCardholder(id: number, data: any): Promise<any>;
  
  // Update bcard methods
  createBcard(data: any): Promise<any>;
  getBcardsByUserId(userId: string): Promise<any[]>;
  updateBcard(id: number, data: any): Promise<any>;
  getBcardById(id: number): Promise<any>;
}
```

## Step 5: Update API Endpoints

### 5.1 Create Bcard Endpoint
```typescript
// server/routes.ts
import { StripeIssuingService } from './services/stripe-issuing';

const issuingService = new StripeIssuingService();

app.post('/api/bcards', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get or create cardholder
    let cardholder = await storage.getCardholderByUserId(userId);
    if (!cardholder) {
      const stripeCardholder = await issuingService.createCardholder(user);
      cardholder = await storage.createCardholder({
        userId,
        stripeCardholderId: stripeCardholder.id,
        status: 'active',
      });
    }

    // Create spending controls based on user preferences
    const spending_controls = {
      spending_limits: [
        {
          amount: Math.round(parseFloat(req.body.balance) * 100),
          interval: 'all_time',
        },
      ],
      allowed_categories: req.body.allowed_categories || [],
      blocked_categories: req.body.blocked_categories || [],
    };

    // Create bcard with Stripe Issuing
    const stripeCard = await issuingService.createBcard(
      cardholder.stripeCardholderId,
      spending_controls
    );

    // Save to database
    const bcard = await storage.createBcard({
      userId,
      name: req.body.name || 'bpay Card',
      balance: req.body.balance,
      stripeIssuingCardId: stripeCard.id,
      status: 'active',
      merchantRestrictions: req.body.merchantRestrictions || '',
    });

    res.json(bcard);
  } catch (error) {
    console.error("Error creating bcard:", error);
    res.status(500).json({ message: "Failed to create bcard" });
  }
});
```

### 5.2 Update Payment Processing
```typescript
// Update payment processing to use real Stripe Issuing
app.post('/api/process-payment', isAuthenticated, async (req: any, res) => {
  try {
    const { amount, merchant, bcardId, splits } = req.body;
    const userId = req.user.claims.sub;
    
    // Get bcard details
    const bcard = await storage.getBcardById(bcardId);
    if (!bcard) {
      return res.status(404).json({ message: "bcard not found" });
    }

    // Process payment splits through funding sources
    const totalAmount = parseFloat(amount);
    const feePercentage = 0.029;
    const totalFees = totalAmount * feePercentage;
    const totalWithFees = totalAmount + totalFees;

    // Create payment intents for each funding source
    const paymentIntents = [];
    for (const split of splits) {
      const splitAmount = (totalWithFees * split.percentage) / 100;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(splitAmount * 100),
        currency: 'usd',
        customer: user.stripeCustomerId,
        payment_method: split.stripePaymentMethodId,
        confirm: true,
        return_url: `${req.protocol}://${req.get('host')}/payment-success`,
      });

      paymentIntents.push({
        id: paymentIntent.id,
        amount: splitAmount,
        status: paymentIntent.status,
        fundingSourceId: split.fundingSourceId,
      });
    }

    // Load funds onto bcard
    const currentBalance = parseFloat(bcard.balance);
    const newBalance = currentBalance + totalAmount;
    
    await storage.updateBcard(bcardId, {
      balance: newBalance.toFixed(2),
    });

    // Create transaction record
    const transaction = await storage.createTransaction({
      userId,
      bcardId,
      merchant,
      amount: totalAmount.toFixed(2),
      splits: JSON.stringify(splits),
      status: 'completed',
      fees: totalFees.toFixed(2),
    });

    res.json({
      transaction,
      paymentIntents,
      bcard: { ...bcard, balance: newBalance.toFixed(2) },
      totalAmount,
      totalFees,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ message: "Failed to process payment" });
  }
});
```

## Step 6: Update Frontend Components

### 6.1 Update Terminology
```typescript
// Update all components to use "bcard" instead of "virtual card"
// client/src/components/dashboard/overview.tsx
<CardTitle>Active bcards</CardTitle>
<span className="font-medium">Create bcard</span>

// client/src/components/bcard/bcard-list.tsx
export default function BcardList() {
  const { data: bcards = [] } = useQuery({
    queryKey: ["/api/bcards"],
    enabled: !!user,
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your bcards</h2>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create bcard
        </Button>
      </div>
      {/* bcard list */}
    </div>
  );
}
```

### 6.2 Create Bcard Management Component
```typescript
// client/src/components/bcard/bcard-manager.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Lock, Unlock, Settings } from 'lucide-react';

export default function BcardManager({ bcard }: { bcard: any }) {
  const [isLocked, setIsLocked] = useState(bcard.status === 'inactive');

  const toggleCardStatus = async () => {
    try {
      const newStatus = isLocked ? 'active' : 'inactive';
      await apiRequest('PUT', `/api/bcards/${bcard.id}`, { status: newStatus });
      setIsLocked(!isLocked);
    } catch (error) {
      console.error('Failed to update card status:', error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            {bcard.name}
          </CardTitle>
          <Badge variant={isLocked ? "destructive" : "default"}>
            {isLocked ? "Locked" : "Active"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Balance</span>
            <span className="font-semibold">${bcard.balance}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Card Number</span>
            <span className="font-mono">•••• {bcard.last4}</span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={isLocked ? "default" : "outline"}
              size="sm"
              onClick={toggleCardStatus}
            >
              {isLocked ? <Unlock className="h-4 w-4 mr-1" /> : <Lock className="h-4 w-4 mr-1" />}
              {isLocked ? "Unlock" : "Lock"}
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

## Step 7: Implement Webhooks

### 7.1 Set Up Webhook Endpoint
```typescript
// server/webhooks.ts
import { Request, Response } from 'express';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature']!;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  // Handle the event
  switch (event.type) {
    case 'issuing.card.created':
      await handleCardCreated(event.data.object);
      break;
    case 'issuing.transaction.created':
      await handleTransactionCreated(event.data.object);
      break;
    case 'issuing.authorization.request':
      await handleAuthorizationRequest(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

async function handleCardCreated(card: any) {
  // Update local database with card status
  console.log('Card created:', card.id);
}

async function handleTransactionCreated(transaction: any) {
  // Record transaction in local database
  console.log('Transaction created:', transaction.id);
}

async function handleAuthorizationRequest(authorization: any) {
  // Handle real-time authorization decisions
  console.log('Authorization request:', authorization.id);
}
```

### 7.2 Add Webhook Route
```typescript
// server/routes.ts
import { handleStripeWebhook } from './webhooks';

app.post('/api/webhooks/stripe', 
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);
```

## Step 8: Testing and Deployment

### 8.1 Test Mode Validation
1. Create test bcards with various spending limits
2. Test payment processing with test funding sources
3. Verify webhook events are received and processed
4. Test card locking/unlocking functionality

### 8.2 Production Deployment
1. Switch to live API keys
2. Update webhook endpoints with production URLs
3. Configure production spending controls and limits
4. Set up monitoring and alerting

### 8.3 Environment Configuration
```bash
# Production .env
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
NODE_ENV=production
```

## Step 9: Alternative Card Issuing Services

### 9.1 Marqeta Integration
If you prefer Marqeta over Stripe Issuing:

```typescript
// server/services/marqeta-issuing.ts
import axios from 'axios';

export class MarqetaIssuingService {
  private baseURL = process.env.MARQETA_BASE_URL || 'https://sandbox-api.marqeta.com/v3';
  private headers = {
    'Authorization': `Basic ${Buffer.from(`${process.env.MARQETA_USERNAME}:${process.env.MARQETA_PASSWORD}`).toString('base64')}`,
    'Content-Type': 'application/json',
  };

  async createUser(userData: any) {
    const response = await axios.post(`${this.baseURL}/users`, userData, { headers: this.headers });
    return response.data;
  }

  async createCard(cardData: any) {
    const response = await axios.post(`${this.baseURL}/cards`, cardData, { headers: this.headers });
    return response.data;
  }
}
```

### 9.2 Privacy.com Integration
For Privacy.com integration:

```typescript
// server/services/privacy-issuing.ts
export class PrivacyIssuingService {
  private baseURL = 'https://api.privacy.com';
  private headers = {
    'Authorization': `Bearer ${process.env.PRIVACY_API_KEY}`,
    'Content-Type': 'application/json',
  };

  async createCard(cardData: any) {
    const response = await axios.post(`${this.baseURL}/v1/cards`, cardData, { headers: this.headers });
    return response.data;
  }
}
```

## Step 10: Admin Dashboard Configuration

### 10.1 Admin Panel Features
- View all user bcards
- Monitor transaction volumes
- Set global spending limits
- Manage fraud alerts
- Configure card programs

### 10.2 Customer Service Interface
- Search bcards by user
- View transaction history
- Temporarily lock/unlock cards
- Handle dispute cases
- Generate reports

## Security Considerations

1. **PCI Compliance**: Ensure your application meets PCI DSS requirements
2. **API Security**: Use proper authentication and rate limiting
3. **Data Encryption**: Encrypt sensitive card data at rest
4. **Webhook Security**: Validate webhook signatures
5. **Access Controls**: Implement proper role-based access

## Monitoring and Analytics

1. **Transaction Monitoring**: Track spending patterns
2. **Fraud Detection**: Implement real-time fraud checks
3. **Performance Metrics**: Monitor API response times
4. **Usage Analytics**: Track bcard creation and usage
5. **Financial Reporting**: Generate transaction reports

This comprehensive guide provides the foundation for integrating Stripe Issuing or alternative card issuing services with bpay, enabling users to benefit from payment splitting and checkout with their personalized bcards.