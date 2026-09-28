/**
 * Attendance Predictor - Calculation Engine
 * Pure functions for attendance forecasting, detention risk, and recovery planning.
 * Extended with Leave Simulation (OD, Medical, Absent) and What-If Analysis.
 * Timezone: Asia/Kolkata
 * Semester: 2026-08-29 to 2026-11-29
 */

import { parseISO, format, addDays, isBefore, isAfter, isEqual, isSunday } from "date-fns";
import { AttendancePolicy, DEFAULT_POLICY, LeaveType, MedicalHandlingMode } from "@/config/policy";
import { Holiday, DayOrderOverride, WeekSchedule, DayKey, getDayKeyFromDate, isHoliday } from "@/lib/dates";

export const SEMESTER_START = "2026-08-29";
export const SEMESTER_END = "2026-11-29";
export const THRESHOLD_DETENTION = 0.75;
export const THRESHOLD_TARGET = 0.90;

export type AttendanceStatus = "SAFE_90" | "SAFE_75" | "DANGER" | "IRREVERSIBLE";

export interface SubjectScheduleInfo {
  code: string;
  name: string;
  type: "THEORY" | "LAB";
  periodsPerSession?: number;
}

export interface SubjectInput {
  code: string;
  name: string;
  type: "THEORY" | "LAB";
  mode: "PERCENTAGE" | "COUNTS";
  // Used if mode === 'PERCENTAGE'
  percentage?: number;
  // Used if mode === 'COUNTS'
  attended?: number;
  held?: number;
  // User planned skips up to planning date
  plannedSkips?: number;
}

export interface SubjectCalculation {
  code: string;
  name: string;
  type: "THEORY" | "LAB";
  mode: "PERCENTAGE" | "COUNTS";
  held_so_far: number;
  attended_so_far: number;
  current_percentage: number;
  remaining_total: number; // R
  remaining_until_plan_date: number;
  total_final: number; // T = held_so_far + remaining_total
  must_attend_75: number;
  must_attend_90: number;
  can_bunk_75: number;
  can_bunk_90: number;
  status: AttendanceStatus;
  max_possible_percentage: number;
  // Future planning projections
  planned_skips: number;
  projected_attended_with_skips: number;
  projected_percentage_with_skips: number;
  plan_breaks_75: boolean;
  // Recovery plan: classes to attend per week (assuming remaining weeks)
  weekly_target_75: number;
  weekly_target_90: number;
}

export interface OverallCalculation {
  total_held: number;
  total_attended: number;
  current_percentage: number;
  total_remaining: number;
  total_final: number;
  must_attend_75: number;
  must_attend_90: number;
  can_bunk_75: number;
  can_bunk_90: number;
  max_possible_percentage: number;
  status: AttendanceStatus;
  has_irreversible_detention: boolean;
  irreversible_subjects: SubjectCalculation[];
}

export interface LeaveInput {
  id?: string;
  type: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isHalfDay?: boolean;
  halfDayType?: "MORNING" | "AFTERNOON";
  scope?: string; // "ALL" or comma-separated subject codes
  medicalApproved?: boolean;
  isAlreadyTaken?: boolean; // Already taken vs Planned
  note?: string;
}

export interface AffectedPeriod {
  date: string;
  period: number;
  subjectCode: string;
  leaveType: LeaveType;
  handling: "AS_PRESENT" | "AS_ABSENT" | "EXCLUDED";
}

export interface LeaveSimulationResult {
  subjectCode: string;
  before: {
    attended: number;
    held: number;
    percentage: number;
    status: AttendanceStatus;
    remaining: number;
    must_attend_75: number;
    can_bunk_75: number;
  };
  after: {
    attended: number;
    held: number;
    percentage: number;
    status: AttendanceStatus;
    remaining: number;
    must_attend_75: number;
    can_bunk_75: number;
  };
  delta: number;
  crossesThreshold75: boolean;
  crossesThreshold90: boolean;
  becomesIrreversible: boolean;
  affectedPeriodsCount: number;
  affectedPeriods: AffectedPeriod[];
}

/**
 * Calculates required classes to attend out of remaining to achieve a target threshold.
 * Formula: max(0, ceil(threshold * total_final - attended_so_far))
 */
export function calculateRequiredForThreshold(
  threshold: number,
  total_final: number,
  attended_so_far: number
): number {
  if (total_final <= 0) return 0;
  const rawRequired = Math.ceil(threshold * total_final - attended_so_far);
  return Math.max(0, rawRequired);
}

