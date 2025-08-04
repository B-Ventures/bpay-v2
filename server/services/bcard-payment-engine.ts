import Stripe from 'stripe';
import { nanoid } from 'nanoid';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
});

/**
 * bpay Payment Engine - Core split payment functionality
 * 
 * This service blends Stripe APIs within bpay's interface to create
 * split payments using virtual cards (bcards). Merchants never interact
 * with Stripe directly - they only use bpay APIs.
 */

export interface FundingSource {
  id: string;
  type: 'card' | 'bank_account';
  stripe_payment_method_id: string;
  percentage?: number;
  amount?: number;
  available_balance?: number;
  nickname: string;
}

export interface SplitConfiguration {
  funding_sources: FundingSource[];
  split_strategy: 'percentage' | 'amount' | 'smart';
  total_amount: number;
}

export interface BcardGenerationResult {
  bcard: {
    id: string;
    number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
    cardholder_name: string;
    funding_breakdown: {
      source_id: string;
      amount: number;
      stripe_charge_id: string;
    }[];
  };
  total_collected: number;
  fees: {
    bpay_fee: number;
    stripe_fees: number;
  };
}

/**
 * Core Payment Engine Class
 */
export class BcardPaymentEngine {
  
  /**
   * Validate funding sources have sufficient balance for split
   */
  async validateSplitConfiguration(config: SplitConfiguration): Promise<{
    valid: boolean;
    errors: string[];
    breakdown: { source_id: string; required_amount: number; available_balance: number }[];
  }> {
    const errors: string[] = [];
    const breakdown: { source_id: string; required_amount: number; available_balance: number }[] = [];
    
    let totalRequired = 0;
    
    for (const source of config.funding_sources) {
      let requiredAmount = 0;
      
      if (config.split_strategy === 'percentage') {
        requiredAmount = (config.total_amount * (source.percentage || 0)) / 100;
      } else if (config.split_strategy === 'amount') {
        requiredAmount = source.amount || 0;
      } else if (config.split_strategy === 'smart') {
        // Smart strategy: distribute equally unless specified
        const equalSplit = config.total_amount / config.funding_sources.length;
        requiredAmount = source.amount || source.percentage ? 
          (source.amount || (config.total_amount * (source.percentage || 0)) / 100) : 
          equalSplit;
      }
      
      totalRequired += requiredAmount;
      
      // Check if source has sufficient balance (mock validation for now)
      const availableBalance = source.available_balance || 100; // Mock balance
      
      breakdown.push({
        source_id: source.id,
        required_amount: requiredAmount,
        available_balance: availableBalance
      });
      
      if (requiredAmount > availableBalance) {
        errors.push(`Funding source ${source.nickname} has insufficient balance. Required: $${requiredAmount.toFixed(2)}, Available: $${availableBalance.toFixed(2)}`);
      }
    }
    
    // Validate total doesn't exceed required amount
    if (Math.abs(totalRequired - config.total_amount) > 0.01) {
      errors.push(`Split configuration totals $${totalRequired.toFixed(2)} but payment amount is $${config.total_amount.toFixed(2)}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      breakdown
    };
  }
  
  /**
   * Process split payment by charging multiple funding sources
   * and generating a virtual card with the collected funds
   */
  async processSplitPayment(config: SplitConfiguration, customer: {
    name: string;
    email: string;
    phone?: string;
    address?: any;
  }): Promise<BcardGenerationResult> {
    
    // Step 1: Validate configuration
    const validation = await this.validateSplitConfiguration(config);
    if (!validation.valid) {
      throw new Error(`Invalid split configuration: ${validation.errors.join(', ')}`);
    }
    
    const fundingBreakdown: { source_id: string; amount: number; stripe_charge_id: string }[] = [];
    let totalCollected = 0;
    let totalStripeFees = 0;
    
    // Step 2: Charge each funding source through Stripe
    for (const breakdown of validation.breakdown) {
      const source = config.funding_sources.find(s => s.id === breakdown.source_id)!;
      
      try {
        // Create PaymentIntent for this funding source using real Stripe APIs
        // For demo/testing: Use test payment methods with test API keys
        // For production: Use real payment methods with live API keys
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(breakdown.required_amount * 100), // Convert to cents
          currency: 'usd',
          payment_method: source.stripe_payment_method_id || (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'pm_card_visa' : source.stripe_payment_method_id),
          confirmation_method: 'manual',
          confirm: true,
          metadata: {
            bpay_source_id: source.id,
            funding_type: 'bcard_split_payment',
            customer_email: customer.email
          }
        });
        
        if (paymentIntent.status === 'succeeded') {
          fundingBreakdown.push({
            source_id: source.id,
            amount: breakdown.required_amount,
            stripe_charge_id: paymentIntent.latest_charge as string
          });
          totalCollected += breakdown.required_amount;
          
          // Estimate Stripe fees (2.9% + 30¢ for cards)
          const stripeFee = (breakdown.required_amount * 0.029) + 0.30;
          totalStripeFees += stripeFee;
        } else {
          throw new Error(`Payment failed for funding source ${source.nickname}: ${paymentIntent.status}`);
        }
        
      } catch (error: any) {
        throw new Error(`Failed to charge funding source ${source.nickname}: ${error.message}`);
      }
    }
    
    // Step 3: Create Stripe cardholder and virtual card with collected funds
    // Use real Stripe Issuing APIs for both test and live modes
    const cardholder = await stripe.issuing.cardholders.create({
      name: customer.name,
      email: customer.email,
      phone_number: customer.phone,
      billing: customer.address ? {
        address: customer.address
      } : undefined,
      type: 'individual'
    });
    
    const virtualCard = await stripe.issuing.cards.create({
      cardholder: cardholder.id,
      currency: 'usd',
      type: 'virtual',
      spending_controls: {
        spending_limits: [{
          amount: Math.round(totalCollected * 100), // Set spending limit to collected amount
          interval: 'per_authorization'
        }]
      },
      metadata: {
        bpay_payment_type: 'split_payment',
        total_funded_amount: totalCollected.toString(),
        customer_email: customer.email
      }
    });
    
    // Step 4: Retrieve card details securely
    const cardDetails = await stripe.issuing.cards.retrieve(virtualCard.id, {
      expand: ['number', 'cvc']
    });
    
    // Calculate bpay fees (2.9% of total)
    const bpayFee = totalCollected * 0.029;
    
    return {
      bcard: {
        id: virtualCard.id,
        number: (cardDetails as any).number,
        exp_month: cardDetails.exp_month,
        exp_year: cardDetails.exp_year,
        cvc: (cardDetails as any).cvc,
        cardholder_name: customer.name,
        funding_breakdown: fundingBreakdown
      },
      total_collected: totalCollected,
      fees: {
        bpay_fee: bpayFee,
        stripe_fees: totalStripeFees
      }
    };
  }
  
  /**
   * Retrieve bcard details for merchant checkout
   */
  async getBcardDetails(bcardId: string): Promise<{
    number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
    available_balance: number;
  }> {
    try {
      const card = await stripe.issuing.cards.retrieve(bcardId, {
        expand: ['number', 'cvc']
      });
      
      // Get card balance from Stripe
      const balance = await stripe.issuing.cards.retrieve(bcardId);
      const availableBalance = balance.spending_controls?.spending_limits?.[0]?.amount || 0;
      
      return {
        number: (card as any).number,
        exp_month: card.exp_month,
        exp_year: card.exp_year,
        cvc: (card as any).cvc,
        available_balance: availableBalance / 100 // Convert from cents
      };
    } catch (error: any) {
      throw new Error(`Failed to retrieve bcard details: ${error.message}`);
    }
  }
  
  /**
   * Freeze/unfreeze bcard
   */
  async updateBcardStatus(bcardId: string, status: 'active' | 'inactive'): Promise<void> {
    try {
      await stripe.issuing.cards.update(bcardId, {
        status: status
      });
    } catch (error: any) {
      throw new Error(`Failed to update bcard status: ${error.message}`);
    }
  }
}

export const bcardPaymentEngine = new BcardPaymentEngine();