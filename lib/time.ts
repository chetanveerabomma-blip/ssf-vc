import { format, parse, addDays, getDay, isWithinInterval, parseISO } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { RULES } from "@/config/rules";
import holidaysData from "@/data/holidays-2026.json";

export const TIMEZONE = RULES.timezone;

export function getISTNow(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}

export function parseISTDate(dateOrStr: Date | string): Date {
  if (typeof dateOrStr === "string") {
    // If it's an ISO string or YYYY-MM-DDTHH:mm
    if (dateOrStr.includes("T")) {
      return toZonedTime(parseISO(dateOrStr), TIMEZONE);
    }
    // If it's just YYYY-MM-DD
    const parsed = parse(dateOrStr, "yyyy-MM-dd", new Date());
    return toZonedTime(parsed, TIMEZONE);
  }
  return toZonedTime(dateOrStr, TIMEZONE);
}

export function formatIST(date: Date, pattern: string): string {
  return formatInTimeZone(date, TIMEZONE, pattern);
}

export function getMinutesSinceMidnight(date: Date): number {
  const hours = parseInt(formatIST(date, "HH"), 10);
  const minutes = parseInt(formatIST(date, "mm"), 10);
  return hours * 60 + minutes;
}

export function formatMinutesToTime(min: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(min)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function getDayOfWeekString(date: Date): "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN" {
  const dayIndex = parseInt(formatIST(date, "i"), 10); // 1 = Monday, 7 = Sunday
  const map: Record<number, "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN"> = {
    1: "MON",
    2: "TUE",
    3: "WED",
    4: "THU",
    5: "FRI",
    6: "SAT",
    7: "SUN",
  };
  return map[dayIndex] || "MON";
}

export function isHoliday(dateStr: string): { name: string } | null {
  const match = holidaysData.find((h) => h.date === dateStr);
  return match ? { name: match.name } : null;
}

export function isSemesterActive(dateStr: string): boolean {
  return dateStr >= RULES.semester.startDate && dateStr <= RULES.semester.endDate;
}

export interface ResolvedTimeResult {
  dateStr: string;
  startMin: number;
  durationMin: number;
  endMin: number;
  assumptions: string[];
}

export function resolveTime(queryText: string, referenceTime?: Date): ResolvedTimeResult {
  const now = referenceTime ? parseISTDate(referenceTime) : getISTNow();
  const dateStr = formatIST(now, "yyyy-MM-dd");
  const assumptions: string[] = [];

  let startMin = getMinutesSinceMidnight(now);
  let durationMin = 60; // default 60 min

  const text = queryText.toLowerCase();

  // Day resolution
  let targetDate = now;
  if (text.includes("tomorrow")) {
    targetDate = addDays(now, 1);
    assumptions.push("Resolved date to tomorrow");
  } else if (text.includes("monday") || text.includes("mon")) {
    // If needed
  }

  // Duration extraction
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr|hrs)/);
  const minMatch = text.match(/(\d+)\s*(?:minute|min|mins)/);

  if (hourMatch) {
    durationMin = Math.round(parseFloat(hourMatch[1]) * 60);
  } else if (minMatch) {
    durationMin = parseInt(minMatch[1], 10);
  } else if (text.includes("half an hour") || text.includes("30 min")) {
    durationMin = 30;
  }

  // Start time extraction
  if (text.includes("after lunch")) {
    startMin = 13 * 60 + 20; // 13:20 after Year II-IV lunch
    assumptions.push("Start time set to 13:20 (after lunch)");
  } else if (text.includes("morning")) {
    startMin = 9 * 60; // 09:00
    assumptions.push("Morning start time set to 09:00");
  } else {
    const timeMatch = text.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const meridiem = timeMatch[3];
      if (meridiem === "pm" && h < 12) h += 12;
      if (meridiem === "am" && h === 12) h = 0;
      startMin = h * 60 + m;
      assumptions.push(`Start time set to ${formatMinutesToTime(startMin)}`);
    } else {
      // Default to "now"
      // Round to nearest 5 min or keep exact
      assumptions.push(`Start time defaulted to current time (${formatMinutesToTime(startMin)})`);
    }
  }

  // Team assumption
  if (text.includes("me and my team") || text.includes("team") || text.includes("group")) {
    assumptions.push("Group size estimated at ~5 students");
  }

  // Clamp end time to campus close
  const endMin = Math.min(RULES.campusHours.endMin, startMin + durationMin);

  return {
    dateStr: formatIST(targetDate, "yyyy-MM-dd"),
    startMin,
    durationMin,
    endMin,
    assumptions,
  };
}
