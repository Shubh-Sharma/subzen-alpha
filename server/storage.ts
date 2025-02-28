import { IStorage } from "./storage";
import { User, Subscription, InsertSubscription } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private subscriptions: Map<number, Subscription>;
  private currentSubId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.subscriptions = new Map();
    this.currentSubId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(id: string, email: string): Promise<User> {
    const user: User = { id, email };
    this.users.set(id, user);
    return user;
  }

  async getSubscriptionsByUser(userId: string): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values()).filter(
      (sub) => sub.userId === userId,
    );
  }

  async createSubscription(userId: string, data: InsertSubscription): Promise<Subscription> {
    const id = this.currentSubId++;
    const sub: Subscription = { ...data, id, userId };
    this.subscriptions.set(id, sub);
    return sub;
  }

  async updateSubscription(id: number, data: InsertSubscription): Promise<Subscription | undefined> {
    const existing = this.subscriptions.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.subscriptions.set(id, updated);
    return updated;
  }

  async deleteSubscription(id: number): Promise<void> {
    this.subscriptions.delete(id);
  }

  async togglePauseSubscription(id: number): Promise<Subscription | undefined> {
    const existing = this.subscriptions.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, isPaused: !existing.isPaused };
    this.subscriptions.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();