
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { reindexAllEmails } from "../services/emailSearch.service";
import { scheduleEmail } from "../services/scheduling.service";
import { elasticsearch, EMAIL_INDEX } from "../lib/elasticsearch";

const router = Router();


const scheduleEmailSchema = z.object({
  recipient: z.string().email(),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1),
  scheduledAt: z.string().datetime(),
  hourlyLimit: z.number().int().min(1).max(100).default(2),
  delaySeconds: z.number().int().min(1).optional(),
});

const validStatuses = [
  "SCHEDULED",
  "PROCESSING",
  "SENT",
  "FAILED",
  "CANCELLED",
] as const;

type EmailStatus = (typeof validStatuses)[number];

// Require an authenticated Google session.
router.use((req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: "Please log in with Google to access your emails.",
    });
  }

  next();
});

// Schedule an email for the authenticated user.
router.post("/schedule", async (req, res) => {
  const validation = scheduleEmailSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid email scheduling details",
      errors: validation.error.issues,
    });
  }

  try {
    const userId = (req.user as { id: string }).id;

 const email = await scheduleEmail({
  ...validation.data,
  scheduledAt: new Date(validation.data.scheduledAt),
  userId,
  hourlyLimit: validation.data.hourlyLimit,
});

    return res.status(201).json({
      success: true,
      message: "Email scheduled successfully",
      email,
    });
  } catch (error) {
    console.error("Failed to schedule email:", error);

    const message =
      error instanceof Error ? error.message : "Unable to schedule email";

    return res.status(400).json({
      success: false,
      message,
    });
  }
});

// Search emails using Elasticsearch.


 // Reindex existing emails for the logged-in user.
router.post("/reindex", async (req, res) => {
  try {
    const userId = (req.user as { id: string }).id;
    const indexedCount = await reindexAllEmails(userId);

    return res.json({
      success: true,
      message: "Email reindex completed",
      indexedCount,
    });
  } catch (error) {
    console.error("Email reindex failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reindex emails",
    });
  }
});


router.get("/search", async (req, res) => {
  const q = req.query.q;

  if (typeof q !== "string" || !q.trim()) {
    return res.status(400).json({
      success: false,
      message: "Provide a search query using ?q=",
    });
  }

  try {
    const userId = (req.user as { id: string }).id;

    const result = await elasticsearch.search({
      index: EMAIL_INDEX,
      query: {
        bool: {
          filter: [{ term: { userId } }],
          must: [
            {
              multi_match: {
                query: q.trim(),
                fields: ["recipientEmail", "subject", "body"],
              },
            },
          ],
        },
      },
    });

    const emails = result.hits.hits.map((hit) => hit._source);

    return res.json({
      success: true,
      count: emails.length,
      emails,
    });
  } catch (error) {
    console.error("Email search failed:", error);

    return res.status(503).json({
      success: false,
      message: "Email search is temporarily unavailable",
    });
  }
});

// Get emails belonging only to the authenticated user.
router.get("/", async (req, res) => {
  try {
    const status = req.query.status;

    if (
      status !== undefined &&
      (typeof status !== "string" ||
        !validStatuses.includes(status as EmailStatus))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid email status filter",
      });
    }

    const userId = (req.user as { id: string }).id;

    const emails = await prisma.scheduledEmail.findMany({
      where: {
        userId,
        ...(typeof status === "string"
          ? { status: status as EmailStatus }
          : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: emails.length,
      emails,
    });
  } catch (error) {
    console.error("Failed to fetch emails:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch emails",
    });
  }
});

export default router;
