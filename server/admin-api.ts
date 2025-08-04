import { Router } from "express";
import { eq, desc, count, sum, and, gte, lte, like, sql } from "drizzle-orm";
import { db } from "./db";
import { 
  users, merchants, userSubscriptions, subscriptionTiers, kycVerifications,
  paymentVendors, revenueEntries, fundingPoolEntries, bcardGenerationAttempts,
  fundingDeductionAttempts, transactions, fundingSources, virtualCards,
  insertSubscriptionTierSchema, insertKycVerificationSchema, insertPaymentVendorSchema
} from "@shared/schema";
import { z } from "zod";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "bpay_admin_secret_2025";

const router = Router();

// Admin authentication middleware
const requireAdminAuth = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({ error: "Admin token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.username !== "bpay_admin") {
      return res.status(403).json({ error: "Invalid admin access" });
    }
    req.adminUser = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid admin token" });
  }
};

// Admin credentials - In production, store these securely
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || "bpay_admin",
  password: process.env.ADMIN_PASSWORD || "admin123!",
  accessCode: process.env.ADMIN_ACCESS_CODE || "BPAY2025"
};

// Admin login schema
const adminLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  accessCode: z.string().min(1),
});

// Admin authentication endpoint
router.post("/auth/login", async (req, res) => {
  try {
    const { username, password, accessCode } = adminLoginSchema.parse(req.body);
    
    // Verify credentials
    if (
      username === ADMIN_CREDENTIALS.username &&
      password === ADMIN_CREDENTIALS.password &&
      accessCode === ADMIN_CREDENTIALS.accessCode
    ) {
      // Generate JWT token
      const token = jwt.sign(
        { 
          role: "admin", 
          username,
          loginTime: new Date().toISOString()
        },
        JWT_SECRET,
        { expiresIn: "8h" }
      );
      
      res.json({
        success: true,
        token,
        message: "Admin authentication successful",
        expiresIn: "8h"
      });
    } else {
      res.status(401).json({
        error: "Invalid admin credentials",
        message: "Username, password, or access code is incorrect"
      });
    }
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(400).json({ error: "Invalid request format" });
  }
});

// Middleware to verify admin JWT token
const requireAdminToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Admin token required" });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired admin token" });
  }
};

// Token verification endpoint
router.get("/auth/verify", requireAdminToken, (req: any, res) => {
  res.json({
    valid: true,
    admin: {
      username: req.admin.username,
      loginTime: req.admin.loginTime,
      role: req.admin.role
    }
  });
});

// Apply admin token middleware to all other routes
router.use(requireAdminToken);

// 1. CUSTOMER & MERCHANT MANAGEMENT

// Get all users with pagination and filtering
router.get("/users", async (req, res) => {
  try {
    const { page = 1, limit = 50, search, role, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let whereConditions = [];
    
    // Apply filters
    if (search) {
      whereConditions.push(like(users.email, `%${search}%`));
    }
    if (role) {
      whereConditions.push(eq(users.role, role as string));
    }

    let query = db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      country: users.country,
      createdAt: users.createdAt,
      profileImageUrl: users.profileImageUrl,
    }).from(users);

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    const usersList = await query
      .orderBy(desc(users.createdAt))
      .limit(Number(limit))
      .offset(offset);

    // Get total count
    const totalCount = await db.select({ count: count() }).from(users);

    res.json({
      users: usersList,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount[0].count,
        totalPages: Math.ceil(totalCount[0].count / Number(limit))
      }
    });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get all merchants with their revenue data
router.get("/merchants", async (req, res) => {
  try {
    const merchantsList = await db.select({
      id: merchants.id,
      businessName: merchants.businessName,
      businessEmail: merchants.businessEmail,
      website: merchants.website,
      environment: merchants.environment,
      isActive: merchants.isActive,
      totalVolume: merchants.totalVolume,
      platformType: merchants.platformType,
      createdAt: merchants.createdAt,
      user: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      }
    })
    .from(merchants)
    .leftJoin(users, eq(merchants.userId, users.id))
    .orderBy(desc(merchants.totalVolume));

    res.json({ merchants: merchantsList });
  } catch (error) {
    console.error("Admin merchants fetch error:", error);
    res.status(500).json({ error: "Failed to fetch merchants" });
  }
});

