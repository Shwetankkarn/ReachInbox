
import { redis } from "../lib/redis";

const RESERVE_SLOT_SCRIPT = `
local now = tonumber(ARGV[1])
local interval = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local jobId = ARGV[4]
local window = 3600000

local key = KEYS[1]
local nextKey = KEYS[2]

redis.call("ZREMRANGEBYSCORE", key, "-inf", now - window)

local existing = redis.call("ZSCORE", key, jobId)
if existing then
  local at = tonumber(existing)
  if at > now then return {0, at} end
  return {1, at}
end

local nextAt = tonumber(redis.call("GET", nextKey) or "0")
local candidate = math.max(now, nextAt)

while true do
  local count = redis.call(
    "ZCOUNT", key,
    "(" .. tostring(candidate - window),
    tostring(candidate)
  )

  if count < limit then break end

  local oldest = redis.call(
    "ZRANGEBYSCORE", key,
    "(" .. tostring(candidate - window),
    tostring(candidate),
    "WITHSCORES",
    "LIMIT", 0, 1
  )

  if not oldest[2] then
    candidate = candidate + 1000
  else
    candidate = math.max(candidate, tonumber(oldest[2]) + window + 1)
  end
end

redis.call("ZADD", key, candidate, jobId)

local ttl = window + interval + 60000
redis.call("PEXPIRE", key, ttl)
redis.call("SET", nextKey, candidate + interval, "PX", ttl)

if candidate > now then return {0, candidate} end
return {1, candidate}
`;

function readInt(name: string, fallback: number, minimum: number) {
  const raw = process.env[name];
  if (!raw || !raw.trim()) return fallback;

  const value = Number(raw);
  if (!Number.isFinite(value) || value < minimum) return fallback;

  return Math.floor(value);
}

export async function reserveEmailSendSlot(
  reservationId: string,
  userId: string,
  requestedHourlyLimit: number
) {
  const interval = readInt("MIN_SEND_INTERVAL_MS", 5000, 0);
  const globalLimit = readInt("HOURLY_EMAIL_LIMIT", 100, 1);

  const requestedLimit =
    Number.isInteger(requestedHourlyLimit) && requestedHourlyLimit >= 1
      ? requestedHourlyLimit
      : globalLimit;

  const limit = Math.min(requestedLimit, globalLimit);

  const result = (await redis.eval(
    RESERVE_SLOT_SCRIPT,
    2,
    `email-scheduler:hourly-reservations:${userId}`,
    "email-scheduler:next-send-at",
    String(Date.now()),
    String(interval),
    String(limit),
    reservationId
  )) as [number | string, number | string];

  const reservation = {
    allowed: Number(result[0]) === 1,
    allowedAt: Number(result[1]),
  };

  console.log(
    `[RateLimiter] limit=${limit}/hour, job=${reservationId}, ` +
    `allowed=${reservation.allowed}, ` +
    `allowedAt=${new Date(reservation.allowedAt).toISOString()}`
  );

  return reservation;
}
