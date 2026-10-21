
import { prisma } from "../lib/prisma";
import {
  elasticsearch,
  EMAIL_INDEX,
  ensureEmailIndex,
  indexEmail,
} from "../lib/elasticsearch";

export async function reindexAllEmails(userId: string) {
  await ensureEmailIndex();

  const emails = await prisma.scheduledEmail.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  for (const email of emails) {
    await indexEmail(email);
  }

  await elasticsearch.indices.refresh({
    index: EMAIL_INDEX,
  });

  return emails.length;
}