// Update user role or status
router.patch("/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, status } = req.body;
    
    const updateData: any = {};
    if (role) updateData.role = role;
    // Add status field to users table if needed
    
    await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId));
    
    res.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    console.error("Admin user update error:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// 2. SUBSCRIPTION MANAGEMENT

// Get all subscription tiers
router.get("/subscription-tiers", requireAdminAuth, async (req, res) => {
  try {
    const tiers = await db.select().from(subscriptionTiers).orderBy(subscriptionTiers.monthlyPrice);
    res.json({ tiers });
  } catch (error) {
    console.error("Subscription tiers fetch error:", error);
    res.status(500).json({ error: "Failed to fetch subscription tiers" });
  }
});

// Create or update subscription tier
router.post("/subscription-tiers", requireAdminAuth, async (req, res) => {
  try {
    const validatedData = insertSubscriptionTierSchema.parse(req.body);
    
    const [tier] = await db.insert(subscriptionTiers)
      .values(validatedData)
      .returning();
    
    res.json({ tier });
  } catch (error) {
    console.error("Subscription tier creation error:", error);
    res.status(500).json({ error: "Failed to create subscription tier" });
  }
});

// Update subscription tier
router.patch("/subscription-tiers/:tierId", requireAdminAuth, async (req, res) => {
  try {
    const { tierId } = req.params;
    
    const [updatedTier] = await db.update(subscriptionTiers)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(subscriptionTiers.id, Number(tierId)))
      .returning();
    
    res.json({ tier: updatedTier });
  } catch (error) {
    console.error("Subscription tier update error:", error);
    res.status(500).json({ error: "Failed to update subscription tier" });
  }
});

// Toggle subscription tier active status
router.patch("/subscription-tiers/:tierId/toggle", requireAdminAuth, async (req, res) => {
  try {
    const { tierId } = req.params;
    
    const [tier] = await db.select().from(subscriptionTiers).where(eq(subscriptionTiers.id, Number(tierId)));
    
    await db.update(subscriptionTiers)
      .set({ isActive: !tier.isActive, updatedAt: new Date() })
      .where(eq(subscriptionTiers.id, Number(tierId)));
    
    res.json({ success: true, message: "Tier status updated" });
  } catch (error) {
    console.error("Tier toggle error:", error);
    res.status(500).json({ error: "Failed to toggle tier status" });
  }
});

// Get user subscriptions with details
router.get("/user-subscriptions", requireAdminAuth, async (req, res) => {
  try {
    const subscriptions = await db.select({
      id: userSubscriptions.id,
      userId: userSubscriptions.userId,
      tierId: userSubscriptions.tierId,
      status: userSubscriptions.status,
      currentPeriodStart: userSubscriptions.currentPeriodStart,
      currentPeriodEnd: userSubscriptions.currentPeriodEnd,
      stripeSubscriptionId: userSubscriptions.stripeSubscriptionId,
      user: {
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      },
      tier: {
        name: subscriptionTiers.name,
        displayName: subscriptionTiers.displayName,
        monthlyPrice: subscriptionTiers.monthlyPrice,
      }
    })
    .from(userSubscriptions)
    .leftJoin(users, eq(userSubscriptions.userId, users.id))
    .leftJoin(subscriptionTiers, eq(userSubscriptions.tierId, subscriptionTiers.id))
    .orderBy(desc(userSubscriptions.createdAt));

    res.json({ subscriptions });
  } catch (error) {
    console.error("User subscriptions fetch error:", error);
    res.status(500).json({ error: "Failed to fetch user subscriptions" });
  }
});

// Change user subscription
router.patch("/users/:userId/subscription", requireAdminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { tierId } = req.body;
    
    // Check if user has existing subscription
    const [existingSubscription] = await db.select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));
    
    if (existingSubscription) {
      // Update existing subscription
      await db.update(userSubscriptions)
        .set({ 
          tierId: Number(tierId), 
          updatedAt: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        })
        .where(eq(userSubscriptions.userId, userId));
    } else {
      // Create new subscription
      await db.insert(userSubscriptions).values({
        userId,
        tierId: Number(tierId),
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      });
    }
    
    // Update user's subscription tier
    await db.update(users)
      .set({ subscriptionTier: (await db.select({ name: subscriptionTiers.name }).from(subscriptionTiers).where(eq(subscriptionTiers.id, Number(tierId))))[0]?.name || 'free' })
      .where(eq(users.id, userId));
    
    res.json({ success: true, message: "User subscription updated" });
  } catch (error) {
    console.error("User subscription update error:", error);
    res.status(500).json({ error: "Failed to update user subscription" });
  }
});

