const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const morgan = require("morgan");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.LM_STUDIO_BASE_URL) {
  console.warn("\n⚠️  WARNING: LM_STUDIO_BASE_URL is not set in your environment or .env file!");
  console.warn("   Your server is running, but requests requesting LM Studio will fail.");
  console.warn("   Make sure backend/.env exists and is populated correctly.\n");
}

// ── In-memory session state ───────────────────────────────────────────────────
let activeSession = null; // { sessionId, systemPrompt, startTime, lastActivity }
const sessionQueue = [];  // [{ sessionId, systemPrompt }]
const chatHistories = new Map(); // sessionId → [{role,content}]

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(morgan("dev"));
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Serve built React frontend
const FRONTEND_DIST = path.join(__dirname, "../frontend/dist");
app.use(express.static(FRONTEND_DIST));

// ── Helpers ───────────────────────────────────────────────────────────────────
function checkLmStudioUrl(req, res, next) {
  if (!process.env.LM_STUDIO_BASE_URL || process.env.LM_STUDIO_BASE_URL === "undefined") {
    return res.status(500).json({
      error: "LM Studio URL is not configured",
      details: "LM_STUDIO_BASE_URL is missing or undefined. Please make sure the backend/.env file exists on the server and is configured correctly with LM_STUDIO_BASE_URL=http://<IP>:<PORT>."
    });
  }
  next();
}

function buildSystemPrompt(useCase, mood, customPrompt) {
  const useCaseMap = {
    general:      "You are a helpful general-purpose conversational assistant.",
    study:        "You are a patient study tutor. Explain concepts clearly with examples.",
    medical:      "You are a medical information assistant. Give general health info but always recommend consulting a real doctor.",
    mental_health:"You are a compassionate mental health companion. Be empathetic and non-judgmental.",
    technical:    "You are a technical expert. Troubleshoot problems systematically and clearly.",
    creative:     "You are a creative writing partner. Be imaginative and help develop ideas.",
    language:     "You are a language coach. Help with grammar, vocabulary, and natural usage.",
    business:     "You are a professional business advisor. Give strategic and actionable guidance.",
    custom:       customPrompt || "You are a helpful assistant.",
  };
  const moodMap = {
    focused:  "The user is focused. Be direct and efficient.",
    relaxed:  "The user is relaxed. Be warm and conversational.",
    stressed: "The user seems stressed. Be calm, patient, and reassuring.",
    happy:    "The user is happy. Be warm and positive.",
    curious:  "The user is curious. Be thorough and engaging.",
    tired:    "The user is tired. Keep responses very brief and simple.",
  };
  const base  = useCaseMap[useCase] || useCaseMap.general;
  const mood_ = moodMap[mood] || "";
  const extra = useCase !== "custom" && customPrompt ? `Additional context: ${customPrompt}` : "";
  return [base, mood_, extra, "",
    "STRICT RULES:",
    "- Never use emojis. Your text will be read aloud by a text-to-speech engine.",
    "- No markdown: no bullet points, asterisks, pound signs, or headers.",
    "- Write in plain natural sentences as if speaking in a voice conversation.",
    "- Keep replies to 2-4 sentences unless the user asks for more detail.",
    "- Never open with filler phrases like 'Of course!' or 'Great question!'.",
    "- Every session starts fresh. You have no memory of past sessions.",
  ].filter(Boolean).join("\n");
}

function promoteQueue() {
  if (!activeSession && sessionQueue.length > 0) {
    const next = sessionQueue.shift();
    activeSession = { ...next, startTime: Date.now(), lastActivity: Date.now() };
    chatHistories.set(next.sessionId, []);
    console.log(`✅  Promoted: ${next.sessionId.slice(0,8)}`);
  }
}

// Auto-expire sessions idle for 15 min
setInterval(() => {
  if (activeSession && Date.now() - activeSession.lastActivity > 15 * 60 * 1000) {
    console.log(`⏱  Auto-expiring idle session ${activeSession.sessionId.slice(0,8)}`);
    chatHistories.delete(activeSession.sessionId);
    activeSession = null;
    promoteQueue();
  }
}, 60_000);

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({
  status: "ok",
  activeSession: activeSession ? activeSession.sessionId.slice(0,8)+"..." : null,
  queueLength: sessionQueue.length,
  lmStudio: process.env.LM_STUDIO_BASE_URL,
}));

// Fetch all available/loaded models from LM Studio
app.get("/api/models", checkLmStudioUrl, async (_req, res) => {
  try {
    const response = await axios.get(`${process.env.LM_STUDIO_BASE_URL}/v1/models`, { timeout: 5000 });
    return res.json(response.data);
  } catch (err) {
    try {
      const response = await axios.get(`${process.env.LM_STUDIO_BASE_URL}/api/v1/models`, { timeout: 5000 });
      return res.json(response.data);
    } catch (innerErr) {
      console.error("❌ Failed to fetch models from LM Studio:", innerErr.message);
      return res.status(500).json({ error: "Could not fetch models from LM Studio.", details: innerErr.message });
    }
  }
});