/**
 * Calculates safe classes that can be bunked while keeping attendance >= threshold.
 * Formula: max(0, floor(remaining - must_attend)) if current + remaining can meet it, else 0
 */
export function calculateCanBunkForThreshold(
  remaining: number,
  must_attend: number
): number {
  if (must_attend > remaining) return 0;
  return Math.max(0, Math.floor(remaining - must_attend));
}

/**
 * Determines attendance status based on thresholds and recovery feasibility.
 */
export function determineStatus(
  current_percentage: number,
  must_attend_75: number,
  remaining: number,
  can_bunk_90: number
): AttendanceStatus {
  if (must_attend_75 > remaining) {
    return "IRREVERSIBLE";
  }
  if (current_percentage >= 90 && can_bunk_90 > 0) {
    return "SAFE_90";
  }
  if (current_percentage >= 75) {
    return "SAFE_75";
  }
  return "DANGER";
}

/**
 * Core calculation function for a single subject.
 */
export function calculateSubjectAttendance(
  input: SubjectInput,
  scheduledHeldSoFar: number,
  remainingTotal: number,
  remainingUntilPlanDate: number,
  weeksRemaining: number = 9
): SubjectCalculation {
  let held_so_far = scheduledHeldSoFar;
  let attended_so_far = 0;

  if (input.mode === "COUNTS") {
    held_so_far = input.held !== undefined ? Math.max(0, Math.floor(input.held)) : scheduledHeldSoFar;
    attended_so_far = input.attended !== undefined ? Math.min(held_so_far, Math.max(0, Math.floor(input.attended))) : 0;
  } else {
    // Percentage mode
    const pct = input.percentage !== undefined ? Math.max(0, Math.min(100, input.percentage)) : 0;
    attended_so_far = Math.round((pct / 100) * held_so_far);
  }

  const current_percentage = held_so_far > 0 ? (attended_so_far / held_so_far) * 100 : 100;
  const total_final = held_so_far + remainingTotal;

  const must_attend_75 = calculateRequiredForThreshold(THRESHOLD_DETENTION, total_final, attended_so_far);
  const must_attend_90 = calculateRequiredForThreshold(THRESHOLD_TARGET, total_final, attended_so_far);

  const can_bunk_75 = calculateCanBunkForThreshold(remainingTotal, must_attend_75);
  const can_bunk_90 = calculateCanBunkForThreshold(remainingTotal, must_attend_90);

  const max_possible_attended = attended_so_far + remainingTotal;
  const max_possible_percentage = total_final > 0 ? (max_possible_attended / total_final) * 100 : 100;

  const status = determineStatus(current_percentage, must_attend_75, remainingTotal, can_bunk_90);

  // Future skip planning
  const planned_skips = Math.min(remainingUntilPlanDate, Math.max(0, input.plannedSkips || 0));
  const projected_attended_with_skips = attended_so_far + (remainingTotal - planned_skips);
  const projected_percentage_with_skips = total_final > 0 ? (projected_attended_with_skips / total_final) * 100 : 100;
  const plan_breaks_75 = projected_percentage_with_skips < 75.0;

  // Recovery plan targets per week
  const safeWeeks = Math.max(1, weeksRemaining);
  const weekly_target_75 = Math.ceil(must_attend_75 / safeWeeks);
  const weekly_target_90 = Math.ceil(must_attend_90 / safeWeeks);

  return {
    code: input.code,
    name: input.name,
    type: input.type,
    mode: input.mode,
    held_so_far,
    attended_so_far,
    current_percentage: Number(current_percentage.toFixed(2)),
    remaining_total: remainingTotal,
    remaining_until_plan_date: remainingUntilPlanDate,
    total_final,
    must_attend_75,
    must_attend_90,
    can_bunk_75,
    can_bunk_90,
    status,
    max_possible_percentage: Number(max_possible_percentage.toFixed(2)),
    planned_skips,
    projected_attended_with_skips,
    projected_percentage_with_skips: Number(projected_percentage_with_skips.toFixed(2)),
    plan_breaks_75,
    weekly_target_75,
    weekly_target_90,
  };
}

/**
 * Calculates aggregate stats across all subjects.
 */