// Get subscription analytics
router.get("/subscription-analytics", requireAdminAuth, async (req, res) => {
  try {
    // Total subscription revenue
    const subscriptionRevenue = await db.select({
      total: sum(revenueEntries.amount)
    })
    .from(revenueEntries)
    .where(eq(revenueEntries.type, "subscription"));

    // Active subscriptions by tier
    const subscriptionsByTier = await db.select({
      tierName: subscriptionTiers.displayName,
      count: count(),
      monthlyRevenue: sum(subscriptionTiers.monthlyPrice)
    })
    .from(userSubscriptions)
    .leftJoin(subscriptionTiers, eq(userSubscriptions.tierId, subscriptionTiers.id))
    .where(eq(userSubscriptions.status, "active"))
    .groupBy(subscriptionTiers.id, subscriptionTiers.displayName);

    res.json({
      totalSubscriptionRevenue: subscriptionRevenue[0]?.total || 0,
      subscriptionsByTier
    });
  } catch (error) {
    console.error("Subscription analytics error:", error);
    res.status(500).json({ error: "Failed to fetch subscription analytics" });
  }
});

// 3. KYC MANAGEMENT

// Get KYC verifications pending review
router.get("/kyc-verifications", async (req, res) => {
  try {
    const { status = "pending" } = req.query;
    
    const verifications = await db.select({
      id: kycVerifications.id,
      userId: kycVerifications.userId,
      status: kycVerifications.status,
      documentType: kycVerifications.documentType,
      riskScore: kycVerifications.riskScore,
      createdAt: kycVerifications.createdAt,
      user: {
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      }
    })
    .from(kycVerifications)
    .leftJoin(users, eq(kycVerifications.userId, users.id))
    .where(eq(kycVerifications.status, status as string))
    .orderBy(desc(kycVerifications.createdAt));

    res.json({ verifications });
  } catch (error) {
    console.error("KYC verifications fetch error:", error);
    res.status(500).json({ error: "Failed to fetch KYC verifications" });
  }
});

// Update KYC verification status
router.patch("/kyc-verifications/:verificationId", async (req, res) => {
  try {
    const { verificationId } = req.params;
    const { status, notes, riskScore } = req.body;
    
    await db.update(kycVerifications)
      .set({
        status,
        notes,
        riskScore,
        reviewedBy: (req as any).admin?.username || 'admin',
        reviewedAt: new Date(),
      })
      .where(eq(kycVerifications.id, Number(verificationId)));
    
    res.json({ success: true, message: "KYC verification updated" });
  } catch (error) {
    console.error("KYC verification update error:", error);
    res.status(500).json({ error: "Failed to update KYC verification" });
  }
});

// 4. PAYMENT VENDOR MANAGEMENT

// Get all payment vendors
router.get("/payment-vendors", requireAdminAuth, async (req, res) => {
  try {
    const vendors = await db.select().from(paymentVendors).orderBy(paymentVendors.priority);
    res.json({ vendors });
  } catch (error) {
    console.error("Payment vendors fetch error:", error);
    res.status(500).json({ error: "Failed to fetch payment vendors" });
  }
});

// Add or update payment vendor
router.post("/payment-vendors", requireAdminAuth, async (req, res) => {
  try {
    const validatedData = insertPaymentVendorSchema.parse(req.body);
    
    const [vendor] = await db.insert(paymentVendors)
      .values(validatedData)
      .returning();
    
    res.json({ vendor });
  } catch (error) {
    console.error("Payment vendor creation error:", error);
    res.status(500).json({ error: "Failed to create payment vendor" });
  }
});

// Update payment vendor
router.patch("/payment-vendors/:vendorId", requireAdminAuth, async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const [updatedVendor] = await db.update(paymentVendors)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(paymentVendors.id, Number(vendorId)))
      .returning();
    
    res.json({ vendor: updatedVendor });
  } catch (error) {
    console.error("Payment vendor update error:", error);
    res.status(500).json({ error: "Failed to update payment vendor" });
  }
});

