import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import StarfieldCanvas from "./components/StarfieldCanvas";
import SessionCreation from "./components/SessionCreation";
import QueueWaiting from "./components/QueueWaiting";
import VoiceInterface from "./components/VoiceInterface";
import { createSession } from "./api/session";

// Screens: "setup" | "queue" | "active"
export default function App() {
  const [screen, setScreen]         = useState("setup");
  const [sessionId, setSessionId]   = useState(null);
  const [sessionMeta, setMeta]      = useState({});
  const [loading, setLoading]       = useState(false);

  const handleStart = useCallback(async (useCase, mood, customPrompt, modelId) => {
    setLoading(true);
    try {
      const data = await createSession(useCase, mood, customPrompt, modelId);
      setSessionId(data.sessionId);
      setMeta({ useCase, mood });
      setScreen(data.status === "active" ? "active" : "queue");
    } catch (e) {
      console.error(e);
      alert("Could not connect to server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSessionEnd = useCallback(() => {
    setSessionId(null);
    setMeta({});
    setScreen("setup");
  }, []);

  return (
    <>
      <StarfieldCanvas />
      <div className="nebula-orb nebula-orb-1" aria-hidden="true" />
      <div className="nebula-orb nebula-orb-2" aria-hidden="true" />
      <div className="nebula-orb nebula-orb-3" aria-hidden="true" />
      <div className="grid-overlay"            aria-hidden="true" />

      <AnimatePresence mode="wait">
        {screen === "setup" && (
          <SessionCreation key="setup" onStart={handleStart} loading={loading} />
        )}
        {screen === "queue" && (
          <QueueWaiting key="queue" sessionId={sessionId} onActivated={() => setScreen("active")} />
        )}
        {screen === "active" && (
          <VoiceInterface key="active" sessionId={sessionId} sessionMeta={sessionMeta}
            onSessionEnd={handleSessionEnd} />
        )}
      </AnimatePresence>
    </>
  );
}
