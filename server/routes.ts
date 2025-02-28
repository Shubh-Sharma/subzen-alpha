import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertSubscriptionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Subscriptions CRUD
  app.get("/api/subscriptions", async (req, res) => {
    if (!req.userId) return res.sendStatus(401);
    const subs = await storage.getSubscriptionsByUser(req.userId);
    res.json(subs);
  });

  app.post("/api/subscriptions", async (req, res) => {
    if (!req.userId) return res.sendStatus(401);
    const data = insertSubscriptionSchema.parse(req.body);
    const sub = await storage.createSubscription(req.userId, data);
    res.status(201).json(sub);
  });

  app.patch("/api/subscriptions/:id", async (req, res) => {
    if (!req.userId) return res.sendStatus(401);
    const data = insertSubscriptionSchema.parse(req.body);
    const sub = await storage.updateSubscription(parseInt(req.params.id), data);
    if (!sub) return res.sendStatus(404);
    res.json(sub);
  });

  app.delete("/api/subscriptions/:id", async (req, res) => {
    if (!req.userId) return res.sendStatus(401);
    await storage.deleteSubscription(parseInt(req.params.id));
    res.sendStatus(204);
  });

  app.patch("/api/subscriptions/:id/pause", async (req, res) => {
    if (!req.userId) return res.sendStatus(401);
    const sub = await storage.togglePauseSubscription(parseInt(req.params.id));
    if (!sub) return res.sendStatus(404);
    res.json(sub);
  });

  const httpServer = createServer(app);
  return httpServer;
}