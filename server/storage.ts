import {
  users,
  fundingSources,
  virtualCards,
  transactions,
  merchants,
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
  createMerchant(merchant: InsertMerchant): Promise<Merchant>;
  updateMerchant(id: number, updates: Partial<InsertMerchant>): Promise<Merchant>;
  
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
