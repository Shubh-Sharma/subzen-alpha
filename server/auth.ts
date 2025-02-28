import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, Subscription } from "@shared/schema";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, cert } from "firebase-admin/app";

// Debug log for environment variables (without exposing sensitive data)
console.log('Firebase Admin Config Check:', {
  projectId: process.env.FIREBASE_PROJECT_ID ? 'Present' : 'Missing',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'Present' : 'Missing',
  privateKey: process.env.FIREBASE_PRIVATE_KEY ? 'Present' : 'Missing'
});

// Initialize Firebase Admin
try {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
  throw error;
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
    interface Request {
      userId?: string;
      subscription?: Subscription;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Middleware to verify Firebase token
  app.use(async (req, res, next) => {
    // Skip auth check for non-API routes
    if (!req.path.startsWith('/api')) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await getAuth().verifyIdToken(token);
      req.userId = decodedToken.uid;

      // Check if user exists in our storage, if not create them
      const user = await storage.getUser(decodedToken.uid);
      if (!user) {
        await storage.createUser(decodedToken.uid, decodedToken.email || '');
      }

      next();
    } catch (error) {
      console.error('Auth Error:', error);
      res.status(401).json({ error: 'Unauthorized' });
    }
  });

  app.get("/api/user", async (req, res) => {
    if (!req.userId) return res.sendStatus(401);
    const user = await storage.getUser(req.userId);
    if (!user) return res.sendStatus(401);
    return res.json(user);
  });
}