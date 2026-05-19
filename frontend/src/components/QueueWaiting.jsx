import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { pollSessionStatus } from "../api/session";

export default function QueueWaiting({ sessionId, onActivated }) {
  const [position, setPosition] = useState("?");
  const [total, setTotal]       = useState("?");

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await pollSessionStatus(sessionId);
        if (data.status === "active") {
          clearInterval(interval);
          onActivated();
        } else if (data.status === "queued") {
          setPosition(data.position);
          setTotal(data.total);
        }
      } catch (e) {
        console.error("Poll error:", e);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [sessionId, onActivated]);

  return (
    <motion.div
      className="queue-page"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="queue-orb"
        animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="queue-content">
        <h2 className="queue-title">NOVA is busy</h2>
        <p className="queue-sub">Someone is already in a session. You are in the queue.</p>
        <div className="queue-position-badge">
          <span className="queue-num">{position}</span>
          <span className="queue-of">of {total}</span>
        </div>
        <p className="queue-hint">This page will automatically update when it is your turn.</p>
        <div className="queue-dots">
          {[0,1,2,3,4].map(i => (
            <motion.span
              key={i}
              className="q-dot"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.25 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