// Toggle vendor activation
router.patch("/payment-vendors/:vendorId/toggle", requireAdminAuth, async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const [vendor] = await db.select().from(paymentVendors).where(eq(paymentVendors.id, Number(vendorId)));
    
    await db.update(paymentVendors)
      .set({ isActive: !vendor.isActive, updatedAt: new Date() })
      .where(eq(paymentVendors.id, Number(vendorId)));
    
    res.json({ success: true, message: "Vendor status updated" });
  } catch (error) {
    console.error("Vendor toggle error:", error);
    res.status(500).json({ error: "Failed to toggle vendor status" });
  }
});

// Test vendor connection
router.post("/payment-vendors/:vendorId/test", requireAdminAuth, async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const [vendor] = await db.select().from(paymentVendors).where(eq(paymentVendors.id, Number(vendorId)));
    
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    let testResult = { success: false, message: "Test not implemented for this vendor" };

    if (vendor.name === 'stripe' && vendor.configuration) {
      // Test Stripe connection
      try {
        const config = vendor.configuration as any;
        const mode = config.mode || 'test';
        const secretKey = mode === 'test' ? config.test?.secretKey : config.live?.secretKey;
        
        if (!secretKey) {
          testResult = { success: false, message: "No secret key configured for current mode" };
        } else {
          // Simple account retrieve test
          const stripe = require('stripe')(secretKey);
          const account = await stripe.accounts.retrieve();
          
          testResult = {
            success: true,
            message: `Connected to Stripe account: ${account.id} (${mode} mode)`
          };
        }
      } catch (stripeError: any) {
        testResult = {
          success: false,
          message: `Stripe connection failed: ${stripeError.message}`
        };
      }
    }
    
    res.json(testResult);
  } catch (error) {
    console.error("Vendor connection test error:", error);
    res.status(500).json({ error: "Failed to test vendor connection" });
  }
});

// 5. REVENUE & ANALYTICS DASHBOARD

// Get comprehensive dashboard data
router.get("/dashboard", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Basic metrics using existing tables only
    const transactionCount = await db.select({ count: count() }).from(transactions);
    const bcardsCount = await db.select({ count: count() }).from(virtualCards);
    const fundingSourcesCount = await db.select({ count: count() }).from(fundingSources);

    // User and merchant counts
    const userCount = await db.select({ count: count() }).from(users);
    const merchantCount = await db.select({ count: count() }).from(merchants);

    res.json({
      revenue: {
        total: 0, // Revenue tracking to be implemented
      },
      transactions: {
        volume: 0, // Transaction volume calculation pending
        count: transactionCount[0]?.count || 0,
      },
      fundingPool: {
        balance: 0, // Funding pool tracking to be implemented
      },
      bcardGeneration: {
        total: bcardsCount[0]?.count || 0,
        successful: bcardsCount[0]?.count || 0,
        successRate: 100
      },
      fundingDeductions: {
        total: fundingSourcesCount[0]?.count || 0,
        successful: fundingSourcesCount[0]?.count || 0,
        successRate: 100
      },
      users: {
        total: userCount[0]?.count || 0,
      },
      merchants: {
        total: merchantCount[0]?.count || 0,
      }
    });
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

// Get recent bcard generation attempts
router.get("/bcard-generations", async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let bcardQuery = db.select({
      id: bcardGenerationAttempts.id,
      userId: bcardGenerationAttempts.userId,
      requestedAmount: bcardGenerationAttempts.requestedAmount,
      actualAmount: bcardGenerationAttempts.actualAmount,
      status: bcardGenerationAttempts.status,
      bcardId: bcardGenerationAttempts.bcardId,
      errorMessage: bcardGenerationAttempts.errorMessage,
      vendorUsed: bcardGenerationAttempts.vendorUsed,
      processingTimeMs: bcardGenerationAttempts.processingTimeMs,
      createdAt: bcardGenerationAttempts.createdAt,
      user: {
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      }
    })
    .from(bcardGenerationAttempts)
    .leftJoin(users, eq(bcardGenerationAttempts.userId, users.id));

    let generations;
    if (status) {
      generations = await bcardQuery
        .where(eq(bcardGenerationAttempts.status, status as string))
        .orderBy(desc(bcardGenerationAttempts.createdAt))
        .limit(Number(limit))
        .offset(offset);
    } else {
      generations = await bcardQuery
        .orderBy(desc(bcardGenerationAttempts.createdAt))
        .limit(Number(limit))
        .offset(offset);
    }

    res.json({ generations });
  } catch (error) {
    console.error("bcard generations fetch error:", error);
    res.status(500).json({ error: "Failed to fetch bcard generations" });
  }
});

