const { Queue } = require("bullmq");
const IORedis = require("ioredis");

async function main() {
  const connection = new IORedis(
    process.env.REDIS_URL || "redis://localhost:6379",
    { maxRetriesPerRequest: null }
  );

  const queue = new Queue("email-scheduler", { connection });

  const ids = [
    "cmvgjsqfl0001dcvjclaiv1vd",
    "cmvgk3rak0001u8vjjf28pqlm",
    "cmvgk3rew0002u8vj8yo95vr0",
  ];

  for (const id of ids) {
    const job = await queue.getJob(id);

    if (!job) {
      console.log(`${id}: job not found`);
      continue;
    }

    const state = await job.getState();

    if (state === "delayed") {
      const removed = await job.remove();
      console.log(`${id}: removed from delayed queue`);
    } else {
      console.log(`${id}: state is ${state}; skipped`);
    }
  }

  await queue.close();
  await connection.quit();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});