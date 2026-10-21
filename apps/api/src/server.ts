
import "dotenv/config";
import "./workers/email.worker";

import express from "express";
import cors from "cors";
import session from "express-session";
import { RedisStore } from "connect-redis";
import passport from "passport";

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

import { prisma } from "./lib/prisma";
import { redis } from "./lib/redis";
import { sessionRedis } from "./lib/sessionRedis";
import emailRoutes from "./routes/email.routes";
import authRoutes from "./routes/auth.routes";
import { emailQueue, EMAIL_QUEUE_NAME } from "./queues/email.queue";

const app = express();
app.set("trust proxy", 1);
const PORT = Number(process.env.PORT) || 3000;

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter,
});

app.use(
  cors({
    origin: [process.env.FRONTEND_URL, "http://localhost:5173", "http://localhost:5174"].filter((origin): origin is string => Boolean(origin)),
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    store: new RedisStore({ client: sessionRedis }),
    secret: process.env.SESSION_SECRET || "local-dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);
app.use("/api/emails", emailRoutes);

// Health checks
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "ReachInbox API is running",
  });
});

app.get("/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      message: "PostgreSQL connection successful",
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.get("/health/redis", async (_req, res) => {
  try {
    const result = await redis.ping();
    res.status(200).json({
      success: result === "PONG",
      message: "Redis connection successful",
    });
  } catch (error) {
    console.error("Redis health check failed:", error);
    res.status(500).json({
      success: false,
      message: "Redis connection failed",
    });
  }
});

app.get("/health/queue", async (_req, res) => {
  try {
    const waiting = await emailQueue.getWaitingCount();
    const delayed = await emailQueue.getDelayedCount();

    res.status(200).json({
      success: true,
      queue: EMAIL_QUEUE_NAME,
      waiting,
      delayed,
    });
  } catch (error) {
    console.error("Queue health check failed:", error);
    res.status(500).json({
      success: false,
      message: "Queue connection failed",
    });
  }
});

// Protect Bull Board with an authenticated session.
app.use("/admin/queues", (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.status(401).send("Unauthorized: Please log in first.");
});

app.use("/admin/queues", serverAdapter.getRouter());

async function startServer() {
  await sessionRedis.connect();

  app.listen(PORT, () => {
    console.log(`ReachInbox API running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
