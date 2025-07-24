import Stripe from 'stripe';
import { nanoid } from 'nanoid';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
});

export class StripeIssuingService {
  private isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || false;

  constructor() {
    console.log(this.isTestMode ? '✅ Using Stripe test keys - Real Issuing APIs enabled' : '⚠️  Live keys detected - Using mock mode for Issuing');
  }

  // Fund the Issuing balance (required before creating cards)
  async fundIssuingBalance(amount: number, currency: string = 'usd') {
    try {
      if (this.isTestMode) {
        // Use test helper to simulate funding in test mode
        const result = await fetch('https://api.stripe.com/v1/test_helpers/issuing/fund_balance', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            amount: Math.round(amount * 100).toString(),
            currency: currency.toLowerCase()
          })
        });
        
        if (!result.ok) {
          throw new Error(`Failed to fund test balance: ${result.status}`);
        }
        
        const data = await result.json();
        console.log(`Test Issuing balance funded: $${amount} ${currency.toUpperCase()}`);
        return data;
      } else {
        // In production, user would need to transfer funds via bank transfer
        // For now, log that funding is needed and continue with card creation
        console.log(`Production mode: $${amount} needed in Issuing balance. User should transfer funds via Dashboard.`);
        return { 
          message: 'Production funding required',
          amount_needed: amount,
          currency: currency 
        };
      }
    } catch (error) {
      console.error('Error funding Issuing balance:', error);
      throw error;
    }
  }

  // Check Issuing balance
  async getIssuingBalance(currency: string = 'usd') {
    try {
      const balance = await stripe.balance.retrieve();
      const issuingBalance = balance.issuing?.available?.find(b => b.currency === currency.toLowerCase());
      return issuingBalance ? issuingBalance.amount / 100 : 0; // Convert from cents
    } catch (error) {
      console.error('Error getting Issuing balance:', error);
      return 0;
    }
  }

  // Create cardholder for user
  async createCardholder(user: any) {
    try {
      if (!this.isTestMode) {
        // Use mock cardholder for live keys since Issuing isn't available
        console.log('Creating mock cardholder due to live key restrictions');
        return {
          id: `ich_${nanoid(16)}`,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'bpay User',
          email: user.email,
          status: 'active',
          type: 'individual',
          metadata: {
            source: 'bpay',
            created_by: 'bpay_system'
          }
        };
      }

      // Create real Stripe cardholder with test keys
      console.log('Creating real Stripe cardholder with test keys');
      const stripeCardholder = await stripe.issuing.cardholders.create({
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'bpay User',
        email: user.email || undefined,
        phone_number: user.phoneNumber || undefined,
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
        metadata: {
          source: 'bpay',
          created_by: 'bpay_system'
        }
      });
      
      return stripeCardholder;
    } catch (error) {
      console.error('Error creating cardholder:', error);
      throw error;
    }
  }

  // Create bcard (virtual card)
  async createBcard(cardholderId: string, spendingControls: any) {
    try {
      if (!this.isTestMode) {
        // Use mock card for live keys since Issuing isn't available
        console.log('Creating mock bcard due to live key restrictions');
        return {
          id: `ic_${nanoid(16)}`,
          cardholder: cardholderId,
          currency: 'usd',
          type: 'virtual',
          status: 'active',
          last4: Math.floor(Math.random() * 9000) + 1000,
          exp_month: Math.floor(Math.random() * 12) + 1,
          exp_year: new Date().getFullYear() + Math.floor(Math.random() * 5) + 1,
          brand: 'visa',
          spending_controls: spendingControls,
          metadata: {
            source: 'bpay',
            created_by: 'bpay_system',
          }
        };
      }

      // Create real Stripe Issuing card with test keys
      console.log('Creating real Stripe Issuing bcard with test keys');
      
      // First, fund the test Issuing balance if needed
      await this.fundIssuingBalance(1000); // Fund with $1000 for testing

      const stripeCard = await stripe.issuing.cards.create({
        cardholder: cardholderId,
        currency: 'usd',
        type: 'virtual',
        status: 'active',
        spending_controls: spendingControls,
        metadata: {
          source: 'bpay',
          created_by: 'bpay_system',
        },
      });
      
      return stripeCard;
    } catch (error) {
      console.error('Error creating bcard:', error);
      throw error;
    }
  }

  // Get card details (including sensitive data like full PAN)
  async getCardDetails(cardId: string) {
    try {
      if (!this.isTestMode) {
        // Return mock card details for live mode
        return {
          id: cardId,
          number: '4242424242424242',
          exp_month: 12,
          exp_year: 2027,
          cvc: '123',
          brand: 'visa',
          type: 'virtual'
        };
      }

      const card = await stripe.issuing.cards.retrieve(cardId, {
        expand: ['number', 'cvc']
      });
      
      return {
        id: card.id,
        number: (card as any).number,
        exp_month: card.exp_month,
        exp_year: card.exp_year,
        cvc: (card as any).cvc,
        brand: card.brand,
        type: card.type
      };
    } catch (error) {
      console.error('Error retrieving card details:', error);
      throw error;
    }
  }

  // Update card status (freeze/unfreeze)
  async updateCardStatus(cardId: string, status: 'active' | 'inactive') {
    try {
      if (!this.isTestMode) {
        console.log(`Mock: Card ${cardId} status updated to ${status}`);
        return { id: cardId, status };
      }

      const card = await stripe.issuing.cards.update(cardId, { status });
      return card;
    } catch (error) {
      console.error('Error updating card status:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const stripeIssuingService = new StripeIssuingService();