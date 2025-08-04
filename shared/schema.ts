import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  decimal,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phoneNumber: varchar("phone_number"),
  address: jsonb("address"), // For Stripe Issuing cardholder creation
  role: varchar("role").default("user"), // user, merchant, admin
  subscriptionTier: varchar("subscription_tier").default("free"), // free, pro, premium
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  country: varchar("country"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Funding sources (credit cards, bank accounts, etc.)
export const fundingSources = pgTable("funding_sources", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  cardholderName: varchar("cardholder_name").notNull(), // Name on the card/account for verification
  type: varchar("type").notNull(), // credit_card, debit_card, bank_account
  last4: varchar("last4").notNull(),
  expiryMonth: integer("expiry_month"),
  expiryYear: integer("expiry_year"),
  brand: varchar("brand"), // visa, mastercard, etc.
  isActive: boolean("is_active").default(true),
  isNameVerified: boolean("is_name_verified").default(false), // Security check for name matching
  balance: decimal("balance", { precision: 10, scale: 2 }).default("100.00"), // Mock balance for testing
  defaultSplitPercentage: decimal("default_split_percentage", { precision: 5, scale: 2 }).default("0"),
  stripePaymentMethodId: varchar("stripe_payment_method_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Virtual cards
export const virtualCards = pgTable("virtual_cards", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  cardNumber: varchar("card_number").notNull(),
  expiryMonth: integer("expiry_month").notNull(),
  expiryYear: integer("expiry_year").notNull(),
  cvv: varchar("cvv").notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0"),
  status: varchar("status").default("active"), // active, suspended, expired
  stripeCardId: varchar("stripe_card_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  virtualCardId: integer("virtual_card_id").references(() => virtualCards.id),
  merchant: varchar("merchant").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("USD"),
  status: varchar("status").default("pending"), // pending, completed, failed
  splits: jsonb("splits"), // Array of funding source splits
  fees: decimal("fees", { precision: 10, scale: 2 }).default("0"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Merchants
export const merchants = pgTable("merchants", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  businessName: varchar("business_name").notNull(),
  businessEmail: varchar("business_email").notNull(),
  website: varchar("website"),
  publicApiKey: varchar("public_api_key").notNull(), // pk_test_ or pk_live_
  secretApiKey: varchar("secret_api_key").notNull(), // sk_test_ or sk_live_
  webhookSecret: varchar("webhook_secret").notNull(),
  isActive: boolean("is_active").default(true),
  totalVolume: decimal("total_volume", { precision: 15, scale: 2 }).default("0"),
  environment: varchar("environment").default("sandbox"), // sandbox, production
  platformType: varchar("platform_type"), // wordpress, shopify, custom, etc.
  allowedDomains: text("allowed_domains").array(), // CORS domains
  rateLimits: jsonb("rate_limits"), // API rate limiting config
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Merchant API Keys (for tracking usage and rate limiting)
export const merchantApiUsage = pgTable("merchant_api_usage", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").references(() => merchants.id).notNull(),
  endpoint: varchar("endpoint").notNull(),
  method: varchar("method").notNull(),
  requestCount: integer("request_count").default(1),
  lastUsed: timestamp("last_used").defaultNow(),
  date: varchar("date").notNull(), // YYYY-MM-DD for daily tracking
});

// Subscription packages and tiers
export const subscriptionTiers = pgTable("subscription_tiers", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(), // Free, Pro, Premium
  displayName: varchar("display_name").notNull(),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  transactionFeeRate: decimal("transaction_fee_rate", { precision: 5, scale: 4 }).notNull(), // 0.029 = 2.9%
  features: jsonb("features"), // Array of feature flags
  limits: jsonb("limits"), // API limits, funding source limits, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User subscriptions
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  tierId: integer("tier_id").references(() => subscriptionTiers.id).notNull(),
  status: varchar("status").default("active"), // active, cancelled, expired, suspended
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// KYC verification data - Enhanced for Stripe Identity compliance
export const kycVerifications = pgTable("kyc_verifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  verificationType: varchar("verification_type").notNull(), // identity_document, selfie, address, business_verification
  status: varchar("status").default("pending"), // pending, requires_input, processing, verified, failed, canceled
  stripeVerificationSessionId: varchar("stripe_verification_session_id"),
  stripeVerificationReportId: varchar("stripe_verification_report_id"),
  documentType: varchar("document_type"), // passport, driving_license, id_card
  documentCountry: varchar("document_country"), // Issuing country of document
  documentNumber: varchar("document_number"),
  documentUrls: text("document_urls").array(), // Array of uploaded document URLs
  verificationMethod: varchar("verification_method"), // stripe_identity, manual_review, automated
  riskScore: integer("risk_score"), // 0-100 risk assessment from Stripe
  riskLevel: varchar("risk_level"), // low, medium, high
  extractedData: jsonb("extracted_data"), // firstName, lastName, dob, address from document
  verificationChecks: jsonb("verification_checks"), // document_front, document_back, selfie results
  errorCode: varchar("error_code"), // document_expired, document_unreadable, selfie_failed
  errorMessage: text("error_message"),
  notes: text("notes"),
  adminNotes: text("admin_notes"), // Admin review notes
  reviewedBy: varchar("reviewed_by"), // Admin user ID who reviewed
  reviewedAt: timestamp("reviewed_at"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment vendors configuration
export const paymentVendors = pgTable("payment_vendors", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(), // stripe, paypal, etc.
  displayName: varchar("display_name").notNull(),
  isActive: boolean("is_active").default(true),
  capabilities: text("capabilities").array(), // payment_processing, card_issuing, etc.
  configuration: jsonb("configuration"), // API keys, settings
  feeStructure: jsonb("fee_structure"), // Vendor's fee structure
  priority: integer("priority").default(0), // For failover ordering
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System revenue tracking
export const revenueEntries = pgTable("revenue_entries", {
  id: serial("id").primaryKey(),
  type: varchar("type").notNull(), // subscription, transaction_fee, chargeback
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency").default("USD"),
  userId: varchar("user_id").references(() => users.id),
  merchantId: integer("merchant_id").references(() => merchants.id),
  transactionId: integer("transaction_id").references(() => transactions.id),
  subscriptionId: integer("subscription_id").references(() => userSubscriptions.id),
  metadata: jsonb("metadata"),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Funding pool tracking (where all funding sources deposit)
export const fundingPoolEntries = pgTable("funding_pool_entries", {
  id: serial("id").primaryKey(),
  type: varchar("type").notNull(), // deposit, withdrawal, bcard_generation
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency").default("USD"),
  sourceType: varchar("source_type"), // funding_source, vendor_settlement
  sourceId: varchar("source_id"), // ID of funding source or vendor
  bcardId: varchar("bcard_id"), // If related to bcard generation
  status: varchar("status").default("pending"), // pending, completed, failed
  vendorTransactionId: varchar("vendor_transaction_id"), // Stripe PI ID, etc.
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// bcard generation attempts tracking
export const bcardGenerationAttempts = pgTable("bcard_generation_attempts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  merchantId: integer("merchant_id").references(() => merchants.id),
  requestedAmount: decimal("requested_amount", { precision: 10, scale: 2 }).notNull(),
  actualAmount: decimal("actual_amount", { precision: 10, scale: 2 }),
  currency: varchar("currency").default("USD"),
  splitConfiguration: jsonb("split_configuration"), // Funding sources and percentages
  status: varchar("status").default("pending"), // pending, completed, failed, partial
  bcardId: varchar("bcard_id"), // Generated bcard ID if successful
  errorMessage: text("error_message"),
  vendorUsed: varchar("vendor_used"), // stripe, paypal, etc.
  processingTimeMs: integer("processing_time_ms"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Funding source deduction attempts
export const fundingDeductionAttempts = pgTable("funding_deduction_attempts", {
  id: serial("id").primaryKey(),
  bcardGenerationId: integer("bcard_generation_id").references(() => bcardGenerationAttempts.id).notNull(),
  fundingSourceId: integer("funding_source_id").references(() => fundingSources.id).notNull(),
  attemptedAmount: decimal("attempted_amount", { precision: 10, scale: 2 }).notNull(),
  actualAmount: decimal("actual_amount", { precision: 10, scale: 2 }),
  currency: varchar("currency").default("USD"),
  status: varchar("status").default("pending"), // pending, completed, failed
  vendorTransactionId: varchar("vendor_transaction_id"), // Stripe PI ID
  errorCode: varchar("error_code"),
  errorMessage: text("error_message"),
  processingTimeMs: integer("processing_time_ms"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment Intents (for merchant payment processing)
export const paymentIntents = pgTable("payment_intents", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").references(() => merchants.id).notNull(),
  intentId: varchar("intent_id").notNull().unique(), // pi_xxxx
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("USD"),
  status: varchar("status").default("requires_payment_method"), // Stripe statuses
  clientSecret: varchar("client_secret").notNull(),
  metadata: jsonb("metadata"), // merchant-defined metadata
  customerInfo: jsonb("customer_info"), // customer details
  splitConfiguration: jsonb("split_configuration"), // how payment will be split
  bcardId: integer("bcard_id").references(() => virtualCards.id),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Webhook Events (for merchant notifications)
export const webhookEvents = pgTable("webhook_events", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").references(() => merchants.id).notNull(),
  eventType: varchar("event_type").notNull(), // payment.succeeded, payment.failed, etc.
  eventData: jsonb("event_data").notNull(),
  deliveryStatus: varchar("delivery_status").default("pending"), // pending, delivered, failed
  deliveryAttempts: integer("delivery_attempts").default(0),
  webhookUrl: varchar("webhook_url").notNull(),
  nextRetryAt: timestamp("next_retry_at"),
  createdAt: timestamp("created_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  fundingSources: many(fundingSources),
  virtualCards: many(virtualCards),
  transactions: many(transactions),
  merchants: many(merchants),
  subscription: one(userSubscriptions),
  kycVerification: one(kycVerifications),
}));

export const fundingSourcesRelations = relations(fundingSources, ({ one }) => ({
  user: one(users, {
    fields: [fundingSources.userId],
    references: [users.id],
  }),
}));

export const virtualCardsRelations = relations(virtualCards, ({ one, many }) => ({
  user: one(users, {
    fields: [virtualCards.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  virtualCard: one(virtualCards, {
    fields: [transactions.virtualCardId],
    references: [virtualCards.id],
  }),
}));

export const merchantsRelations = relations(merchants, ({ one, many }) => ({
  user: one(users, { fields: [merchants.userId], references: [users.id] }),
  paymentIntents: many(paymentIntents),
  webhookEvents: many(webhookEvents),
  apiUsage: many(merchantApiUsage),
  revenueEntries: many(revenueEntries),
}));

export const subscriptionTiersRelations = relations(subscriptionTiers, ({ many }) => ({
  subscriptions: many(userSubscriptions),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, { fields: [userSubscriptions.userId], references: [users.id] }),
  tier: one(subscriptionTiers, { fields: [userSubscriptions.tierId], references: [subscriptionTiers.id] }),
}));

export const paymentIntentsRelations = relations(paymentIntents, ({ one }) => ({
  merchant: one(merchants, {
    fields: [paymentIntents.merchantId],
    references: [merchants.id],
  }),
  bcard: one(virtualCards, {
    fields: [paymentIntents.bcardId],
    references: [virtualCards.id],
  }),
}));

export const webhookEventsRelations = relations(webhookEvents, ({ one }) => ({
  merchant: one(merchants, {
    fields: [webhookEvents.merchantId],
    references: [merchants.id],
  }),
}));

export const merchantApiUsageRelations = relations(merchantApiUsage, ({ one }) => ({
  merchant: one(merchants, {
    fields: [merchantApiUsage.merchantId],
    references: [merchants.id],
  }),
}));

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertFundingSourceSchema = createInsertSchema(fundingSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertFundingSource = z.infer<typeof insertFundingSourceSchema>;
export type FundingSource = typeof fundingSources.$inferSelect;

// Add subscription tier benefits API endpoint schema
export const subscriptionBenefitsSchema = z.object({
  tier: z.enum(['free', 'pro', 'premium']),
});

export const insertVirtualCardSchema = createInsertSchema(virtualCards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertVirtualCard = z.infer<typeof insertVirtualCardSchema>;
export type VirtualCard = typeof virtualCards.$inferSelect;

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;


export const insertMerchantSchema = createInsertSchema(merchants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMerchant = z.infer<typeof insertMerchantSchema>;
export type Merchant = typeof merchants.$inferSelect;

export const insertPaymentIntentSchema = createInsertSchema(paymentIntents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPaymentIntent = z.infer<typeof insertPaymentIntentSchema>;
export type PaymentIntent = typeof paymentIntents.$inferSelect;

export const insertWebhookEventSchema = createInsertSchema(webhookEvents).omit({
  id: true,
  createdAt: true,
  deliveredAt: true,
});
export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;
export type WebhookEvent = typeof webhookEvents.$inferSelect;

export const insertMerchantApiUsageSchema = createInsertSchema(merchantApiUsage).omit({
  id: true,
  lastUsed: true,
});
export type InsertMerchantApiUsage = z.infer<typeof insertMerchantApiUsageSchema>;
export type MerchantApiUsage = typeof merchantApiUsage.$inferSelect;

// Admin Schema Types and Schemas
export type SubscriptionTier = typeof subscriptionTiers.$inferSelect;
export type InsertSubscriptionTier = typeof subscriptionTiers.$inferInsert;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;
export type KycVerification = typeof kycVerifications.$inferSelect;
export type InsertKycVerification = typeof kycVerifications.$inferInsert;
export type PaymentVendor = typeof paymentVendors.$inferSelect;
export type InsertPaymentVendor = typeof paymentVendors.$inferInsert;
export type RevenueEntry = typeof revenueEntries.$inferSelect;
export type InsertRevenueEntry = typeof revenueEntries.$inferInsert;
export type FundingPoolEntry = typeof fundingPoolEntries.$inferSelect;
export type InsertFundingPoolEntry = typeof fundingPoolEntries.$inferInsert;
export type BcardGenerationAttempt = typeof bcardGenerationAttempts.$inferSelect;
export type InsertBcardGenerationAttempt = typeof bcardGenerationAttempts.$inferInsert;
export type FundingDeductionAttempt = typeof fundingDeductionAttempts.$inferSelect;
export type InsertFundingDeductionAttempt = typeof fundingDeductionAttempts.$inferInsert;

// Admin Zod Schemas
export const insertSubscriptionTierSchema = createInsertSchema(subscriptionTiers);
export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions);
export const insertKycVerificationSchema = createInsertSchema(kycVerifications);
export const insertPaymentVendorSchema = createInsertSchema(paymentVendors);
export const insertRevenueEntrySchema = createInsertSchema(revenueEntries);
export const insertFundingPoolEntrySchema = createInsertSchema(fundingPoolEntries);
export const insertBcardGenerationAttemptSchema = createInsertSchema(bcardGenerationAttempts);
export const insertFundingDeductionAttemptSchema = createInsertSchema(fundingDeductionAttempts);
