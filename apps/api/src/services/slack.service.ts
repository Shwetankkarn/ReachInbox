import { randomBytes } from "node:crypto";
import { redis } from "../lib/redis";

const STATE_PREFIX = "slack:oauth:state:";
const TOKEN_KEY = "slack:bot-token";

export function createSlackOAuthState(): string {
  return randomBytes(32).toString("hex");
}

export async function saveSlackOAuthState(state: string): Promise<void> {
  await redis.set(`${STATE_PREFIX}${state}`, "1", "EX", 600);
}

export async function consumeSlackOAuthState(state: string): Promise<boolean> {
  const result = await redis.eval(
    'local v = redis.call("GET", KEYS[1]); if v then redis.call("DEL", KEYS[1]); return v end; return nil',
    1,
    `${STATE_PREFIX}${state}`
  );
  return result === "1";
}

export async function exchangeSlackOAuthCode(code: string): Promise<void> {
  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const redirectUri = process.env.SLACK_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Slack OAuth environment variables are missing");
  }

  const response = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  const result = await response.json() as {
    ok?: boolean;
    error?: string;
    access_token?: string;
  };

  if (!response.ok || !result.ok || !result.access_token) {
    throw new Error(`Slack OAuth failed: ${result.error || response.status}`);
  }

  await redis.set(TOKEN_KEY, result.access_token);
}

export async function notifySlackRateLimit(
  userId: string,
  allowedAt: number
): Promise<void> {
  const channel = process.env.SLACK_CHANNEL_ID;
  const token = (await redis.get(TOKEN_KEY)) || process.env.SLACK_BOT_TOKEN;

  if (!channel || !token) {
    console.warn("[Slack] Missing channel ID or bot token");
    return;
  }

  const cooldownKey = `slack:rate-limit-alert:${userId}`;
  const firstAlert = await redis.set(cooldownKey, "1", "EX", 3600, "NX");
  if (firstAlert !== "OK") return;

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      channel,
      text: `ReachInbox rate limit reached for user ${userId}. Next available send time: ${new Date(allowedAt).toISOString()}.`,
    }),
  });

  const result = await response.json() as { ok?: boolean; error?: string };

  if (!response.ok || !result.ok) {
    await redis.del(cooldownKey);
    throw new Error(`Slack notification failed: ${result.error || response.status}`);
  }

  console.log(`[Slack] Rate-limit notification sent for user ${userId}`);
}
