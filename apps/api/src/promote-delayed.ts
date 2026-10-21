
import "dotenv/config";
import { emailQueue } from "./queues/email.queue";
import { redis } from "./lib/redis";

async function main() {
  try {
    const jobs = await emailQueue.getDelayed(0, 9);

    for (const job of jobs) {
      const state = await job.getState();

      if (state !== "delayed") continue;

      await job.changeDelay(0);
      console.log(`Made eligible: ${job.id}`);
    }
  } finally {
    await emailQueue.close();
    await redis.quit();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
