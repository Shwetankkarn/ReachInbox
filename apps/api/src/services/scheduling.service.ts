
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { emailQueue } from "../queues/email.queue";
import { indexEmail } from "../lib/elasticsearch";

interface ScheduleEmailInput {
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: Date;
  userId: string;
  hourlyLimit: number;
}

export async function scheduleEmail(input: ScheduleEmailInput) {
  if (input.scheduledAt.getTime() <= Date.now()) {
    throw new Error("Scheduled time must be in the future");
  }

  const email = await prisma.scheduledEmail.create({
    data: {
      recipientEmail: input.recipient,
      subject: input.subject,
      body: input.body,
      scheduledAt: input.scheduledAt,
      idempotencyKey: randomUUID(),
      userId: input.userId,
      status: "SCHEDULED",
    },
  });

  try {
    const delay = input.scheduledAt.getTime() - Date.now();

   await emailQueue.add(
  "send-email",
  {
    emailId: email.id,
    hourlyLimit: input.hourlyLimit,
  },
  {
    jobId: email.id,
    delay,
  }
);

    await indexEmail(email);

    return email;
  } catch (error) {
    // Avoid leaving a scheduled database record without a queue job.
    await prisma.scheduledEmail.update({
      where: { id: email.id },
      data: {
        status: "FAILED",
        errorMessage: "Unable to add email to the queue",
      },
    });

    throw error;
  }
}