// Get funding source deduction attempts
router.get("/funding-deductions", async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let deductionQuery = db.select({
      id: fundingDeductionAttempts.id,
      bcardGenerationId: fundingDeductionAttempts.bcardGenerationId,
      fundingSourceId: fundingDeductionAttempts.fundingSourceId,
      attemptedAmount: fundingDeductionAttempts.attemptedAmount,
      actualAmount: fundingDeductionAttempts.actualAmount,
      status: fundingDeductionAttempts.status,
      vendorTransactionId: fundingDeductionAttempts.vendorTransactionId,
      errorMessage: fundingDeductionAttempts.errorMessage,
      processingTimeMs: fundingDeductionAttempts.processingTimeMs,
      createdAt: fundingDeductionAttempts.createdAt,
      fundingSource: {
        name: fundingSources.name,
        type: fundingSources.type,
        last4: fundingSources.last4,
      }
    })
    .from(fundingDeductionAttempts)
    .leftJoin(fundingSources, eq(fundingDeductionAttempts.fundingSourceId, fundingSources.id));

    let deductions;
    if (status) {
      deductions = await deductionQuery
        .where(eq(fundingDeductionAttempts.status, status as string))
        .orderBy(desc(fundingDeductionAttempts.createdAt))
        .limit(Number(limit))
        .offset(offset);
    } else {
      deductions = await deductionQuery
        .orderBy(desc(fundingDeductionAttempts.createdAt))
        .limit(Number(limit))
        .offset(offset);
    }

    res.json({ deductions });
  } catch (error) {
    console.error("Funding deductions fetch error:", error);
    res.status(500).json({ error: "Failed to fetch funding deductions" });
  }
});

// 6. KYC VERIFICATION MANAGEMENT & MONITORING

// Get KYC verification dashboard data
router.get("/kyc/dashboard", requireAdminAuth, async (req, res) => {
  try {
    // Since this is a demo, return sample data that shows the dashboard functionality
    const mockDashboardData = {
      overview: {
        totalVerifications: 247,
        verifiedUsers: 189,
        pendingVerifications: 23,
        failedVerifications: 35,
        successRate: 76.5,
        highRiskUsers: 12,
        manualReviewQueue: 8,
        recentActivity: 41
      },
      verificationTypes: {
        identityDocument: 180,
        selfie: 145,
        address: 89
      },
      documentTypes: {
        passport: 95,
        drivingLicense: 112,
        idCard: 73
      }
    };

    res.json(mockDashboardData);
  } catch (error) {
    console.error("KYC dashboard fetch error:", error);
    res.status(500).json({ error: "Failed to fetch KYC dashboard data" });
  }
});

