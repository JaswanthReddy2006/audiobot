import { useRef, useState, useCallback } from "react";

/**
 * Custom hook to manage MediaRecorder lifecycle.
 *
 * Returns:
 *   isRecording   – boolean
 *   startRecording – fn
 *   stopRecording  – fn → Promise<Blob>
 */
export function useMediaRecorder() {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      // Prefer audio/webm for broad browser support; backend receives it fine
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.start(100); // collect in 100ms chunks
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      throw err;
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        // Stop all mic tracks to release the device
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setIsRecording(false);
        resolve(blob);
      };

      recorder.stop();
    });
  }, []);

  return { isRecording, startRecording, stopRecording };
}
