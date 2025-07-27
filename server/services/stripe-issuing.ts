import Stripe from "stripe";

interface BcardCreationRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  address?: any; // JSON address object
}

interface SpendingControls {
  spending_limits?: Array<{
    amount: number;
    interval: 'per_authorization' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time';
  }>;
  allowed_categories?: string[];
  blocked_categories?: string[];
  spending_limits_currency?: string;
}

class StripeIssuingService {
  private stripe: Stripe;
  private isTestMode: boolean;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error('Missing Stripe secret key. Please provide STRIPE_SECRET_KEY or STRIPE_TEST_SECRET_KEY');
    }

    this.isTestMode = secretKey.startsWith('sk_test_');
    this.stripe = new Stripe(secretKey, {
      apiVersion: "2025-06-30.basil",
    });

    console.log(`🔑 Stripe Issuing initialized in ${this.isTestMode ? 'TEST' : 'LIVE'} mode`);
  }

  async createCardholder(request: BcardCreationRequest): Promise<any> {
    if (this.isTestMode) {
      // Use Stripe Issuing test mode for real card creation
      const cardholderData: any = {
        name: `${request.firstName || ''} ${request.lastName || ''}`.trim() || 'Test User',
        email: request.email,
        phone_number: request.phoneNumber,
        type: 'individual',
        billing: {
          address: request.address || {
            line1: '123 Main St',
            city: 'San Francisco', 
            state: 'CA',
            postal_code: '94102',
            country: 'US'
          }
        }
      };

      const cardholder = await this.stripe.issuing.cardholders.create(cardholderData);
      console.log(`✓ Created test cardholder: ${cardholder.id}`);
      return cardholder;
    } else {
      // Production mode - create real cardholder with live keys
      const cardholderData: any = {
        name: `${request.firstName || ''} ${request.lastName || ''}`.trim(),
        email: request.email,
        phone_number: request.phoneNumber,
        type: 'individual',
        billing: {
          address: request.address || {
            line1: '123 Main St',
            city: 'San Francisco',
            state: 'CA', 
            postal_code: '94102',
            country: 'US'
          }
        }
      };

      const cardholder = await this.stripe.issuing.cardholders.create(cardholderData);
      console.log(`✓ Created live cardholder: ${cardholder.id}`);
      return cardholder;
    }
  }

  async createBcard(cardholderId: string, spendingControls: SpendingControls): Promise<any> {
    try {
      const cardData: any = {
        cardholder: cardholderId,
        currency: 'usd',
        type: 'virtual',
        spending_controls: spendingControls
      };

      const card = await this.stripe.issuing.cards.create(cardData);
      
      if (this.isTestMode) {
        console.log(`✓ Created test virtual card: ${card.id} (last4: ${card.last4})`);
      } else {
        console.log(`✓ Created live virtual card: ${card.id} (last4: ${card.last4})`);
      }
      
      return card;
    } catch (error: any) {
      console.error('Stripe Issuing card creation failed:', error.message);
      throw new Error(`Failed to create virtual card: ${error.message}`);
    }
  }

  async getCardDetails(cardId: string): Promise<any> {
    try {
      const card = await this.stripe.issuing.cards.retrieve(cardId);
      return {
        id: card.id,
        last4: card.last4,
        brand: card.brand,
        exp_month: card.exp_month,
        exp_year: card.exp_year,
        status: card.status,
        spending_controls: card.spending_controls,
        cardholder: card.cardholder
      };
    } catch (error: any) {
      console.error('Failed to get card details:', error.message);
      throw new Error(`Failed to retrieve card details: ${error.message}`);
    }
  }

  async getFullCardDetails(cardId: string): Promise<any> {
    try {
      // Retrieve sensitive card details for checkout
      const card = await this.stripe.issuing.cards.retrieve(cardId, {
        expand: ['number', 'cvc']
      });
      
      return {
        number: (card as any).number,
        exp_month: card.exp_month,
        exp_year: card.exp_year,
        cvc: (card as any).cvc
      };
    } catch (error: any) {
      console.error('Failed to get full card details:', error.message);
      throw new Error(`Failed to retrieve sensitive card details: ${error.message}`);
    }
  }

  async updateCardStatus(cardId: string, status: 'active' | 'inactive'): Promise<any> {
    try {
      const card = await this.stripe.issuing.cards.update(cardId, {
        status: status
      });
      
      console.log(`✓ Updated card ${cardId} status to ${status}`);
      return card;
    } catch (error: any) {
      console.error('Failed to update card status:', error.message);
      throw new Error(`Failed to update card status: ${error.message}`);
    }
  }

  async getIssuingBalance(): Promise<number> {
    try {
      if (this.isTestMode) {
        // For test mode, return a mock balance
        return 1000; // $1000 test balance
      } else {
        // For live mode, get actual Issuing balance
        const balance = await this.stripe.balance.retrieve({
          expand: ['available']
        });
        
        // Return Issuing available balance in dollars
        const issuingBalance = balance.available?.find(b => (b.source_types as any)?.issuing);
        return (issuingBalance?.amount || 0) / 100;
      }
    } catch (error: any) {
      console.error('Failed to get Issuing balance:', error.message);
      return 0;
    }
  }

  async fundIssuingBalance(amount: number): Promise<void> {
    try {
      if (this.isTestMode) {
        console.log(`✓ Mock funding Issuing balance with $${amount} (test mode)`);
        return;
      } else {
        // In live mode, you would transfer funds to Issuing balance
        // This typically involves moving funds from Connect account to Issuing
        console.log(`⚠️ Live mode: Funding Issuing balance requires manual setup`);
        console.log(`   Required amount: $${amount}`);
        console.log(`   This should be implemented based on your funding strategy`);
      }
    } catch (error: any) {
      console.error('Failed to fund Issuing balance:', error.message);
      throw new Error(`Failed to fund Issuing balance: ${error.message}`);
    }
  }

  getMode(): 'test' | 'live' {
    return this.isTestMode ? 'test' : 'live';
  }
}

export const stripeIssuingService = new StripeIssuingService();