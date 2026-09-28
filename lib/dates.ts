import { parseISO, format, isBefore, isAfter, isEqual, addDays, isSunday } from "date-fns";

export const SEMESTER_START_DATE = "2026-08-29";
export const SEMESTER_END_DATE = "2026-11-29";

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
}

export interface DayOrderOverride {
  date: string; // YYYY-MM-DD
  followsDay: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";
}

export interface PeriodSlot {
  period: number;
  start: string;
  end: string;
  subjectCode: string;
}

export type WeekSchedule = {
  MON?: PeriodSlot[];
  TUE?: PeriodSlot[];
  WED?: PeriodSlot[];
  THU?: PeriodSlot[];
  FRI?: PeriodSlot[];
  SAT?: PeriodSlot[];
};

export type DayKey = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";

export function getDayKeyFromDate(date: Date): DayKey | null {
  const dayIndex = date.getDay(); // 0 is Sunday, 1 is Monday, ... 6 is Saturday
  switch (dayIndex) {
    case 1:
      return "MON";
    case 2:
      return "TUE";
    case 3:
      return "WED";
    case 4:
      return "THU";
    case 5:
      return "FRI";
    case 6:
      return "SAT";
    default:
      return null;
  }
}

/**
 * Checks if a given date string (YYYY-MM-DD) is a declared holiday
 */
export function isHoliday(dateStr: string, holidays: Holiday[]): boolean {
  return holidays.some((h) => h.date === dateStr);
}

/**
 * Counts scheduled classes for each subject between startDateStr and endDateStr (inclusive).
 * If labCountingMode is 'SESSION', contiguous periods for the same lab in a single day count as 1 class.
 * If 'PERIODS', each period slot counts as 1.
 */
export function countClassesBetweenDates(
  startDateStr: string,
  endDateStr: string,
  weekSchedule: WeekSchedule,
  holidays: Holiday[] = [],
  dayOrderOverrides: DayOrderOverride[] = [],
  labCountingMode: "PERIODS" | "SESSION" = "PERIODS",
  subjectTypeMap: Record<string, "THEORY" | "LAB"> = {}
): Record<string, number> {
  const counts: Record<string, number> = {};

  let curr = parseISO(startDateStr);
  const end = parseISO(endDateStr);

  if (isAfter(curr, end)) {
    return counts;
  }

  while (isBefore(curr, end) || isEqual(curr, end)) {
    const dateStr = format(curr, "yyyy-MM-dd");

    // Skip Sundays
    if (isSunday(curr)) {
      curr = addDays(curr, 1);
      continue;
    }

    // Skip Holidays
    if (isHoliday(dateStr, holidays)) {
      curr = addDays(curr, 1);
      continue;
    }

    // Determine Day Schedule (check override or normal weekday)
    const override = dayOrderOverrides.find((o) => o.date === dateStr);
    const dayKey: DayKey | null = override ? override.followsDay : getDayKeyFromDate(curr);

    if (dayKey && weekSchedule[dayKey]) {
      const slots = weekSchedule[dayKey] || [];
      if (labCountingMode === "SESSION") {
        // Group by subject in the same day if it's a LAB
        const seenLabToday = new Set<string>();
        for (const slot of slots) {
          const isLab = subjectTypeMap[slot.subjectCode] === "LAB";
          if (isLab) {
            if (!seenLabToday.has(slot.subjectCode)) {
              seenLabToday.add(slot.subjectCode);
              counts[slot.subjectCode] = (counts[slot.subjectCode] || 0) + 1;
            }
          } else {
            counts[slot.subjectCode] = (counts[slot.subjectCode] || 0) + 1;
          }
        }
      } else {
        // Standard period counting
        for (const slot of slots) {
          counts[slot.subjectCode] = (counts[slot.subjectCode] || 0) + 1;
        }
      }
    }

    curr = addDays(curr, 1);
  }

  return counts;
}

/**
 * Gets remaining working days between today and semester end, excluding holidays and Sundays.
 */
export function getWorkingDaysCount(
  startDateStr: string,
  endDateStr: string,
  holidays: Holiday[] = []
): number {
  let curr = parseISO(startDateStr);
  const end = parseISO(endDateStr);
  let count = 0;

  if (isAfter(curr, end)) return 0;

  while (isBefore(curr, end) || isEqual(curr, end)) {
    const dateStr = format(curr, "yyyy-MM-dd");
    if (!isSunday(curr) && !isHoliday(dateStr, holidays)) {
      count++;
    }
    curr = addDays(curr, 1);
  }

  return count;
}