export function calculateOverallAttendance(
  subjects: SubjectCalculation[]
): OverallCalculation {
  if (subjects.length === 0) {
    return {
      total_held: 0,
      total_attended: 0,
      current_percentage: 100,
      total_remaining: 0,
      total_final: 0,
      must_attend_75: 0,
      must_attend_90: 0,
      can_bunk_75: 0,
      can_bunk_90: 0,
      max_possible_percentage: 100,
      status: "SAFE_90",
      has_irreversible_detention: false,
      irreversible_subjects: [],
    };
  }

  const total_held = subjects.reduce((sum, s) => sum + s.held_so_far, 0);
  const total_attended = subjects.reduce((sum, s) => sum + s.attended_so_far, 0);
  const total_remaining = subjects.reduce((sum, s) => sum + s.remaining_total, 0);
  const total_final = total_held + total_remaining;

  const current_percentage = total_held > 0 ? (total_attended / total_held) * 100 : 100;
  const max_possible_attended = total_attended + total_remaining;
  const max_possible_percentage = total_final > 0 ? (max_possible_attended / total_final) * 100 : 100;

  const must_attend_75 = calculateRequiredForThreshold(THRESHOLD_DETENTION, total_final, total_attended);
  const must_attend_90 = calculateRequiredForThreshold(THRESHOLD_TARGET, total_final, total_attended);

  const can_bunk_75 = calculateCanBunkForThreshold(total_remaining, must_attend_75);
  const can_bunk_90 = calculateCanBunkForThreshold(total_remaining, must_attend_90);

  const irreversible_subjects = subjects.filter((s) => s.status === "IRREVERSIBLE");
  const has_irreversible_detention = irreversible_subjects.length > 0 || must_attend_75 > total_remaining;

  let status: AttendanceStatus = "SAFE_75";
  if (has_irreversible_detention) {
    status = "IRREVERSIBLE";
  } else if (current_percentage >= 90 && can_bunk_90 > 0) {
    status = "SAFE_90";
  } else if (current_percentage >= 75) {
    status = "SAFE_75";
  } else {
    status = "DANGER";
  }

  return {
    total_held,
    total_attended,
    current_percentage: Number(current_percentage.toFixed(2)),
    total_remaining,
    total_final,
    must_attend_75,
    must_attend_90,
    can_bunk_75,
    can_bunk_90,
    max_possible_percentage: Number(max_possible_percentage.toFixed(2)),
    status,
    has_irreversible_detention,
    irreversible_subjects,
  };
}

// -------------------------------------------------------------
// PHASE 2 EXTENSIONS: LEAVE ENGINE & SIMULATION
// -------------------------------------------------------------

/**
 * Determines period priority when overlapping leaves are present.
 * Priority: OD > MEDICAL > ABSENT
 */
function getStrongestLeaveType(types: LeaveType[]): LeaveType {
  if (types.includes("OD")) return "OD";
  if (types.includes("MEDICAL")) return "MEDICAL";
  return "ABSENT";
}

/**
 * Checks if a slot period falls in morning vs afternoon for half-day leaves.
 * Morning = periods 1, 2, 3. Afternoon = periods 4, 5, 6.
 */
function isPeriodInHalfDay(period: number, halfDayType?: "MORNING" | "AFTERNOON"): boolean {
  if (!halfDayType) return true;
  if (halfDayType === "MORNING") return period <= 3;
  return period >= 4;
}

/**
 * Extracts all scheduled slots affected by a collection of leave entries.
 * Skips Sundays and holidays. Merges overlapping leaves with OD > Medical > Absent priority.
 */
