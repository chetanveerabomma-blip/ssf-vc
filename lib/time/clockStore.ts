import { create } from "zustand";
import { formatInTimeZone } from "date-fns-tz";

interface ClockState {
  offsetMs: number; // serverTime - localTime
  isSynced: boolean;
  currentDateStr: string; // YYYY-MM-DD in IST
  currentTimeStr: string; // HH:mm:ss in IST
  currentTimeShort: string; // HH:mm in IST
  currentEpochMs: number;
  syncServerTime: () => Promise<void>;
  getCorrectedNow: () => Date;
}

const TIMEZONE = "Asia/Kolkata";

export const useClockStore = create<ClockState>((set, get) => ({
  offsetMs: 0,
  isSynced: false,
  currentDateStr: formatInTimeZone(new Date(), TIMEZONE, "yyyy-MM-dd"),
  currentTimeStr: formatInTimeZone(new Date(), TIMEZONE, "HH:mm:ss"),
  currentTimeShort: formatInTimeZone(new Date(), TIMEZONE, "HH:mm"),
  currentEpochMs: Date.now(),

  getCorrectedNow: () => {
    return new Date(Date.now() + get().offsetMs);
  },

  syncServerTime: async () => {
    try {
      const startTime = Date.now();
      const res = await fetch("/api/time", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const endTime = Date.now();
      const latency = Math.round((endTime - startTime) / 2);
      const serverEpoch = data.epochMs + latency;
      const offset = serverEpoch - endTime;

      const corrected = new Date(Date.now() + offset);
      set({
        offsetMs: offset,
        isSynced: true,
        currentDateStr: formatInTimeZone(corrected, TIMEZONE, "yyyy-MM-dd"),
        currentTimeStr: formatInTimeZone(corrected, TIMEZONE, "HH:mm:ss"),
        currentTimeShort: formatInTimeZone(corrected, TIMEZONE, "HH:mm"),
        currentEpochMs: corrected.getTime(),
      });
    } catch {
      // Offline fallback: keep local clock
    }
  },
}));

// Initialize client-side ticker & visibility listener
if (typeof window !== "undefined") {
  const store = useClockStore.getState();
  store.syncServerTime();

  // Tick every second
  setInterval(() => {
    const corrected = useClockStore.getState().getCorrectedNow();
    useClockStore.setState({
      currentDateStr: formatInTimeZone(corrected, TIMEZONE, "yyyy-MM-dd"),
      currentTimeStr: formatInTimeZone(corrected, TIMEZONE, "HH:mm:ss"),
      currentTimeShort: formatInTimeZone(corrected, TIMEZONE, "HH:mm"),
      currentEpochMs: corrected.getTime(),
    });
  }, 1000);

  // Re-sync every 5 minutes
  setInterval(() => {
    useClockStore.getState().syncServerTime();
  }, 5 * 60 * 1000);

  // Re-sync on visibility change
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      useClockStore.getState().syncServerTime();
    }
  });
}
