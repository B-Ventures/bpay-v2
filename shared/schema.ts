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
  type: varchar("type").notNull(), // credit_card, debit_card, bank_account
  last4: varchar("last4").notNull(),
  expiryMonth: integer("expiry_month"),
  expiryYear: integer("expiry_year"),
  brand: varchar("brand"), // visa, mastercard, etc.
  isActive: boolean("is_active").default(true),
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
export const usersRelations = relations(users, ({ many }) => ({
  fundingSources: many(fundingSources),
  virtualCards: many(virtualCards),
  transactions: many(transactions),
  merchants: many(merchants),
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
  user: one(users, {
    fields: [merchants.userId],
    references: [users.id],
  }),
  paymentIntents: many(paymentIntents),
  webhookEvents: many(webhookEvents),
  apiUsage: many(merchantApiUsage),
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