export function getAffectedLeavePeriods(
  leaves: LeaveInput[],
  weekSchedule: WeekSchedule,
  holidays: Holiday[] = [],
  dayOrderOverrides: DayOrderOverride[] = [],
  todayDate: string = "2026-09-28",
  policy: AttendancePolicy = DEFAULT_POLICY
): AffectedPeriod[] {
  const periodMap = new Map<string, { slot: any; types: LeaveType[]; medicalApproved: boolean }>();

  for (const leave of leaves) {
    let curr = parseISO(leave.startDate);
    const end = parseISO(leave.endDate);

    if (isAfter(curr, end)) continue;

    // Check scope
    const allowedScopes = leave.scope && leave.scope !== "ALL" ? leave.scope.split(",").map((s) => s.trim()) : null;

    while (isBefore(curr, end) || isEqual(curr, end)) {
      const dateStr = format(curr, "yyyy-MM-dd");

      // Skip non-semester dates
      if (dateStr < SEMESTER_START || dateStr > SEMESTER_END) {
        curr = addDays(curr, 1);
        continue;
      }

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

      // Check day override or weekday
      const override = dayOrderOverrides.find((o) => o.date === dateStr);
      const dayKey: DayKey | null = override ? override.followsDay : getDayKeyFromDate(curr);

      if (dayKey && weekSchedule[dayKey]) {
        const slots = weekSchedule[dayKey] || [];
        for (const slot of slots) {
          if (allowedScopes && !allowedScopes.includes(slot.subjectCode)) {
            continue;
          }

          if (leave.isHalfDay && !isPeriodInHalfDay(slot.period, leave.halfDayType)) {
            continue;
          }

          const key = `${dateStr}:${slot.period}:${slot.subjectCode}`;
          const existing = periodMap.get(key);
          if (existing) {
            existing.types.push(leave.type);
            if (leave.medicalApproved) existing.medicalApproved = true;
          } else {
            periodMap.set(key, {
              slot,
              types: [leave.type],
              medicalApproved: !!leave.medicalApproved,
            });
          }
        }
      }

      curr = addDays(curr, 1);
    }
  }

  // Resolve final handling per period
  const result: AffectedPeriod[] = [];
  for (const [key, value] of Array.from(periodMap.entries())) {
    const [dateStr, periodStr, subjectCode] = key.split(":");
    const finalType = getStrongestLeaveType(value.types);

    let handling: "AS_PRESENT" | "AS_ABSENT" | "EXCLUDED" = "AS_ABSENT";

    if (finalType === "OD") {
      handling = policy.odHandling; // "AS_PRESENT"
    } else if (finalType === "MEDICAL") {
      handling = value.medicalApproved ? policy.medicalApprovedHandling : policy.medicalDefaultHandling;
    } else {
      handling = "AS_ABSENT";
    }

    result.push({
      date: dateStr,
      period: parseInt(periodStr, 10),
      subjectCode,
      leaveType: finalType,
      handling,
    });
  }

  return result;
}

/**
 * Applies leave entries to a subject's state and returns the updated values.
 */
export function applyLeaves(
  subjectState: SubjectCalculation,
  leaves: LeaveInput[],
  weekSchedule: WeekSchedule,
  holidays: Holiday[] = [],
  dayOrderOverrides: DayOrderOverride[] = [],
  todayDate: string = "2026-09-28",
  policy: AttendancePolicy = DEFAULT_POLICY
): {
  attended: number;
  held: number;
  remaining: number;
  total_final: number;
  percentage: number;
  affectedPeriods: AffectedPeriod[];
} {
  const affected = getAffectedLeavePeriods(
    leaves,
    weekSchedule,
    holidays,
    dayOrderOverrides,
    todayDate,
    policy
  ).filter((p) => p.subjectCode === subjectState.code);

  let newAttended = subjectState.attended_so_far;
  let newHeld = subjectState.held_so_far;
  let newRemaining = subjectState.remaining_total;

  for (const period of affected) {
    const isPast = period.date <= todayDate;

    if (isPast) {
      // Modifies past attendance
      if (period.handling === "AS_PRESENT") {
        newAttended += 1;
      } else if (period.handling === "EXCLUDED") {
        newHeld = Math.max(0, newHeld - 1);
      }
    } else {
      // Future planned absence: period was already included in remaining
      if (period.handling === "AS_PRESENT") {
        // If student gets OD present in future, they get credited attendance
        newAttended += 1;
        newRemaining = Math.max(0, newRemaining - 1);
        newHeld += 1;
      } else if (period.handling === "EXCLUDED") {
        newRemaining = Math.max(0, newRemaining - 1);
      } else {
        // AS_ABSENT in future: will be held, but user misses it
        // It stays in remaining scheduled total, but cannot be attended
      }
    }
  }

  const total_final = newHeld + newRemaining;
  const percentage = total_final > 0 ? (newAttended / total_final) * 100 : 100;

  return {
    attended: newAttended,
    held: newHeld,
    remaining: newRemaining,
    total_final,
    percentage: Number(percentage.toFixed(2)),
    affectedPeriods: affected,
  };
}

/**
 * Simulates a hypothetical leave scenario and computes before/after deltas and status shifts.
 */
