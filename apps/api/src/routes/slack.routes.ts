import { Router } from "express";
import {
  consumeSlackOAuthState,
  createSlackOAuthState,
  exchangeSlackOAuthCode,
  saveSlackOAuthState,
} from "../services/slack.service";

const router = Router();

router.get("/connect", async (_req, res) => {
  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = process.env.SLACK_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return res.status(500).send("Slack OAuth configuration is missing.");
  }

  const state = createSlackOAuthState();
  await saveSlackOAuthState(state);

  const params = new URLSearchParams({
    client_id: clientId,
    scope: "chat:write",
    redirect_uri: redirectUri,
    state,
  });

  return res.redirect(
    `https://slack.com/oauth/v2/authorize?${params.toString()}`
  );
});

router.get("/callback", async (req, res) => {
  try {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";

    if (req.query.error) {
      return res.status(400).send("Slack authorization was cancelled or denied.");
    }

    if (!code || !state || !(await consumeSlackOAuthState(state))) {
      return res.status(400).send("Invalid or expired Slack OAuth state.");
    }

    await exchangeSlackOAuthCode(code);
    return res.status(200).send("Slack connected successfully. You can close this page.");
  } catch (error) {
    console.error(
      "[Slack OAuth] Callback failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return res.status(500).send("Slack connection failed. Check API logs.");
  }
});

export default router;
