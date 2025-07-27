import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { insertPaymentIntentSchema, insertWebhookEventSchema } from "@shared/schema";
import { z } from "zod";
import { nanoid } from "nanoid";
import Stripe from "stripe";
import crypto from "crypto";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Merchant API Authentication Middleware
async function authenticateMerchant(req: any, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Missing or invalid API key. Use: Authorization: Bearer sk_test_...'
      });
    }

    const apiKey = authHeader.substring(7);
    const merchant = await storage.getMerchantByApiKey(apiKey);
    
    if (!merchant || !merchant.isActive) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Invalid API key or merchant account inactive'
      });
    }

    // Track API usage
    const today = new Date().toISOString().split('T')[0];
    await storage.trackApiUsage({
      merchantId: merchant.id,
      endpoint: req.path,
      method: req.method,
      requestCount: 1,
      date: today
    });

    req.merchant = merchant;
    next();
  } catch (error) {
    console.error('Merchant authentication error:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Authentication service unavailable'
    });
  }
}

// Rate limiting middleware
function rateLimiter(req: any, res: Response, next: NextFunction) {
  const key = `${req.merchant.id}:${req.ip}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100; // 100 requests per minute per merchant

  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    next();
  } else if (current.count < maxRequests) {
    current.count++;
    next();
  } else {
    res.status(429).json({
      error: 'rate_limit_exceeded',
      message: 'Too many requests. Limit: 100 requests per minute.',
      retry_after: Math.ceil((current.resetTime - now) / 1000)
    });
  }
}

// Validation schemas for merchant API
const createPaymentIntentSchema = z.object({
  amount: z.number().positive().max(999999), // Max $9,999.99
  currency: z.string().default('USD'),
  metadata: z.record(z.string()).optional(),
  customer: z.object({
    email: z.string().email().optional(),
    name: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
  split_configuration: z.object({
    auto_split: z.boolean().default(true),
    funding_sources: z.array(z.object({
      percentage: z.number().min(0).max(100),
      source_type: z.enum(['credit_card', 'debit_card', 'bank_account'])
    })).optional(),
    split_strategy: z.enum(['percentage', 'amount', 'smart']).default('smart')
  }).optional(),
  return_url: z.string().url().optional(),
  webhook_url: z.string().url().optional()
});

const confirmPaymentIntentSchema = z.object({
  payment_method: z.object({
    type: z.literal('bcard'),
    bcard: z.object({
      funding_sources: z.array(z.object({
        id: z.number(),
        amount: z.number().positive(),
        percentage: z.number().min(0).max(100).optional()
      })).min(1),
      split_strategy: z.enum(['percentage', 'amount', 'smart']).default('smart')
    })
  })
});

export function registerMerchantAPI(app: Express) {
  // Apply middleware to all merchant API routes
  app.use('/api/v1', authenticateMerchant, rateLimiter);

  /**
   * Core Payment Processing APIs
   */

  // Create Payment Intent - The heart of bpay merchant integration
  app.post('/api/v1/payment_intents', async (req: any, res: Response) => {
    try {
      const validatedData = createPaymentIntentSchema.parse(req.body);
      const merchant = req.merchant;

      // Generate unique payment intent ID
      const intentId = `pi_${nanoid(24)}`;
      const clientSecret = `${intentId}_secret_${nanoid(16)}`;

      // Create Stripe PaymentIntent for underlying processing
      const stripePaymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(validatedData.amount * 100), // Convert to cents
        currency: validatedData.currency.toLowerCase(),
        metadata: {
          merchant_id: merchant.id.toString(),
          bpay_intent_id: intentId,
          ...validatedData.metadata
        },
        automatic_payment_methods: {
          enabled: false // We'll handle payment methods ourselves
        }
      });

      // Store payment intent in our system
      const paymentIntent = await storage.createPaymentIntent({
        merchantId: merchant.id,
        intentId,
        amount: validatedData.amount.toString(),
        currency: validatedData.currency,
        status: 'requires_payment_method',
        clientSecret,
        metadata: validatedData.metadata || {},
        customerInfo: validatedData.customer || {},
        splitConfiguration: validatedData.split_configuration || {},
        stripePaymentIntentId: stripePaymentIntent.id
      });

      res.json({
        id: intentId,
        object: 'payment_intent',
        amount: validatedData.amount,
        currency: validatedData.currency,
        status: 'requires_payment_method',
        client_secret: clientSecret,
        metadata: validatedData.metadata || {},
        created: Math.floor(Date.now() / 1000),
        livemode: merchant.environment === 'production'
      });

    } catch (error) {
      console.error('Create payment intent error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'invalid_request',
          message: 'Invalid request parameters',
          details: error.errors
        });
      }
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to create payment intent'
      });
    }
  });

  // Confirm Payment Intent with bcard
  app.post('/api/v1/payment_intents/:intent_id/confirm', async (req: any, res: Response) => {
    try {
      const { intent_id } = req.params;
      const validatedData = confirmPaymentIntentSchema.parse(req.body);
      const merchant = req.merchant;

      // Get payment intent
      const paymentIntent = await storage.getPaymentIntentByIntentId(intent_id);
      if (!paymentIntent || paymentIntent.merchantId !== merchant.id) {
        return res.status(404).json({
          error: 'resource_missing',
          message: 'Payment intent not found'
        });
      }

      if (paymentIntent.status !== 'requires_payment_method') {
        return res.status(400).json({
          error: 'invalid_request',
          message: `Payment intent cannot be confirmed. Current status: ${paymentIntent.status}`
        });
      }

      // Process bcard payment (simplified for demo)
      const bcardData = validatedData.payment_method.bcard;
      const totalAmount = parseFloat(paymentIntent.amount);
      
      // Validate funding sources sum up correctly
      let totalCovered = 0;
      for (const source of bcardData.funding_sources) {
        if (bcardData.split_strategy === 'percentage' && source.percentage) {
          totalCovered += (totalAmount * source.percentage) / 100;
        } else if (source.amount) {
          totalCovered += source.amount;
        }
      }

      if (Math.abs(totalCovered - totalAmount) > 0.01) {
        return res.status(400).json({
          error: 'invalid_request',
          message: 'Funding sources do not cover the total payment amount',
          details: {
            required: totalAmount,
            covered: totalCovered,
            shortfall: totalAmount - totalCovered
          }
        });
      }

      // Update payment intent status
      const updatedIntent = await storage.updatePaymentIntent(paymentIntent.id, {
        status: 'processing',
        splitConfiguration: bcardData
      });

      // Simulate processing delay and update to succeeded
      setTimeout(async () => {
        try {
          await storage.updatePaymentIntent(paymentIntent.id, {
            status: 'succeeded'
          });

          // Create webhook event
          if (merchant.webhookSecret) {
            await storage.createWebhookEvent({
              merchantId: merchant.id,
              eventType: 'payment_intent.succeeded',
              eventData: {
                id: intent_id,
                object: 'payment_intent',
                amount: totalAmount,
                currency: paymentIntent.currency,
                status: 'succeeded',
                created: Math.floor(Date.now() / 1000)
              },
              deliveryStatus: 'pending',
              deliveryAttempts: 0,
              webhookUrl: req.body.webhook_url || `${merchant.website}/webhooks/bpay`,
              nextRetryAt: new Date()
            });
          }

          // Update merchant volume
          await storage.updateMerchant(merchant.id, {
            totalVolume: (parseFloat(merchant.totalVolume) + totalAmount).toString()
          });

        } catch (error) {
          console.error('Post-processing error:', error);
        }
      }, 2000);

      res.json({
        id: intent_id,
        object: 'payment_intent',
        amount: totalAmount,
        currency: paymentIntent.currency,
        status: 'processing',
        metadata: paymentIntent.metadata,
        payment_method: {
          type: 'bcard',
          bcard: {
            funding_sources: bcardData.funding_sources,
            split_strategy: bcardData.split_strategy
          }
        },
        created: Math.floor(new Date(paymentIntent.createdAt).getTime() / 1000),
        livemode: merchant.environment === 'production'
      });

    } catch (error) {
      console.error('Confirm payment intent error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'invalid_request',
          message: 'Invalid confirmation parameters',
          details: error.errors
        });
      }
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to confirm payment intent'
      });
    }
  });

  // Retrieve Payment Intent
  app.get('/api/v1/payment_intents/:intent_id', async (req: any, res: Response) => {
    try {
      const { intent_id } = req.params;
      const merchant = req.merchant;

      const paymentIntent = await storage.getPaymentIntentByIntentId(intent_id);
      if (!paymentIntent || paymentIntent.merchantId !== merchant.id) {
        return res.status(404).json({
          error: 'resource_missing',
          message: 'Payment intent not found'
        });
      }

      res.json({
        id: intent_id,
        object: 'payment_intent',
        amount: parseFloat(paymentIntent.amount),
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        client_secret: paymentIntent.clientSecret,
        metadata: paymentIntent.metadata,
        customer: paymentIntent.customerInfo,
        split_configuration: paymentIntent.splitConfiguration,
        created: Math.floor(new Date(paymentIntent.createdAt).getTime() / 1000),
        livemode: merchant.environment === 'production'
      });

    } catch (error) {
      console.error('Retrieve payment intent error:', error);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to retrieve payment intent'
      });
    }
  });

  // List Payment Intents
  app.get('/api/v1/payment_intents', async (req: any, res: Response) => {
    try {
      const merchant = req.merchant;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
      
      const paymentIntents = await storage.getPaymentIntentsByMerchantId(merchant.id);
      const limitedIntents = paymentIntents.slice(0, limit);

      res.json({
        object: 'list',
        data: limitedIntents.map(intent => ({
          id: intent.intentId,
          object: 'payment_intent',
          amount: parseFloat(intent.amount),
          currency: intent.currency,
          status: intent.status,
          metadata: intent.metadata,
          created: Math.floor(new Date(intent.createdAt).getTime() / 1000),
          livemode: merchant.environment === 'production'
        })),
        has_more: paymentIntents.length > limit,
        url: '/api/v1/payment_intents'
      });

    } catch (error) {
      console.error('List payment intents error:', error);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to list payment intents'
      });
    }
  });

  /**
   * Merchant Information & Configuration APIs
   */

  // Get Merchant Information
  app.get('/api/v1/merchant', async (req: any, res: Response) => {
    try {
      const merchant = req.merchant;

      res.json({
        id: merchant.id,
        business_name: merchant.businessName,
        business_email: merchant.businessEmail,
        website: merchant.website,
        environment: merchant.environment,
        platform_type: merchant.platformType,
        total_volume: parseFloat(merchant.totalVolume),
        allowed_domains: merchant.allowedDomains,
        is_active: merchant.isActive,
        created: Math.floor(new Date(merchant.createdAt).getTime() / 1000)
      });

    } catch (error) {
      console.error('Get merchant error:', error);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to retrieve merchant information'
      });
    }
  });

  // Get API Usage Statistics
  app.get('/api/v1/merchant/usage', async (req: any, res: Response) => {
    try {
      const merchant = req.merchant;
      const date = req.query.date as string || new Date().toISOString().split('T')[0];
      
      const usage = await storage.getApiUsage(merchant.id, date);
      
      const summary = usage.reduce((acc, curr) => {
        acc.total_requests += curr.requestCount;
        acc.endpoints[curr.endpoint] = (acc.endpoints[curr.endpoint] || 0) + curr.requestCount;
        return acc;
      }, {
        total_requests: 0,
        date,
        endpoints: {} as Record<string, number>
      });

      res.json(summary);

    } catch (error) {
      console.error('Get usage error:', error);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to retrieve usage statistics'
      });
    }
  });

  /**
   * Webhook Management APIs
   */

  // List Webhook Events
  app.get('/api/v1/events', async (req: any, res: Response) => {
    try {
      const merchant = req.merchant;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
      
      const events = await storage.getWebhookEventsByMerchantId(merchant.id);
      const limitedEvents = events.slice(0, limit);

      res.json({
        object: 'list',
        data: limitedEvents.map(event => ({
          id: event.id,
          object: 'event',
          type: event.eventType,
          data: event.eventData,
          created: Math.floor(new Date(event.createdAt).getTime() / 1000),
          livemode: merchant.environment === 'production'
        })),
        has_more: events.length > limit,
        url: '/api/v1/events'
      });

    } catch (error) {
      console.error('List events error:', error);
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to list events'
      });
    }
  });

  /**
   * Health Check & Status APIs
   */

  // API Health Check
  app.get('/api/v1/health', async (req: any, res: Response) => {
    res.json({
      status: 'healthy',
      version: '1.0.0',
      environment: req.merchant.environment,
      timestamp: Math.floor(Date.now() / 1000)
    });
  });

  // API Documentation Endpoint
  app.get('/api/v1', async (req: any, res: Response) => {
    res.json({
      message: 'bpay Merchant API v1.0',
      documentation: 'https://docs.bpay.com/api',
      endpoints: {
        payment_intents: '/api/v1/payment_intents',
        merchant: '/api/v1/merchant',
        events: '/api/v1/events',
        health: '/api/v1/health'
      },
      authentication: 'Bearer token required',
      rate_limits: {
        requests_per_minute: 100,
        burst_limit: 20
      }
    });
  });
}