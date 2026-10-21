
import { createClient } from "redis";

export const sessionRedis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

sessionRedis.on("error", (error) => {
  console.error("Session Redis error:", error);
});