export function simulateLeave(
  state: SubjectCalculation,
  leave: LeaveInput,
  weekSchedule: WeekSchedule,
  holidays: Holiday[] = [],
  dayOrderOverrides: DayOrderOverride[] = [],
  todayDate: string = "2026-09-28",
  policy: AttendancePolicy = DEFAULT_POLICY
): LeaveSimulationResult {
  const affected = getAffectedLeavePeriods(
    [leave],
    weekSchedule,
    holidays,
    dayOrderOverrides,
    todayDate,
    policy
  ).filter((p) => p.subjectCode === state.code);

  const beforePct = state.current_percentage;
  const beforeStatus = state.status;

  let missedFutureClasses = 0;
  let creditedODClasses = 0;
  let excludedClasses = 0;

  for (const p of affected) {
    if (p.handling === "AS_PRESENT") {
      creditedODClasses += 1;
    } else if (p.handling === "EXCLUDED") {
      excludedClasses += 1;
    } else {
      missedFutureClasses += 1;
    }
  }

  const effectiveRemaining = Math.max(0, state.remaining_total - missedFutureClasses - excludedClasses);
  const afterTotalFinal = Math.max(1, state.total_final - excludedClasses);

  // Projected attendance at semester end with this leave
  const projectedFinalAttended = state.attended_so_far + creditedODClasses + effectiveRemaining;
  const afterPct = Math.min(100, Math.max(0, (projectedFinalAttended / afterTotalFinal) * 100));

  const must_attend_75 = calculateRequiredForThreshold(THRESHOLD_DETENTION, afterTotalFinal, state.attended_so_far + creditedODClasses);
  const can_bunk_75 = calculateCanBunkForThreshold(effectiveRemaining, must_attend_75);
  const afterStatus = determineStatus(afterPct, must_attend_75, effectiveRemaining, 0);

  const delta = Number((afterPct - beforePct).toFixed(2));
  const crossesThreshold75 = beforePct >= 75.0 && afterPct < 75.0;
  const crossesThreshold90 = beforePct >= 90.0 && afterPct < 90.0;
  const becomesIrreversible = beforeStatus !== "IRREVERSIBLE" && afterStatus === "IRREVERSIBLE";

  return {
    subjectCode: state.code,
    before: {
      attended: state.attended_so_far,
      held: state.held_so_far,
      percentage: state.current_percentage,
      status: state.status,
      remaining: state.remaining_total,
      must_attend_75: state.must_attend_75,
      can_bunk_75: state.can_bunk_75,
    },
    after: {
      attended: state.attended_so_far + creditedODClasses,
      held: state.held_so_far,
      percentage: Number(afterPct.toFixed(2)),
      status: afterStatus,
      remaining: effectiveRemaining,
      must_attend_75,
      can_bunk_75,
    },
    delta,
    crossesThreshold75,
    crossesThreshold90,
    becomesIrreversible,
    affectedPeriodsCount: affected.length,
    affectedPeriods: affected,
  };
}

/**
 * Calculates outcome if student bunks n additional classes.
 */
export function whatIfBunk(
  state: SubjectCalculation,
  subjectCode: string,
  n: number
): {
  projectedPercentage: number;
  status: AttendanceStatus;
  crosses75: boolean;
  canBunkRemaining: number;
} {
  const safeN = Math.max(0, Math.min(state.remaining_total, n));
  // If user skips n classes, attended will be (state.attended_so_far + (remaining - safeN))
  const projectedAttended = state.attended_so_far + (state.remaining_total - safeN);
  const projectedPct = state.total_final > 0 ? (projectedAttended / state.total_final) * 100 : 100;

  const must_attend = calculateRequiredForThreshold(THRESHOLD_DETENTION, state.total_final, state.attended_so_far);
  const canBunkRemaining = Math.max(0, state.can_bunk_75 - safeN);
  const status = determineStatus(projectedPct, must_attend, state.remaining_total - safeN, 0);

  return {
    projectedPercentage: Number(projectedPct.toFixed(2)),
    status,
    crosses75: projectedPct < 75.0,
    canBunkRemaining,
  };
}

/**
 * Finds the maximum consecutive calendar days starting from startDate that can be skipped
 * while keeping subject attendance >= 75% and not irreversible.
 */
export function maxSafeLeaveDays(
  state: SubjectCalculation,
  subjectCode: string,
  startDateStr: string,
  weekSchedule: WeekSchedule,
  holidays: Holiday[] = [],
  dayOrderOverrides: DayOrderOverride[] = []
): number {
  let maxDays = 0;
  const start = parseISO(startDateStr);

  for (let days = 1; days <= 60; days++) {
    const end = addDays(start, days - 1);
    const endDateStr = format(end, "yyyy-MM-dd");

    if (endDateStr > SEMESTER_END) break;

    const sim = simulateLeave(
      state,
      {
        type: "ABSENT",
        startDate: startDateStr,
        endDate: endDateStr,
        scope: subjectCode,
      },
      weekSchedule,
      holidays,
      dayOrderOverrides,
      startDateStr
    );

    if (sim.after.percentage >= 75.0 && !sim.becomesIrreversible) {
      maxDays = days;
    } else {
      break;
    }
  }

  return maxDays;
}
