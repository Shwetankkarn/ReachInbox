
import { Client } from "@elastic/elasticsearch";

export const elasticsearch = new Client({
  node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
});

export const EMAIL_INDEX = "scheduled-emails";

type EmailDocument = {
  id: string;
  userId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt: Date;
  sentAt: Date | null;
  createdAt: Date;
};

export async function ensureEmailIndex(): Promise<void> {
  try {
    const exists = await elasticsearch.indices.exists({
      index: EMAIL_INDEX,
    });

    if (!exists) {
      await elasticsearch.indices.create({
        index: EMAIL_INDEX,
        mappings: {
          properties: {
            id: { type: "keyword" },
            userId: { type: "keyword" },
            recipientEmail: { type: "text" },
            subject: { type: "text" },
            body: { type: "text" },
            status: { type: "keyword" },
            scheduledAt: { type: "date" },
            sentAt: { type: "date" },
            createdAt: { type: "date" },
          },
        },
      });

      console.log("Elasticsearch index created:", EMAIL_INDEX);
    }
  } catch (error) {
    console.error("Unable to create Elasticsearch index:", error);
    throw error;
  }
}

export async function indexEmail(email: EmailDocument) {
  await ensureEmailIndex();

  try {
    const result = await elasticsearch.index({
      index: EMAIL_INDEX,
      id: email.id,
      document: {
        id: email.id,
        userId: email.userId,
        recipientEmail: email.recipientEmail,
        subject: email.subject,
        body: email.body,
        status: email.status,
        scheduledAt: email.scheduledAt.toISOString(),
        sentAt: email.sentAt?.toISOString() ?? null,
        createdAt: email.createdAt.toISOString(),
      },
      refresh: true,
    });

    console.log(
      `Elasticsearch indexed email ${email.id}: ${result.result}`
    );

    return result;
  } catch (error) {
    console.error("Elasticsearch indexing failed:", error);

    if (error && typeof error === "object" && "meta" in error) {
      const esError = error as {
        meta?: {
          body?: unknown;
          statusCode?: number;
        };
      };

      console.error("Elasticsearch status:", esError.meta?.statusCode);
      console.error(
        "Elasticsearch response:",
        JSON.stringify(esError.meta?.body, null, 2)
      );
    }

    throw error;
  }
}
