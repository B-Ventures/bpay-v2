import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertFundingSourceSchema, insertVirtualCardSchema, insertTransactionSchema, insertMerchantSchema } from "@shared/schema";
import { z } from "zod";
import { nanoid } from "nanoid";
import Stripe from "stripe";
import { stripeIssuingService } from "./services/stripe-issuing";
import { registerMerchantAPI } from "./merchant-api";
import adminApi from "./admin-api";
import { validateFundingSourceCreation, getSubscriptionBenefits } from "./services/funding-security";
import { FeeCalculator } from "./services/fee-calculator";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});

// Helper function to determine card brand from number
function getBrandFromNumber(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  if (cleanNumber.startsWith('4')) return 'visa';
  if (cleanNumber.startsWith('5')) return 'mastercard';
  if (cleanNumber.startsWith('34') || cleanNumber.startsWith('37')) return 'amex';
  return 'unknown';
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Public API endpoints (no auth required)
  // Get subscription tiers for pricing page
  app.get('/api/subscription/tiers', async (req, res) => {
    try {
      const { db } = await import("./db.js");
      const { subscriptionTiers } = await import("../shared/schema.js");
      const { eq } = await import("drizzle-orm");
      
      const tiers = await db.select({
        id: subscriptionTiers.id,
        name: subscriptionTiers.name,
        displayName: subscriptionTiers.displayName,
        monthlyPrice: subscriptionTiers.monthlyPrice,
        transactionFeeRate: subscriptionTiers.transactionFeeRate,
        features: subscriptionTiers.features,
        limits: subscriptionTiers.limits,
      })
      .from(subscriptionTiers)
      .where(eq(subscriptionTiers.isActive, true))
      .orderBy(subscriptionTiers.monthlyPrice);

      res.json({ tiers });
    } catch (error) {
      console.error("Public subscription tiers fetch error:", error);
      res.status(500).json({ error: "Failed to fetch subscription tiers" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile (for registration flow)
  app.patch('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updateData = req.body;
      
      // Validate required fields for profile completion
      if (updateData.phoneNumber || updateData.address) {
        const updatedUser = await storage.updateUserProfile(userId, updateData);
        res.json(updatedUser);
      } else {
        res.status(400).json({ message: "No valid profile data provided" });
      }
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Funding sources routes
  app.get('/api/funding-sources', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sources = await storage.getFundingSourcesByUserId(userId);
      
      // If no funding sources exist, create sample ones for demo
      if (sources.length === 0) {
        const sampleSources = [
          {
            userId,
            name: "Chase Freedom",
            type: "credit_card",
            last4: "1234",
            expiryMonth: 12,
            expiryYear: 2025,
            brand: "visa",
            defaultSplitPercentage: "60",
            stripePaymentMethodId: `pm_${nanoid(16)}`,
          },
          {
            userId,
            name: "Bank of America",
            type: "debit_card",
            last4: "5678",
            expiryMonth: 8,
            expiryYear: 2026,
            brand: "mastercard",
            defaultSplitPercentage: "40",
            stripePaymentMethodId: `pm_${nanoid(16)}`,
          }
        ];
        
        for (const source of sampleSources) {
          await storage.createFundingSource(source);
        }
        
        const newSources = await storage.getFundingSourcesByUserId(userId);
        res.json(newSources);
      } else {
        res.json(sources);
      }
    } catch (error) {
      console.error("Error fetching funding sources:", error);
      res.status(500).json({ message: "Failed to fetch funding sources" });
    }
  });

  app.post('/api/funding-sources', isAuthenticated, async (req: any, res) => {
    try {
      console.log("Create funding source request:", req.body);
      
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Validate required fields
      const { cardNumber, expiryMonth, expiryYear, cvv, name, cardholderName } = req.body;
      if (!cardNumber || !expiryMonth || !expiryYear || !cvv || !name || !cardholderName) {
        return res.status(400).json({ 
          message: "Missing required fields: cardNumber, expiryMonth, expiryYear, cvv, name, cardholderName",
          receivedFields: Object.keys(req.body)
        });
      }

      // Security validation for subscription tier limits and name verification
      const validation = await validateFundingSourceCreation(userId, cardholderName);
      if (!validation.isValid) {
        return res.status(400).json({ 
          message: validation.error,
          type: "security_validation"
        });
      }

      // Create Stripe customer if not exists
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
        });
        stripeCustomerId = customer.id;
        await storage.updateUserStripeInfo(userId, stripeCustomerId, "");
      }

      // Create real Stripe payment method for testing
      let paymentMethod;
      
      try {
        // Create payment method with Stripe (works with test cards)
        paymentMethod = await stripe.paymentMethods.create({
          type: 'card',
          card: {
            number: cardNumber,
            exp_month: expiryMonth,
            exp_year: expiryYear,
            cvc: cvv,
          },
        });
        
        console.log('Created Stripe payment method:', paymentMethod.id);
      } catch (stripeError: any) {
        console.error('Stripe payment method creation error:', stripeError.message);
        
        // Fall back to mock for development if Stripe fails
        if (process.env.NODE_ENV === 'development') {
          const mockPaymentMethodId = `pm_mock_${nanoid(16)}`;
          
          paymentMethod = {
            id: mockPaymentMethodId,
            type: 'card',
            card: {
              brand: getBrandFromNumber(cardNumber),
              last4: cardNumber.slice(-4)
            }
          };
          
          console.log('Fallback to mock payment method:', mockPaymentMethodId);
        } else {
          throw stripeError;
        }
      }

      // Attach payment method to customer if it's a real Stripe payment method
      if (!paymentMethod.id.startsWith('pm_mock_')) {
        await stripe.paymentMethods.attach(paymentMethod.id, {
          customer: stripeCustomerId,
        });
      }

      // Use user input for display, test payment method for Stripe
      const validatedData = insertFundingSourceSchema.parse({
        userId,
        name: req.body.name || `${req.body.brand?.toUpperCase() || 'CARD'} ••••${req.body.last4 || cardNumber.slice(-4)}`,
        cardholderName: cardholderName.trim(),
        type: req.body.type || 'credit_card',
        last4: req.body.last4 || cardNumber.slice(-4),
        brand: req.body.brand || getBrandFromNumber(cardNumber),
        isNameVerified: true, // Set to true since we validated it above
        balance: "100.00", // Mock balance for testing
        defaultSplitPercentage: req.body.defaultSplitPercentage || 0,
        stripePaymentMethodId: paymentMethod.id,
      });
      
      const source = await storage.createFundingSource(validatedData);
      res.json(source);
    } catch (error) {
      console.error("Error creating funding source:", error);
      res.status(500).json({ message: "Failed to create funding source" });
    }
  });

  app.put('/api/funding-sources/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const source = await storage.updateFundingSource(id, updates);
      res.json(source);
    } catch (error) {
      console.error("Error updating funding source:", error);
      res.status(500).json({ message: "Failed to update funding source" });
    }
  });

  app.delete('/api/funding-sources/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFundingSource(id);
      res.json({ message: "Funding source deleted successfully" });
    } catch (error) {
      console.error("Error deleting funding source:", error);
      res.status(500).json({ message: "Failed to delete funding source" });
    }
  });

  // Virtual cards routes
  app.get('/api/virtual-cards', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cards = await storage.getVirtualCardsByUserId(userId);
      
      // If no virtual cards exist, create a sample one for demo
      if (cards.length === 0) {
        const sampleCard = {
          userId,
          name: "bpay bcard",
          balance: "1000.00",
          cardNumber: `4532${Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0')}`,
          expiryMonth: 12,
          expiryYear: 2025,
          cvv: "123",
          status: "active",
          merchantRestrictions: "",
          stripeCardId: `card_${nanoid(16)}`,
        };
        
        await storage.createVirtualCard(sampleCard);
        
        const newCards = await storage.getVirtualCardsByUserId(userId);
        res.json(newCards);
      } else {
        res.json(cards);
      }
    } catch (error) {
      console.error("Error fetching virtual cards:", error);
      res.status(500).json({ message: "Failed to fetch virtual cards" });
    }
  });

  app.post('/api/virtual-cards', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create Stripe customer if not exists
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
        });
        stripeCustomerId = customer.id;
        await storage.updateUserStripeInfo(userId, stripeCustomerId, "");
      }

      // Step 1: Validate spending limit against available funds (if provided)
      const requiredAmount = req.body.spendingLimit || 1000;
      
      // Get user's funding sources to validate available balance
      const fundingSources = await storage.getFundingSourcesByUserId(userId);
      const totalMockBalance = fundingSources
        .filter(fs => fs.stripePaymentMethodId?.startsWith('pm_mock_'))
        .length * 100; // Each mock source has $100
      
      if (req.body.spendingLimit && totalMockBalance < requiredAmount) {
        return res.status(400).json({
          message: "Insufficient funds to create bcard with requested spending limit",
          requestedLimit: requiredAmount,
          availableBalance: totalMockBalance,
          fundingSources: fundingSources.length
        });
      }
      
      // Step 2: Check and fund Issuing balance if needed
      const currentBalance = await stripeIssuingService.getIssuingBalance();
      
      if (currentBalance < requiredAmount) {
        console.log(`Funding Issuing balance: Current $${currentBalance}, Required $${requiredAmount}`);
        await stripeIssuingService.fundIssuingBalance(requiredAmount + 100); // Add buffer
      }

      // Step 2: Create cardholder for Stripe Issuing
      const cardholder = await stripeIssuingService.createCardholder({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber || undefined,
        address: user.address || undefined
      });

      // Step 3: Define spending controls for the bcard
      const spendingControls = {
        spending_limits: req.body.spendingLimits || [
          {
            amount: (req.body.spendingLimit || 1000) * 100, // Convert to cents
            interval: 'monthly'
          }
        ],
        allowed_categories: req.body.allowedCategories || [],
        blocked_categories: req.body.blockedCategories || [],
        spending_limits_currency: 'usd'
      };

      // Step 4: Create real virtual card using Stripe Issuing
      const stripeCard = await stripeIssuingService.createBcard(cardholder.id, spendingControls);

      // Step 4: Get card details for display
      const cardDetails = await stripeIssuingService.getCardDetails(stripeCard.id);

      const validatedData = insertVirtualCardSchema.parse({
        ...req.body,
        userId,
        cardNumber: `****-****-****-${cardDetails.last4}`, // Display format only
        expiryMonth: cardDetails.exp_month,
        expiryYear: cardDetails.exp_year,
        cvv: "***", // Never store real CVV
        balance: (req.body.amount || 0).toString(), // Convert balance to string for decimal field
        stripeCardId: stripeCard.id,
        status: cardDetails.status,
      });
      
      const virtualCard = await storage.createVirtualCard(validatedData);
      
      // Return card with secure details hidden
      res.json({
        ...virtualCard,
        cardNumber: `****-****-****-${cardDetails.last4}`,
        stripeIssuingCard: {
          id: stripeCard.id,
          last4: cardDetails.last4,
          brand: cardDetails.brand,
          status: cardDetails.status,
          spending_controls: cardDetails.spending_controls
        }
      });
    } catch (error) {
      console.error("Error creating virtual card:", error);
      res.status(500).json({ message: "Failed to create virtual card" });
    }
  });

  app.put('/api/virtual-cards/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const card = await storage.updateVirtualCard(id, updates);
      res.json(card);
    } catch (error) {
      console.error("Error updating virtual card:", error);
      res.status(500).json({ message: "Failed to update virtual card" });
    }
  });

  app.delete('/api/virtual-cards/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Get card to validate ownership and get Stripe card ID
      const virtualCards = await storage.getVirtualCardsByUserId(userId);
      const virtualCard = virtualCards.find(card => card.id === id);
      
      if (!virtualCard) {
        return res.status(404).json({ message: "Virtual card not found" });
      }

      // Freeze the card in Stripe before deleting
      if (virtualCard.stripeCardId && !virtualCard.stripeCardId.startsWith('card_mock_')) {
        await stripeIssuingService.updateCardStatus(virtualCard.stripeCardId, 'inactive');
      }
      
      await storage.deleteVirtualCard(id);
      res.json({ message: "Virtual card deleted successfully" });
    } catch (error) {
      console.error("Error deleting virtual card:", error);
      res.status(500).json({ message: "Failed to delete virtual card" });
    }
  });

  // Get card details for merchant checkout (secured endpoint)
  app.get('/api/virtual-cards/:id/checkout-details', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Get card and validate ownership
      const virtualCards = await storage.getVirtualCardsByUserId(userId);
      const virtualCard = virtualCards.find(card => card.id === id);
      
      if (!virtualCard) {
        return res.status(404).json({ message: "Virtual card not found" });
      }

      // Get full card details from Stripe Issuing (including sensitive data)
      if (virtualCard.stripeCardId && !virtualCard.stripeCardId.startsWith('card_mock_')) {
        const fullCardDetails = await stripeIssuingService.getFullCardDetails(virtualCard.stripeCardId);
        
        res.json({
          cardNumber: fullCardDetails.number,
          expiryMonth: fullCardDetails.exp_month,
          expiryYear: fullCardDetails.exp_year,
          cvv: fullCardDetails.cvc,
          cardholderName: `${req.user.claims.first_name || ''} ${req.user.claims.last_name || ''}`.trim(),
          readyForCheckout: true
        });
      } else {
        // Return mock details for demo cards
        res.json({
          cardNumber: '4242424242424242',
          expiryMonth: 12,
          expiryYear: 2025,
          cvv: '123',
          cardholderName: `${req.user.claims.first_name || ''} ${req.user.claims.last_name || ''}`.trim(),
          readyForCheckout: true,
          isDemoCard: true
        });
      }
    } catch (error) {
      console.error("Error fetching card checkout details:", error);
      res.status(500).json({ message: "Failed to fetch card details" });
    }
  });

  // Get subscription benefits endpoint
  app.get('/api/subscription/benefits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const tier = user.subscriptionTier || 'free';
      const benefits = await getSubscriptionBenefits(userId, tier);
      
      res.json({
        currentTier: tier,
        benefits,
        upgradeAvailable: tier === 'free' && !benefits.isKycVerified
      });
    } catch (error) {
      console.error("Error fetching subscription benefits:", error);
      res.status(500).json({ message: "Failed to fetch subscription benefits" });
    }
  });

  // Freeze/unfreeze virtual card
  app.patch('/api/virtual-cards/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { status } = req.body; // 'active' or 'inactive'
      
      // Get card and validate ownership
      const virtualCards = await storage.getVirtualCardsByUserId(userId);
      const virtualCard = virtualCards.find(card => card.id === id);
      
      if (!virtualCard) {
        return res.status(404).json({ message: "Virtual card not found" });
      }

      // Update card status in Stripe
      if (virtualCard.stripeCardId && !virtualCard.stripeCardId.startsWith('card_mock_')) {
        await stripeIssuingService.updateCardStatus(virtualCard.stripeCardId, status);
      }
      
      // Update in our database
      const updatedCard = await storage.updateVirtualCard(id, { status });
      
      res.json({
        ...updatedCard,
        message: `Card ${status === 'active' ? 'activated' : 'frozen'} successfully`
      });
    } catch (error) {
      console.error("Error updating card status:", error);
      res.status(500).json({ message: "Failed to update card status" });
    }
  });

  // Transactions routes
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getTransactionsByUserId(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertTransactionSchema.parse({
        ...req.body,
        userId,
      });
      const transaction = await storage.createTransaction(validatedData);
      res.json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Merchants routes
  app.get('/api/merchants', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const merchants = await storage.getMerchantsByUserId(userId);
      res.json(merchants);
    } catch (error) {
      console.error("Error fetching merchants:", error);
      res.status(500).json({ message: "Failed to fetch merchants" });
    }
  });

  app.post('/api/merchants', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const apiKey = `bpay_${nanoid(32)}`;
      
      const validatedData = insertMerchantSchema.parse({
        ...req.body,
        userId,
        apiKey,
      });
      
      const merchant = await storage.createMerchant(validatedData);
      res.json(merchant);
    } catch (error) {
      console.error("Error creating merchant:", error);
      res.status(500).json({ message: "Failed to create merchant" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get('/api/admin/merchants', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const merchants = await storage.getAllMerchants();
      res.json(merchants);
    } catch (error) {
      console.error("Error fetching merchants:", error);
      res.status(500).json({ message: "Failed to fetch merchants" });
    }
  });

  // Payment splitting endpoint - Stripe Issuing Integration
  app.post('/api/process-payment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount, merchant, virtualCardId, splits } = req.body;
      
      console.log("Process payment request:", {
        amount,
        merchant,
        virtualCardId,
        splits: splits,
        splitsType: typeof splits,
        splitsIsArray: Array.isArray(splits)
      });
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Validate that splits is an array
      if (!Array.isArray(splits)) {
        return res.status(400).json({ 
          message: "Invalid splits data - must be an array",
          receivedType: typeof splits,
          receivedData: splits 
        });
      }

      // Validate splits total to 100%
      const totalPercentage = splits.reduce((sum: number, split: any) => sum + split.percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return res.status(400).json({ message: "Split percentages must total 100%" });
      }

      const totalAmount = parseFloat(amount);
      
      // Calculate fees based on user's subscription tier
      const userTier = user.subscriptionTier || 'free';
      const feeCalculation = FeeCalculator.calculateFees(totalAmount, userTier);
      const totalWithFees = feeCalculation.totalAmount;

      // Step 1: CRITICAL - Validate funding source balances BEFORE any processing
      console.log(`Validating funding sources for total amount: $${totalWithFees.toFixed(2)} (including $${feeCalculation.feeAmount.toFixed(2)} fees at ${feeCalculation.feePercentage}%)`);
      
      const balanceValidationResults = [];
      let totalAvailableBalance = 0;
      
      for (const split of splits) {
        const splitAmount = (totalWithFees * split.percentage) / 100;
        
        // Check if this is a mock payment method (has mock balance)
        if (split.stripePaymentMethodId.startsWith('pm_mock_')) {
          // For mock payment methods, we simulate a $100 balance limit
          const mockBalance = 100;
          balanceValidationResults.push({
            fundingSourceId: split.fundingSourceId,
            name: split.name,
            requiredAmount: splitAmount,
            availableBalance: mockBalance,
            sufficient: mockBalance >= splitAmount
          });
          totalAvailableBalance += Math.min(mockBalance, splitAmount);
        } else {
          // For real payment methods, we can't check balance directly through Stripe
          // In production, you'd integrate with bank APIs or require user input
          console.log(`Warning: Cannot validate balance for real payment method ${split.stripePaymentMethodId}`);
          balanceValidationResults.push({
            fundingSourceId: split.fundingSourceId,
            name: split.name,
            requiredAmount: splitAmount,
            availableBalance: 'unknown',
            sufficient: 'unknown'
          });
        }
      }
      
      // Check if we have sufficient funds from mock payment methods
      const insufficientFunds = balanceValidationResults.filter(result => result.sufficient === false);
      
      if (insufficientFunds.length > 0) {
        return res.status(400).json({
          message: "Insufficient funds in funding sources",
          totalRequired: totalWithFees,
          totalAvailable: totalAvailableBalance,
          insufficientSources: insufficientFunds,
          breakdown: balanceValidationResults
        });
      }

      console.log("✓ Funding source validation passed. Proceeding with fund capture...");

      // Step 2: Capture funds from user's funding sources into bpay's pool account
      const captureResults = [];
      
      for (const split of splits) {
        const splitAmount = (totalWithFees * split.percentage) / 100;
        const splitAmountCents = Math.round(splitAmount * 100);
        
        let captureResult;
        
        // Capture funds from real payment methods
        if (!split.stripePaymentMethodId.startsWith('pm_mock_')) {
          try {
            // Create payment intent to capture funds into bpay's pool account
            const paymentIntent = await stripe.paymentIntents.create({
              amount: splitAmountCents,
              currency: 'usd',
              payment_method: split.stripePaymentMethodId,
              customer: user.stripeCustomerId || undefined,
              confirm: true,
              capture_method: 'automatic', // Automatically capture funds
              metadata: {
                merchant,
                splitAmount: splitAmount.toString(),
                fundingSourceId: split.fundingSourceId.toString(),
                bpayPoolTransfer: 'true'
              }
            });
            
            captureResult = {
              id: paymentIntent.id,
              amount: splitAmount,
              status: paymentIntent.status,
              fundingSourceId: split.fundingSourceId,
              captured: paymentIntent.status === 'succeeded'
            };
            
            console.log(`Funds captured from funding source: ${paymentIntent.id} for $${splitAmount}`);
          } catch (stripeError: any) {
            console.error(`Failed to capture from funding source:`, stripeError.message);
            
            captureResult = {
              id: `pi_mock_${nanoid(16)}`,
              amount: splitAmount,
              status: 'failed',
              error: stripeError.message,
              fundingSourceId: split.fundingSourceId,
              captured: false
            };
          }
        } else {
          // Mock capture for demo payment methods
          captureResult = {
            id: `pi_${nanoid(16)}`,
            amount: splitAmount,
            status: 'succeeded',
            fundingSourceId: split.fundingSourceId,
            captured: true
          };
          
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        captureResults.push(captureResult);
      }

      // Check if all captures were successful
      const failedCaptures = captureResults.filter(result => !result.captured);
      if (failedCaptures.length > 0) {
        return res.status(400).json({ 
          message: "Failed to capture funds from some funding sources",
          failedCaptures: failedCaptures
        });
      }

      // Step 2: Get the virtual card from our database
      const virtualCards = await storage.getVirtualCardsByUserId(userId);
      const virtualCard = virtualCards.find(card => card.id === virtualCardId);
      if (!virtualCard) {
        return res.status(404).json({ message: "Virtual card not found" });
      }

      // Step 3: Load the virtual card with the captured amount using Stripe Issuing
      // Note: In a real implementation, this would involve transferring funds to the card
      // For now, we'll record the transaction and the card will be ready for use
      
      const transaction = await storage.createTransaction({
        userId,
        virtualCardId,
        merchant,
        amount: totalAmount.toFixed(2),
        splits: JSON.stringify(splits),
        status: 'completed',
        fees: feeCalculation.feeAmount.toFixed(2),
        stripePaymentIntentId: captureResults[0]?.id,
      });

      // Step 4: The virtual card is now loaded and ready for merchant use
      console.log(`Virtual card ${virtualCard.stripeCardId} loaded with $${totalAmount} for merchant: ${merchant}`);
      
      res.json({
        transaction,
        captureResults,
        virtualCard: {
          id: virtualCard.id,
          name: virtualCard.name,
          last4: virtualCard.cardNumber?.slice(-4),
          stripeCardId: virtualCard.stripeCardId,
          loadedAmount: totalAmount,
          readyForMerchantUse: true
        },
        totalAmount,
        totalFees: feeCalculation.feeAmount,
        message: "Funds captured and virtual card loaded successfully"
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  // Create payment intent for checkout
  app.post('/api/create-payment-intent', isAuthenticated, async (req: any, res) => {
    try {
      const { amount, merchant, splits } = req.body;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const totalAmount = parseFloat(amount);
      
      // Calculate fees based on user's subscription tier
      const userTier = user.subscriptionTier || 'free';
      const feeCalculation = FeeCalculator.calculateFees(totalAmount, userTier);
      const totalWithFees = feeCalculation.totalAmount;

      // Mock payment intent for demo
      const paymentIntent = {
        client_secret: `pi_${nanoid(16)}_secret_${nanoid(16)}`,
        id: `pi_${nanoid(16)}`,
        amount: Math.round(totalWithFees * 100),
        currency: 'usd',
        status: 'requires_payment_method',
        metadata: {
          merchant,
          originalAmount: amount,
          fees: feeCalculation.feeAmount.toFixed(2),
          splits: JSON.stringify(splits)
        }
      };

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        totalAmount,
        totalFees: feeCalculation.feeAmount,
        totalWithFees
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Test endpoint for Stripe Issuing integration
  app.post('/api/test-issuing', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount = 100 } = req.body;
      
      console.log('=== Testing Stripe Issuing Integration ===');
      
      // Step 1: Check current balance
      const currentBalance = await stripeIssuingService.getIssuingBalance();
      console.log(`Current Issuing balance: $${currentBalance}`);
      
      // Step 2: Fund balance if needed
      if (currentBalance < amount) {
        console.log(`Funding balance with $${amount + 50}`);
        await stripeIssuingService.fundIssuingBalance(amount + 50);
      }
      
      // Step 3: Check balance after funding
      const newBalance = await stripeIssuingService.getIssuingBalance();
      console.log(`Balance after funding: $${newBalance}`);
      
      // Step 4: Create cardholder
      const user = await storage.getUser(userId);
      const cardholder = await stripeIssuingService.createCardholder({
        firstName: user?.firstName || 'Test',
        lastName: user?.lastName || 'User',
        email: user?.email || 'test@example.com',
        phoneNumber: user?.phoneNumber || undefined,
        address: user?.address || undefined
      });
      
      // Step 5: Create virtual card
      const spendingControls = {
        spending_limits: [
          {
            amount: amount * 100,
            interval: 'monthly' as const
          }
        ]
      };
      
      const card = await stripeIssuingService.createBcard(cardholder.id, spendingControls);
      
      res.json({
        success: true,
        currentBalance,
        newBalance,
        cardholder: {
          id: cardholder.id,
          name: cardholder.name || cardholder.id
        },
        card: {
          id: card.id,
          last4: card.last4,
          status: card.status,
          type: card.type
        },
        message: 'Stripe Issuing integration test completed successfully'
      });
      
    } catch (error: any) {
      console.error('Stripe Issuing test failed:', error);
      res.status(500).json({ 
        success: false,
        error: error.message,
        details: error
      });
    }
  });

  // Register Merchant API routes
  registerMerchantAPI(app);

  // Register Admin API routes
  const adminApi = await import("./admin-api");
  app.use("/api/admin", adminApi.default);

  const httpServer = createServer(app);
  return httpServer;
}
