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
      if (this.isTestMode) {
        // Return mock cardholder for development
        return {
          id: `ich_${nanoid(16)}`,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email,
          status: 'active',
          type: 'individual',
        };
      }

      const cardholder = await stripe.issuing.cardholders.create({
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
      });
      
      return cardholder;
    } catch (error) {
      console.error('Error creating cardholder:', error);
      throw error;
    }
  }

  // Create bcard (virtual card)
  async createBcard(cardholderId: string, spendingControls: any) {
    try {
      if (this.isTestMode) {
        // Return mock card for development
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
        };
      }

      const card = await stripe.issuing.cards.create({
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
      
      return card;
    } catch (error) {
      console.error('Error creating bcard:', error);
      throw error;
    }
  }

  // Update spending controls
  async updateSpendingControls(cardId: string, spendingControls: any) {
    try {
      if (this.isTestMode) {
        return {
          id: cardId,
          spending_controls: spendingControls,
        };
      }

      const card = await stripe.issuing.cards.update(cardId, {
        spending_controls: spendingControls,
      });
      
      return card;
    } catch (error) {
      console.error('Error updating spending controls:', error);
      throw error;
    }
  }

  // Freeze/unfreeze card
  async updateCardStatus(cardId: string, status: 'active' | 'inactive') {
    try {
      if (this.isTestMode) {
        return {
          id: cardId,
          status: status,
        };
      }

      const card = await stripe.issuing.cards.update(cardId, {
        status,
      });
      
      return card;
    } catch (error) {
      console.error('Error updating card status:', error);
      throw error;
    }
  }

  // Get card details (for display)
  async getCardDetails(cardId: string) {
    try {
      if (this.isTestMode) {
        return {
          id: cardId,
          last4: '1234',
          exp_month: 12,
          exp_year: 2025,
          brand: 'visa',
          status: 'active',
          spending_controls: {
            spending_limits: [],
            allowed_categories: [],
            blocked_categories: [],
          },
        };
      }

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
    } catch (error) {
      console.error('Error fetching card details:', error);
      throw error;
    }
  }

  // Get sensitive card details (for transactions)
  async getFullCardDetails(cardId: string) {
    try {
      if (this.isTestMode) {
        return {
          number: '4242424242424242',
          cvc: '123',
          exp_month: 12,
          exp_year: 2025,
        };
      }

      const card = await stripe.issuing.cards.retrieve(cardId, {
        expand: ['number', 'cvc'],
      });
      
      return {
        number: card.number,
        cvc: card.cvc,
        exp_month: card.exp_month,
        exp_year: card.exp_year,
      };
    } catch (error) {
      console.error('Error fetching full card details:', error);
      throw error;
    }
  }

  // Create authorization for spending
  async createAuthorization(cardId: string, amount: number, merchant: string) {
    try {
      if (this.isTestMode) {
        return {
          id: `iauth_${nanoid(16)}`,
          card: cardId,
          amount: amount * 100,
          currency: 'usd',
          merchant_data: {
            name: merchant,
          },
          approved: true,
          status: 'pending',
        };
      }

      // In production, this would be handled by Stripe's real-time authorization
      // This is just for reference - actual authorizations happen automatically
      return {
        id: `iauth_${nanoid(16)}`,
        card: cardId,
        amount: amount * 100,
        currency: 'usd',
        merchant_data: {
          name: merchant,
        },
        approved: true,
        status: 'pending',
      };
    } catch (error) {
      console.error('Error creating authorization:', error);
      throw error;
    }
  }

  // Get transaction history
  async getTransactions(cardId: string) {
    try {
      if (this.isTestMode) {
        return [];
      }

      const transactions = await stripe.issuing.transactions.list({
        card: cardId,
        limit: 50,
      });
      
      return transactions.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }
}

export const stripeIssuingService = new StripeIssuingService();