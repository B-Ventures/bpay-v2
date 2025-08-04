import {
  users,
  fundingSources,
  virtualCards,
  transactions,
  merchants,
  paymentIntents,
  webhookEvents,
  merchantApiUsage,
  type User,
  type UpsertUser,
  type FundingSource,
  type InsertFundingSource,
  type VirtualCard,
  type InsertVirtualCard,
  type Transaction,
  type InsertTransaction,
  type Merchant,
  type InsertMerchant,
  type PaymentIntent,
  type InsertPaymentIntent,
  type WebhookEvent,
  type InsertWebhookEvent,
  type MerchantApiUsage,
  type InsertMerchantApiUsage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(userId: string, profileData: Partial<User>): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  
  // Funding sources
  getFundingSourcesByUserId(userId: string): Promise<FundingSource[]>;
  createFundingSource(source: InsertFundingSource): Promise<FundingSource>;
  updateFundingSource(id: number, updates: Partial<InsertFundingSource>): Promise<FundingSource>;
  deleteFundingSource(id: number): Promise<void>;
  
  // Virtual cards
  getVirtualCardsByUserId(userId: string): Promise<VirtualCard[]>;
  createVirtualCard(card: InsertVirtualCard): Promise<VirtualCard>;
  updateVirtualCard(id: number, updates: Partial<InsertVirtualCard>): Promise<VirtualCard>;
  deleteVirtualCard(id: number): Promise<void>;
  
  // Transactions
  getTransactionsByUserId(userId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, updates: Partial<InsertTransaction>): Promise<Transaction>;
  
  // Merchants
  getMerchantsByUserId(userId: string): Promise<Merchant[]>;
  getMerchantByApiKey(apiKey: string): Promise<Merchant | undefined>;
  createMerchant(merchant: InsertMerchant): Promise<Merchant>;
  updateMerchant(id: number, updates: Partial<InsertMerchant>): Promise<Merchant>;
  
  // Payment Intents
  getPaymentIntentsByMerchantId(merchantId: number): Promise<PaymentIntent[]>;
  getPaymentIntentByIntentId(intentId: string): Promise<PaymentIntent | undefined>;
  createPaymentIntent(intent: InsertPaymentIntent): Promise<PaymentIntent>;
  updatePaymentIntent(id: number, updates: Partial<InsertPaymentIntent>): Promise<PaymentIntent>;
  
  // Webhook Events
  getWebhookEventsByMerchantId(merchantId: number): Promise<WebhookEvent[]>;
  createWebhookEvent(event: InsertWebhookEvent): Promise<WebhookEvent>;
  updateWebhookEvent(id: number, updates: Partial<InsertWebhookEvent>): Promise<WebhookEvent>;
  getPendingWebhookEvents(): Promise<WebhookEvent[]>;
  
  // API Usage Tracking
  trackApiUsage(usage: InsertMerchantApiUsage): Promise<MerchantApiUsage>;
  getApiUsage(merchantId: number, date: string): Promise<MerchantApiUsage[]>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  getAllTransactions(): Promise<Transaction[]>;
  getAllMerchants(): Promise<Merchant[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserProfile(userId: string, profileData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...profileData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Funding sources
  async getFundingSourcesByUserId(userId: string): Promise<FundingSource[]> {
    return await db
      .select()
      .from(fundingSources)
      .where(eq(fundingSources.userId, userId))
      .orderBy(desc(fundingSources.createdAt));
  }

  async createFundingSource(source: InsertFundingSource): Promise<FundingSource> {
    const [newSource] = await db
      .insert(fundingSources)
      .values(source)
      .returning();
    return newSource;
  }

  async updateFundingSource(id: number, updates: Partial<InsertFundingSource>): Promise<FundingSource> {
    const [updatedSource] = await db
      .update(fundingSources)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(fundingSources.id, id))
      .returning();
    return updatedSource;
  }

  async deleteFundingSource(id: number): Promise<void> {
    await db.delete(fundingSources).where(eq(fundingSources.id, id));
  }

  // Virtual cards
  async getVirtualCardsByUserId(userId: string): Promise<VirtualCard[]> {
    return await db
      .select()
      .from(virtualCards)
      .where(eq(virtualCards.userId, userId))
      .orderBy(desc(virtualCards.createdAt));
  }

  async createVirtualCard(card: InsertVirtualCard): Promise<VirtualCard> {
    const [newCard] = await db
      .insert(virtualCards)
      .values(card)
      .returning();
    return newCard;
  }

  async updateVirtualCard(id: number, updates: Partial<InsertVirtualCard>): Promise<VirtualCard> {
    const [updatedCard] = await db
      .update(virtualCards)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(virtualCards.id, id))
      .returning();
    return updatedCard;
  }

  async deleteVirtualCard(id: number): Promise<void> {
    await db.delete(virtualCards).where(eq(virtualCards.id, id));
  }

  // Transactions
  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async updateTransaction(id: number, updates: Partial<InsertTransaction>): Promise<Transaction> {
    const [updatedTransaction] = await db
      .update(transactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return updatedTransaction;
  }

  // Merchants
  async getMerchantsByUserId(userId: string): Promise<Merchant[]> {
    return await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, userId))
      .orderBy(desc(merchants.createdAt));
  }

  async createMerchant(merchant: InsertMerchant): Promise<Merchant> {
    const [newMerchant] = await db
      .insert(merchants)
      .values(merchant)
      .returning();
    return newMerchant;
  }

  async updateMerchant(id: number, updates: Partial<InsertMerchant>): Promise<Merchant> {
    const [updatedMerchant] = await db
      .update(merchants)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(merchants.id, id))
      .returning();
    return updatedMerchant;
  }

  async getMerchantByApiKey(apiKey: string): Promise<Merchant | undefined> {
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.secretApiKey, apiKey));
    return merchant;
  }

  // Payment Intents
  async getPaymentIntentsByMerchantId(merchantId: number): Promise<PaymentIntent[]> {
    return await db
      .select()
      .from(paymentIntents)
      .where(eq(paymentIntents.merchantId, merchantId))
      .orderBy(desc(paymentIntents.createdAt));
  }

  async getPaymentIntentByIntentId(intentId: string): Promise<PaymentIntent | undefined> {
    const [intent] = await db
      .select()
      .from(paymentIntents)
      .where(eq(paymentIntents.intentId, intentId));
    return intent;
  }

  async createPaymentIntent(intent: InsertPaymentIntent): Promise<PaymentIntent> {
    const [newIntent] = await db
      .insert(paymentIntents)
      .values(intent)
      .returning();
    return newIntent;
  }

  async updatePaymentIntent(id: number, updates: Partial<InsertPaymentIntent>): Promise<PaymentIntent> {
    const [updatedIntent] = await db
      .update(paymentIntents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(paymentIntents.id, id))
      .returning();
    return updatedIntent;
  }

  // Webhook Events
  async getWebhookEventsByMerchantId(merchantId: number): Promise<WebhookEvent[]> {
    return await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.merchantId, merchantId))
      .orderBy(desc(webhookEvents.createdAt));
  }

  async createWebhookEvent(event: InsertWebhookEvent): Promise<WebhookEvent> {
    const [newEvent] = await db
      .insert(webhookEvents)
      .values(event)
      .returning();
    return newEvent;
  }

  async updateWebhookEvent(id: number, updates: Partial<InsertWebhookEvent>): Promise<WebhookEvent> {
    const [updatedEvent] = await db
      .update(webhookEvents)
      .set(updates)
      .where(eq(webhookEvents.id, id))
      .returning();
    return updatedEvent;
  }

  async getPendingWebhookEvents(): Promise<WebhookEvent[]> {
    return await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.deliveryStatus, 'pending'))
      .orderBy(desc(webhookEvents.createdAt));
  }

  // API Usage Tracking
  async trackApiUsage(usage: InsertMerchantApiUsage): Promise<MerchantApiUsage> {
    // Check if usage for this merchant/endpoint/date already exists
    const [existingUsage] = await db
      .select()
      .from(merchantApiUsage)
      .where(
        and(
          eq(merchantApiUsage.merchantId, usage.merchantId),
          eq(merchantApiUsage.endpoint, usage.endpoint),
          eq(merchantApiUsage.method, usage.method),
          eq(merchantApiUsage.date, usage.date)
        )
      );

    if (existingUsage) {
      // Update existing record
      const [updatedUsage] = await db
        .update(merchantApiUsage)
        .set({
          requestCount: (existingUsage.requestCount || 0) + (usage.requestCount || 1),
          lastUsed: new Date()
        })
        .where(eq(merchantApiUsage.id, existingUsage.id))
        .returning();
      return updatedUsage;
    } else {
      // Create new record
      const [newUsage] = await db
        .insert(merchantApiUsage)
        .values(usage)
        .returning();
      return newUsage;
    }
  }

  async getApiUsage(merchantId: number, date: string): Promise<MerchantApiUsage[]> {
    return await db
      .select()
      .from(merchantApiUsage)
      .where(
        and(
          eq(merchantApiUsage.merchantId, merchantId),
          eq(merchantApiUsage.date, date)
        )
      );
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  async getAllMerchants(): Promise<Merchant[]> {
    return await db.select().from(merchants).orderBy(desc(merchants.createdAt));
  }
}

export const storage = new DatabaseStorage();
