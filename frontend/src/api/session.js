import { getApiUrl } from "./config";

export async function createSession(useCase, mood, customPrompt, modelId) {
  const res = await fetch(getApiUrl("/api/session/create"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ useCase, mood, customPrompt, modelId }),
  });
  if (!res.ok) throw new Error("Failed to create session");
  return res.json(); // { status, sessionId, position? }
}

export async function pollSessionStatus(sessionId) {
  const res = await fetch(getApiUrl(`/api/session/status/${sessionId}`));
  if (!res.ok) throw new Error("Failed to poll session");
  return res.json(); // { status, position?, total? }
}

export async function endSession(sessionId) {
  await fetch(getApiUrl("/api/session/end"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
}

/** Fetches the list of all available models from the backend (proxied from LM Studio) */
export async function fetchModels() {
  const res = await fetch(getApiUrl("/api/models"));
  if (!res.ok) throw new Error("Failed to fetch models from LM Studio");
  const data = await res.json();
  // Standard OpenAI response format is { data: [{ id: "model-name" }] }
  return data.data || [];
}

/** Triggers LM Studio to load/reload a specific model */
export async function loadModel(modelId) {
  const res = await fetch(getApiUrl("/api/models/load"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modelId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to load model in LM Studio");
  }
  return res.json();
}