// Get all KYC verifications with filtering and pagination
router.get("/kyc/verifications", requireAdminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, verificationType, riskLevel, search } = req.query;
    
    // Sample KYC verification data for demo purposes
    const sampleVerifications = [
      {
        id: 1,
        userId: "user_1",
        verificationType: "identity_document",
        status: "verified",
        documentType: "passport",
        documentCountry: "US",
        riskLevel: "low",
        riskScore: 15,
        errorCode: null,
        errorMessage: null,
        reviewedBy: "bpay_admin",
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        verifiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          email: "sarah.johnson@example.com",
          firstName: "Sarah",
          lastName: "Johnson"
        }
      },
      {
        id: 2,
        userId: "user_2",
        verificationType: "selfie",
        status: "pending",
        documentType: "driving_license",
        documentCountry: "CA",
        riskLevel: "medium",
        riskScore: 45,
        errorCode: null,
        errorMessage: null,
        reviewedBy: null,
        submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        verifiedAt: null,
        user: {
          email: "michael.chen@example.com",
          firstName: "Michael",
          lastName: "Chen"
        }
      },
      {
        id: 3,
        userId: "user_3",
        verificationType: "identity_document",
        status: "failed",
        documentType: "id_card",
        documentCountry: "UK",
        riskLevel: "high",
        riskScore: 85,
        errorCode: "document_expired",
        errorMessage: "The provided document has expired and cannot be verified",
        reviewedBy: "bpay_admin",
        submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        verifiedAt: null,
        user: {
          email: "alex.martinez@example.com",
          firstName: "Alex",
          lastName: "Martinez"
        }
      },
      {
        id: 4,
        userId: "user_4",
        verificationType: "address",
        status: "processing",
        documentType: "passport",
        documentCountry: "DE",
        riskLevel: "low",
        riskScore: 22,
        errorCode: null,
        errorMessage: null,
        reviewedBy: null,
        submittedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        verifiedAt: null,
        user: {
          email: "emma.weber@example.com",
          firstName: "Emma",
          lastName: "Weber"
        }
      },
      {
        id: 5,
        userId: "user_5",
        verificationType: "identity_document",
        status: "verified",
        documentType: "driving_license",
        documentCountry: "AU",
        riskLevel: "low",
        riskScore: 8,
        errorCode: null,
        errorMessage: null,
        reviewedBy: "bpay_admin",
        submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        verifiedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          email: "david.thompson@example.com",
          firstName: "David",
          lastName: "Thompson"
        }
      }
    ];

    // Apply filters
    let filteredVerifications = sampleVerifications;
    
    if (status && status !== "all") {
      filteredVerifications = filteredVerifications.filter(v => v.status === status);
    }
    if (verificationType && verificationType !== "all") {
      filteredVerifications = filteredVerifications.filter(v => v.verificationType === verificationType);
    }
    if (riskLevel && riskLevel !== "all") {
      filteredVerifications = filteredVerifications.filter(v => v.riskLevel === riskLevel);
    }
    if (search) {
      filteredVerifications = filteredVerifications.filter(v => 
        v.user.email.toLowerCase().includes(search.toString().toLowerCase()) ||
        v.user.firstName.toLowerCase().includes(search.toString().toLowerCase()) ||
        v.user.lastName.toLowerCase().includes(search.toString().toLowerCase())
      );
    }

    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedVerifications = filteredVerifications.slice(startIndex, endIndex);

    res.json({
      verifications: paginatedVerifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredVerifications.length,
        totalPages: Math.ceil(filteredVerifications.length / Number(limit))
      }
    });
  } catch (error) {
    console.error("KYC verifications fetch error:", error);
    res.status(500).json({ error: "Failed to fetch KYC verifications" });
  }
});

// Get specific KYC verification details
router.get("/kyc/verifications/:verificationId", requireAdminAuth, async (req, res) => {
  try {
    const { verificationId } = req.params;
    
    const [verification] = await db.select({
      id: kycVerifications.id,
      userId: kycVerifications.userId,
      verificationType: kycVerifications.verificationType,
      status: kycVerifications.status,
      stripeVerificationSessionId: kycVerifications.stripeVerificationSessionId,
      stripeVerificationReportId: kycVerifications.stripeVerificationReportId,
      documentType: kycVerifications.documentType,
      documentCountry: kycVerifications.documentCountry,
      documentNumber: kycVerifications.documentNumber,
      documentUrls: kycVerifications.documentUrls,
      verificationMethod: kycVerifications.verificationMethod,
      riskScore: kycVerifications.riskScore,
      riskLevel: kycVerifications.riskLevel,
      extractedData: kycVerifications.extractedData,
      verificationChecks: kycVerifications.verificationChecks,
      errorCode: kycVerifications.errorCode,
      errorMessage: kycVerifications.errorMessage,
      notes: kycVerifications.notes,
      adminNotes: kycVerifications.adminNotes,
      reviewedBy: kycVerifications.reviewedBy,
      reviewedAt: kycVerifications.reviewedAt,
      submittedAt: kycVerifications.submittedAt,
      verifiedAt: kycVerifications.verifiedAt,
      metadata: kycVerifications.metadata,
      createdAt: kycVerifications.createdAt,
      updatedAt: kycVerifications.updatedAt,
      user: {
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phoneNumber: users.phoneNumber,
        country: users.country,
      }
    })
    .from(kycVerifications)
    .leftJoin(users, eq(kycVerifications.userId, users.id))
    .where(eq(kycVerifications.id, Number(verificationId)));

    if (!verification) {
      return res.status(404).json({ error: "KYC verification not found" });
    }

    res.json({ verification });
  } catch (error) {
    console.error("KYC verification detail fetch error:", error);
    res.status(500).json({ error: "Failed to fetch KYC verification details" });
  }
});

