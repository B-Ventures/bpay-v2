import { Router } from "express";
import { eq, desc, count, sum, and, gte, lte, like } from "drizzle-orm";
import { db } from "./db";
import { 
  users, merchants, userSubscriptions, subscriptionTiers, kycVerifications,
  paymentVendors, revenueEntries, fundingPoolEntries, bcardGenerationAttempts,
  fundingDeductionAttempts, transactions, fundingSources,
  insertSubscriptionTierSchema, insertKycVerificationSchema, insertPaymentVendorSchema
} from "@shared/schema";
import { z } from "zod";
import jwt from "jsonwebtoken";

const router = Router();

// Admin credentials - In production, store these securely
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || "bpay_admin",
  password: process.env.ADMIN_PASSWORD || "admin123!",
  accessCode: process.env.ADMIN_ACCESS_CODE || "BPAY2025"
};

const JWT_SECRET = process.env.JWT_SECRET || "bpay_admin_secret_key_2025";

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
router.get("/subscription-tiers", async (req, res) => {
  try {
    const tiers = await db.select().from(subscriptionTiers);
    res.json({ tiers });
  } catch (error) {
    console.error("Subscription tiers fetch error:", error);
    res.status(500).json({ error: "Failed to fetch subscription tiers" });
  }
});

// Create or update subscription tier
router.post("/subscription-tiers", async (req, res) => {
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

// Get subscription analytics
router.get("/subscription-analytics", async (req, res) => {
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
        reviewedBy: req.admin.username,
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
router.get("/payment-vendors", async (req, res) => {
  try {
    const vendors = await db.select().from(paymentVendors).orderBy(paymentVendors.priority);
    res.json({ vendors });
  } catch (error) {
    console.error("Payment vendors fetch error:", error);
    res.status(500).json({ error: "Failed to fetch payment vendors" });
  }
});

// Add or update payment vendor
router.post("/payment-vendors", async (req, res) => {
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

// Toggle vendor activation
router.patch("/payment-vendors/:vendorId/toggle", async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const [vendor] = await db.select().from(paymentVendors).where(eq(paymentVendors.id, Number(vendorId)));
    
    await db.update(paymentVendors)
      .set({ isActive: !vendor.isActive })
      .where(eq(paymentVendors.id, Number(vendorId)));
    
    res.json({ success: true, message: "Vendor status updated" });
  } catch (error) {
    console.error("Vendor toggle error:", error);
    res.status(500).json({ error: "Failed to toggle vendor status" });
  }
});

// 5. REVENUE & ANALYTICS DASHBOARD

// Get comprehensive dashboard data
router.get("/dashboard", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Total revenue (subscriptions + transaction fees)
    const totalRevenue = await db.select({
      total: sum(revenueEntries.amount)
    }).from(revenueEntries);

    // Transaction volume
    const transactionVolume = await db.select({
      total: sum(transactions.amount)
    }).from(transactions);

    // Funding pool balance
    const fundingPoolBalance = await db.select({
      deposits: sum(fundingPoolEntries.amount)
    })
    .from(fundingPoolEntries)
    .where(eq(fundingPoolEntries.type, "deposit"));

    const fundingPoolWithdrawals = await db.select({
      withdrawals: sum(fundingPoolEntries.amount)
    })
    .from(fundingPoolEntries)
    .where(eq(fundingPoolEntries.type, "withdrawal"));

    // bcard generation statistics
    const bcardStats = await db.select({
      total: count(),
      successful: count(bcardGenerationAttempts.status),
    })
    .from(bcardGenerationAttempts);

    const successfulBcards = await db.select({
      count: count()
    })
    .from(bcardGenerationAttempts)
    .where(eq(bcardGenerationAttempts.status, "completed"));

    // Funding source deduction statistics
    const deductionStats = await db.select({
      total: count(),
      successful: count(fundingDeductionAttempts.status)
    })
    .from(fundingDeductionAttempts);

    const successfulDeductions = await db.select({
      count: count()
    })
    .from(fundingDeductionAttempts)
    .where(eq(fundingDeductionAttempts.status, "completed"));

    // User and merchant counts
    const userCount = await db.select({ count: count() }).from(users);
    const merchantCount = await db.select({ count: count() }).from(merchants);

    res.json({
      revenue: {
        total: Number(totalRevenue[0]?.total || 0),
      },
      transactions: {
        volume: Number(transactionVolume[0]?.total || 0),
      },
      fundingPool: {
        balance: Number(fundingPoolBalance[0]?.deposits || 0) - Number(fundingPoolWithdrawals[0]?.withdrawals || 0),
      },
      bcardGeneration: {
        total: bcardStats[0]?.total || 0,
        successful: successfulBcards[0]?.count || 0,
        successRate: bcardStats[0]?.total ? ((successfulBcards[0]?.count || 0) / bcardStats[0]?.total * 100) : 0,
      },
      fundingDeductions: {
        total: deductionStats[0]?.total || 0,
        successful: successfulDeductions[0]?.count || 0,
        successRate: deductionStats[0]?.total ? ((successfulDeductions[0]?.count || 0) / deductionStats[0]?.total * 100) : 0,
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

    if (status) {
      bcardQuery = bcardQuery.where(eq(bcardGenerationAttempts.status, status as string));
    }

    const generations = await bcardQuery
      .orderBy(desc(bcardGenerationAttempts.createdAt))
      .limit(Number(limit))
      .offset(offset);

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

    if (status) {
      deductionQuery = deductionQuery.where(eq(fundingDeductionAttempts.status, status as string));
    }

    const deductions = await deductionQuery
      .orderBy(desc(fundingDeductionAttempts.createdAt))
      .limit(Number(limit))
      .offset(offset);

    res.json({ deductions });
  } catch (error) {
    console.error("Funding deductions fetch error:", error);
    res.status(500).json({ error: "Failed to fetch funding deductions" });
  }
});

export default router;