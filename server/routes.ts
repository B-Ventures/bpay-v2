import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertFundingSourceSchema, insertVirtualCardSchema, insertTransactionSchema, insertMerchantSchema } from "@shared/schema";
import { z } from "zod";
import { nanoid } from "nanoid";
import Stripe from "stripe";
import { stripeIssuingService } from "./services/stripe-issuing";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

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

      // Create Stripe payment method
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: req.body.cardNumber.replace(/\s/g, ''),
          exp_month: parseInt(req.body.expiryMonth),
          exp_year: parseInt(req.body.expiryYear),
          cvc: req.body.cvv,
        },
      });

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: stripeCustomerId,
      });

      const validatedData = insertFundingSourceSchema.parse({
        ...req.body,
        userId,
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
          name: "bpay Virtual Card",
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

      // Generate mock virtual card details (in production, use Stripe Issuing)
      const cardNumber = `4532${Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0')}`;
      const expiryMonth = Math.floor(Math.random() * 12) + 1;
      const expiryYear = new Date().getFullYear() + Math.floor(Math.random() * 5) + 1;
      const cvv = Math.floor(Math.random() * 900) + 100;

      const validatedData = insertVirtualCardSchema.parse({
        ...req.body,
        userId,
        cardNumber,
        expiryMonth,
        expiryYear,
        cvv: cvv.toString(),
        stripeCardId: `card_${nanoid(16)}`,
      });
      
      const virtualCard = await storage.createVirtualCard(validatedData);
      res.json(virtualCard);
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
      await storage.deleteVirtualCard(id);
      res.json({ message: "Virtual card deleted successfully" });
    } catch (error) {
      console.error("Error deleting virtual card:", error);
      res.status(500).json({ message: "Failed to delete virtual card" });
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

  // Payment splitting endpoint
  app.post('/api/process-payment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount, merchant, virtualCardId, splits } = req.body;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Process payment splits (demo mode - mock Stripe calls)
      const paymentIntents = [];
      const totalAmount = parseFloat(amount);
      const feePercentage = 0.029; // 2.9% bpay fee
      const totalFees = totalAmount * feePercentage;
      const totalWithFees = totalAmount + totalFees;

      // Mock payment processing for demo
      for (const split of splits) {
        const splitAmount = (totalWithFees * split.percentage) / 100;
        
        // Simulate payment intent creation with mock data
        const mockPaymentIntent = {
          id: `pi_${nanoid(16)}`,
          amount: splitAmount,
          status: 'succeeded',
          fundingSourceId: split.fundingSourceId
        };

        paymentIntents.push(mockPaymentIntent);
        
        // Add a small delay to simulate network request
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Validate splits total to 100%
      const totalPercentage = splits.reduce((sum: number, split: any) => sum + split.percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return res.status(400).json({ message: "Split percentages must total 100%" });
      }

      // Create transaction record
      const transaction = await storage.createTransaction({
        userId,
        virtualCardId,
        merchant,
        amount: totalAmount.toFixed(2),
        splits: JSON.stringify(splits),
        status: 'completed',
        fees: totalFees.toFixed(2),
        stripePaymentIntentId: paymentIntents[0]?.id,
      });
      
      res.json({
        transaction,
        paymentIntents,
        totalAmount,
        totalFees,
        message: "Payment processed successfully"
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
      const feePercentage = 0.029; // 2.9% bpay fee
      const totalFees = totalAmount * feePercentage;
      const totalWithFees = totalAmount + totalFees;

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
          fees: totalFees.toFixed(2),
          splits: JSON.stringify(splits)
        }
      };

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        totalAmount,
        totalFees,
        totalWithFees
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