// Update KYC verification status (manual review)
router.patch("/kyc/verifications/:verificationId", requireAdminAuth, async (req, res) => {
  try {
    const { verificationId } = req.params;
    const { status, adminNotes, riskLevel } = req.body;
    
    // Get admin info from token
    const token = req.headers.authorization?.replace("Bearer ", "");
    const decoded = jwt.verify(token!, JWT_SECRET) as any;
    const adminUsername = decoded.username;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
      if (status === "verified") {
        updateData.verifiedAt = new Date();
      }
      updateData.reviewedBy = adminUsername;
      updateData.reviewedAt = new Date();
    }

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    if (riskLevel) {
      updateData.riskLevel = riskLevel;
    }

    await db.update(kycVerifications)
      .set(updateData)
      .where(eq(kycVerifications.id, Number(verificationId)));

    res.json({ 
      success: true, 
      message: "KYC verification updated successfully" 
    });
  } catch (error) {
    console.error("KYC verification update error:", error);
    res.status(500).json({ error: "Failed to update KYC verification" });
  }
});

// Bulk approve/reject KYC verifications
router.post("/kyc/verifications/bulk-action", requireAdminAuth, async (req, res) => {
  try {
    const { verificationIds, action, adminNotes } = req.body;
    
    // Get admin info from token
    const token = req.headers.authorization?.replace("Bearer ", "");
    const decoded = jwt.verify(token!, JWT_SECRET) as any;
    const adminUsername = decoded.username;

    const updateData: any = {
      status: action, // 'verified' or 'failed'
      reviewedBy: adminUsername,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    };

    if (action === "verified") {
      updateData.verifiedAt = new Date();
    }

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    // Update all specified verifications
    for (const verificationId of verificationIds) {
      await db.update(kycVerifications)
        .set(updateData)
        .where(eq(kycVerifications.id, Number(verificationId)));
    }

    res.json({ 
      success: true, 
      message: `Successfully ${action} ${verificationIds.length} verifications`,
      updatedCount: verificationIds.length
    });
  } catch (error) {
    console.error("KYC bulk action error:", error);
    res.status(500).json({ error: "Failed to perform bulk action" });
  }
});

// Get KYC compliance report
router.get("/kyc/compliance-report", requireAdminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Time-based filtering
    let dateConditions = [];
    if (startDate) {
      dateConditions.push(gte(kycVerifications.createdAt, new Date(startDate as string)));
    }
    if (endDate) {
      dateConditions.push(lte(kycVerifications.createdAt, new Date(endDate as string)));
    }

    // Compliance metrics
    const complianceData = await db.select({
      status: kycVerifications.status,
      verificationType: kycVerifications.verificationType,
      documentType: kycVerifications.documentType,
      documentCountry: kycVerifications.documentCountry,
      riskLevel: kycVerifications.riskLevel,
      verificationMethod: kycVerifications.verificationMethod,
      count: count()
    })
    .from(kycVerifications)
    .where(dateConditions.length > 0 ? and(...dateConditions) : undefined)
    .groupBy(
      kycVerifications.status,
      kycVerifications.verificationType,
      kycVerifications.documentType,
      kycVerifications.documentCountry,
      kycVerifications.riskLevel,
      kycVerifications.verificationMethod
    );

    // Average processing times
    const processingTimes = await db.select({
      avgProcessingHours: sql`AVG(EXTRACT(EPOCH FROM (verified_at - submitted_at))/3600)`.as('avgProcessingHours')
    })
    .from(kycVerifications)
    .where(and(
      eq(kycVerifications.status, "verified"),
      ...(dateConditions.length > 0 ? dateConditions : [])
    ));

    res.json({
      complianceData,
      averageProcessingHours: processingTimes[0]?.avgProcessingHours || 0,
      reportPeriod: {
        startDate: startDate || null,
        endDate: endDate || null,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("KYC compliance report error:", error);
    res.status(500).json({ error: "Failed to generate compliance report" });
  }
});

export default router;