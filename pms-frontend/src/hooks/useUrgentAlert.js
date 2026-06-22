import { useEffect, useRef } from "react";
import { notificationsAPI } from "../services/api";

function playUrgentSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // 3-beep alarm pattern
    const beepAt = (startTime, freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.8, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    };

    beepAt(ctx.currentTime, 880);
    beepAt(ctx.currentTime + 0.4, 880);
    beepAt(ctx.currentTime + 0.8, 1100);
  } catch (e) {
    // Ignore AudioContext errors (e.g. user hasn't interacted yet)
  }
}

export function useUrgentAlert() {
  const seenIds = useRef(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await notificationsAPI.getAll({ is_read: false, limit: 20 });
        const notifications = res.data;
        const urgent = notifications.filter((n) => n.title === "URGENT TASK");

        if (!initialized.current) {
          // On first load, seed seen IDs without playing sound
          urgent.forEach((n) => seenIds.current.add(n.id));
          initialized.current = true;
          return;
        }

        const newUrgent = urgent.filter((n) => !seenIds.current.has(n.id));
        if (newUrgent.length > 0) {
          newUrgent.forEach((n) => seenIds.current.add(n.id));
          playUrgentSound();
        }
      } catch {
        // Silently ignore polling errors
      }
    };

    poll();
    const interval = setInterval(poll, 15000); // poll every 15 seconds
    return () => clearInterval(interval);
  }, []);
}
