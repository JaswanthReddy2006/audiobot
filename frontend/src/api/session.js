export async function createSession(useCase, mood, customPrompt) {
  const res = await fetch("/api/session/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ useCase, mood, customPrompt }),
  });
  if (!res.ok) throw new Error("Failed to create session");
  return res.json(); // { status, sessionId, position? }
}

export async function pollSessionStatus(sessionId) {
  const res = await fetch(`/api/session/status/${sessionId}`);
  if (!res.ok) throw new Error("Failed to poll session");
  return res.json(); // { status, position?, total? }
}

export async function endSession(sessionId) {
  await fetch("/api/session/end", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
}
