
import { Worker, DelayedError } from "bullmq";
import { reserveEmailSendSlot } from "../services/rateLimiter.service";
import { redis } from "../lib/redis";
import { prisma } from "../lib/prisma";
import { EMAIL_QUEUE_NAME } from "../queues/email.queue";
import { sendTestEmail } from "../services/email.service";
import { indexEmail } from "../lib/elasticsearch";
import { notifySlackRateLimit } from "../services/slack.service";

export const emailWorker = new Worker(
  EMAIL_QUEUE_NAME,
  async (job, token) => {
    const emailId = job.data.emailId as string;

    if (!emailId) {
      throw new Error("Email ID is missing from the job");
    }

    const email = await prisma.scheduledEmail.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      throw new Error(`Email ${emailId} was not found`);
    }

    if (email.status === "SENT") {
      await indexEmail(email);
      return { success: true, message: "Already sent", emailId };
    }

    if (email.status === "CANCELLED") {
      return { success: true, message: "Cancelled", emailId };
    }

    const requestedHourlyLimit = Number(job.data.hourlyLimit);
    console.log("[DEBUG] Job hourlyLimit:", job.data.hourlyLimit);
    const reservation = await reserveEmailSendSlot(
      String(job.id),
      email.userId,
      requestedHourlyLimit
    );

    const now = Date.now();

    console.log("[RateLimiter] Reservation result:", {
      jobId: job.id,
      ...reservation,
      waitMs: Math.max(0, reservation.allowedAt - now),
    });

    if (!reservation.allowed || reservation.allowedAt > now) {
      try {
        await notifySlackRateLimit(email.userId, reservation.allowedAt);
      } catch (error) {
        console.error(
          "[Slack] Rate-limit alert failed:",
          error instanceof Error ? error.message : error
        );
      }

      if (!token) {
        throw new Error("Cannot delay job: missing lock token");
      }

      // Never reschedule before the limiter's allowed time.
      const retryAt = Math.max(reservation.allowedAt, now + 1000);

      console.log(
        `[Worker] Delaying ${job.id} until ${new Date(retryAt).toISOString()}`
      );

      await job.moveToDelayed(retryAt, token);
      throw new DelayedError();
    }

    // Atomically claim the email so concurrent workers cannot send it twice.
    const claimed = await prisma.scheduledEmail.updateMany({
      where: { id: emailId, status: "SCHEDULED" },
      data: {
        status: "PROCESSING",
        attempts: { increment: 1 },
      },
    });

    if (claimed.count !== 1) {
      const latest = await prisma.scheduledEmail.findUnique({
        where: { id: emailId },
      });

      if (latest?.status === "SENT" || latest?.status === "CANCELLED") {
        return { success: true, message: "Already handled", emailId };
      }

      throw new Error(
        `Email cannot be claimed; current status: ${latest?.status ?? "missing"}`
      );
    }

    const processingEmail = await prisma.scheduledEmail.findUnique({
      where: { id: emailId },
    });

    if (processingEmail) await indexEmail(processingEmail);

    try {
      const result = await sendTestEmail({
        recipient: email.recipientEmail,
        subject: email.subject,
        body: email.body,
      });

      const sentEmail = await prisma.scheduledEmail.update({
        where: { id: emailId },
        data: {
          status: "SENT",
          sentAt: new Date(),
          errorMessage: null,
        },
      });

      await indexEmail(sentEmail);
      console.log(`[Worker] Email ${emailId} sent through Ethereal`);

      return { success: true, emailId, ...result };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Email sending failed";

      const isFinalAttempt =
        job.attemptsMade + 1 >= (job.opts.attempts ?? 1);

      const retryEmail = await prisma.scheduledEmail.update({
        where: { id: emailId },
        data: {
          status: isFinalAttempt ? "FAILED" : "SCHEDULED",
          errorMessage: message,
        },
      });

      await indexEmail(retryEmail);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: Number(process.env.WORKER_CONCURRENCY) || 5,
  }
);

emailWorker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

emailWorker.on("failed", (job, error) => {
  console.error(`[Worker] Job ${job?.id} failed:`, error.message);
});

emailWorker.on("active", (job) => {
  console.log(`[Worker] Active job: ${job.id}`);
});

emailWorker.on("error", (error) => {
  console.error("[Worker] Error:", error);
});

emailWorker.waitUntilReady()
  .then(() => console.log("[Worker] Ready and listening for jobs"))
  .catch((error) => console.error("[Worker] Startup error:", error));