// Load a specific model in LM Studio
app.post("/api/models/load", checkLmStudioUrl, async (req, res) => {
  const { modelId } = req.body;
  if (!modelId) return res.status(400).json({ error: "modelId is required." });

  try {
    const response = await axios.post(`${process.env.LM_STUDIO_BASE_URL}/api/v1/models/load`, {
      model: modelId,
      id: modelId
    }, { timeout: 35000 });
    process.env.LM_STUDIO_MODEL = modelId;
    console.log(`🎯 Successfully loaded model in LM Studio: ${modelId}`);
    return res.json({ success: true, details: response.data });
  } catch (err) {
    try {
      const response = await axios.post(`${process.env.LM_STUDIO_BASE_URL}/v1/models/load`, {
        model: modelId,
        id: modelId
      }, { timeout: 35000 });
      process.env.LM_STUDIO_MODEL = modelId;
      console.log(`🎯 Successfully loaded model in LM Studio: ${modelId}`);
      return res.json({ success: true, details: response.data });
    } catch (innerErr) {
      console.error(`❌ Failed to load model ${modelId}:`, innerErr.message);
      return res.status(500).json({ error: "Could not load model in LM Studio.", details: innerErr.message });
    }
  }
});

// Create session
app.post("/api/session/create", (req, res) => {
  const { useCase = "general", mood = "relaxed", customPrompt = "", modelId = "" } = req.body;
  const sessionId = uuidv4();
  const systemPrompt = buildSystemPrompt(useCase, mood, customPrompt);

  if (!activeSession) {
    activeSession = { sessionId, systemPrompt, modelId, startTime: Date.now(), lastActivity: Date.now() };
    chatHistories.set(sessionId, []);
    console.log(`🟢  Active: ${sessionId.slice(0,8)} [${useCase}/${mood}] model: ${modelId || "default"}`);
    return res.json({ status: "active", sessionId });
  }
  sessionQueue.push({ sessionId, systemPrompt, modelId });
  console.log(`⏳  Queued: ${sessionId.slice(0,8)} position ${sessionQueue.length}`);
  return res.json({ status: "queued", sessionId, position: sessionQueue.length });
});

// Poll session status
app.get("/api/session/status/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  if (activeSession?.sessionId === sessionId)
    return res.json({ status: "active" });
  const pos = sessionQueue.findIndex(s => s.sessionId === sessionId);
  if (pos !== -1)
    return res.json({ status: "queued", position: pos + 1, total: sessionQueue.length });
  return res.json({ status: "not_found" });
});

// Global queue info
app.get("/api/queue", (_req, res) => res.json({
  busy: !!activeSession,
  queueLength: sessionQueue.length,
}));

// End session
app.post("/api/session/end", (req, res) => {
  const { sessionId } = req.body;
  if (activeSession?.sessionId !== sessionId)
    return res.status(403).json({ error: "Not the active session." });
  chatHistories.delete(sessionId);
  activeSession = null;
  promoteQueue();
  console.log(`🔴  Ended: ${sessionId.slice(0,8)}`);
  return res.json({ status: "ended" });
});

// Chat — receives text JSON, returns text JSON
app.post("/api/chat", checkLmStudioUrl, async (req, res) => {
  const { sessionId, text } = req.body;
  if (!sessionId || !text?.trim())
    return res.status(400).json({ error: "sessionId and text are required." });
  if (activeSession?.sessionId !== sessionId)
    return res.status(403).json({ error: "Session not active." });

  activeSession.lastActivity = Date.now();
  const history = chatHistories.get(sessionId) || [];
  history.push({ role: "user", content: text.trim() });

  try {
    const response = await axios.post(
      `${process.env.LM_STUDIO_BASE_URL}/v1/chat/completions`,
      {
        model: activeSession.modelId || process.env.LM_STUDIO_MODEL || "local-model",
        messages: [
          { role: "system", content: activeSession.systemPrompt },
          ...history,
        ],
        temperature: 0.7,
        max_tokens: 512,
        stream: false,
      },
      { timeout: 60_000 }
    );

    const aiText = response.data?.choices?.[0]?.message?.content?.trim() || "";
    history.push({ role: "assistant", content: aiText });
    chatHistories.set(sessionId, history);
    console.log(`💬  ${sessionId.slice(0,8)} → "${text.slice(0,40)}..." ← "${aiText.slice(0,40)}..."`);
    return res.json({ text: aiText });
  } catch (err) {
    console.error("❌  LM Studio error:", err.message);
    return res.status(500).json({ error: "LM Studio request failed.", details: err.message });
  }
});

// Catch-all for React Router
app.get(/.*/, (_req, res) =>
  res.sendFile(path.join(FRONTEND_DIST, "index.html"))
);

app.listen(PORT, "0.0.0.0", () =>
  console.log(`
╔══════════════════════════════════════════════╗
║  NOVA  –  EC2 Server  :${PORT}                  ║
║  LM Studio → ${process.env.LM_STUDIO_BASE_URL} ║
╚══════════════════════════════════════════════╝`)
);
