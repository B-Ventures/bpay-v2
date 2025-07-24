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
  apiKey: varchar("api_key").notNull(),
  isActive: boolean("is_active").default(true),
  totalVolume: decimal("total_volume", { precision: 15, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const merchantsRelations = relations(merchants, ({ one }) => ({
  user: one(users, {
    fields: [merchants.userId],
    references: [users.id],
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
