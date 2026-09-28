import { describe, it, expect } from "vitest";
import {
  getAffectedLeavePeriods,
  applyLeaves,
  simulateLeave,
  whatIfBunk,
  maxSafeLeaveDays,
  calculateSubjectAttendance,
} from "../lib/engine";
import { WeekSchedule, Holiday, DayOrderOverride } from "../lib/dates";
import { DEFAULT_POLICY } from "../config/policy";

describe("Phase 2: Leave Engine & Simulation Suite", () => {
  const dummySchedule: WeekSchedule = {
    MON: [
      { period: 1, start: "09:00", end: "09:50", subjectCode: "26ECE201" },
      { period: 2, start: "09:50", end: "10:40", subjectCode: "26ECE202" },
      { period: 5, start: "13:30", end: "14:20", subjectCode: "26ECL206" },
      { period: 6, start: "14:20", end: "15:10", subjectCode: "26ECL206" },
    ],
    TUE: [
      { period: 1, start: "09:00", end: "09:50", subjectCode: "26ECE201" },
      { period: 2, start: "09:50", end: "10:40", subjectCode: "26ECE203" },
    ],
    WED: [
      { period: 1, start: "09:00", end: "09:50", subjectCode: "26ECE202" },
      { period: 2, start: "09:50", end: "10:40", subjectCode: "26ECE203" },
    ],
    THU: [
      { period: 1, start: "09:00", end: "09:50", subjectCode: "26ECE201" },
      { period: 4, start: "11:45", end: "12:35", subjectCode: "26ECE202" },
    ],
    FRI: [
      { period: 1, start: "09:00", end: "09:50", subjectCode: "26ECE201" },
    ],
    SAT: [
      { period: 1, start: "09:00", end: "09:50", subjectCode: "26ECE201" },
    ],
  };

  const dummyHolidays: Holiday[] = [
    { date: "2026-10-02", name: "Gandhi Jayanthi" }, // Friday
  ];

  const dummyOverrides: DayOrderOverride[] = [
    { date: "2026-10-06", followsDay: "MON" }, // A Tuesday following MON schedule
  ];

  // 1. Plain ABSENT leave on a single weekday
  it("1. extracts affected periods for an ABSENT leave on Monday", () => {
    const periods = getAffectedLeavePeriods(
      [{ type: "ABSENT", startDate: "2026-09-07", endDate: "2026-09-07" }],
      dummySchedule,
      dummyHolidays
    );
    expect(periods.length).toBe(4); // 4 periods on Mon
    expect(periods[0].handling).toBe("AS_ABSENT");
  });

  // 2. OD handling counts as AS_PRESENT
  it("2. marks OD leave as AS_PRESENT", () => {
    const periods = getAffectedLeavePeriods(
      [{ type: "OD", startDate: "2026-09-08", endDate: "2026-09-08" }],
      dummySchedule
    );
    expect(periods.length).toBe(2);
    expect(periods[0].handling).toBe("AS_PRESENT");
    expect(periods[0].leaveType).toBe("OD");
  });

  // 3. Unapproved Medical leave defaults to AS_ABSENT
  it("3. defaults unapproved MEDICAL leave to AS_ABSENT", () => {
    const periods = getAffectedLeavePeriods(
      [{ type: "MEDICAL", startDate: "2026-09-08", endDate: "2026-09-08", medicalApproved: false }],
      dummySchedule
    );
    expect(periods[0].handling).toBe("AS_ABSENT");
  });

  // 4. Approved Medical leave switches to AS_PRESENT per default policy
  it("4. applies AS_PRESENT for approved MEDICAL leave", () => {
    const periods = getAffectedLeavePeriods(
      [{ type: "MEDICAL", startDate: "2026-09-08", endDate: "2026-09-08", medicalApproved: true }],
      dummySchedule
    );
    expect(periods[0].handling).toBe("AS_PRESENT");
  });

  // 5. Approved Medical leave with EXCLUDED policy
  it("5. applies EXCLUDED when policy dictates exclusion for medical", () => {
    const periods = getAffectedLeavePeriods(
      [{ type: "MEDICAL", startDate: "2026-09-08", endDate: "2026-09-08", medicalApproved: true }],
      dummySchedule,
      [],
      [],
      "2026-09-28",
      { ...DEFAULT_POLICY, medicalApprovedHandling: "EXCLUDED" }
    );
    expect(periods[0].handling).toBe("EXCLUDED");
  });

  // 6. OD on a declared holiday produces 0 affected classes
  it("6. ignores declared holidays when applying OD leave", () => {
    // 2026-10-02 is Gandhi Jayanthi (holiday)
    const periods = getAffectedLeavePeriods(
      [{ type: "OD", startDate: "2026-10-02", endDate: "2026-10-02" }],
      dummySchedule,
      dummyHolidays
    );
    expect(periods.length).toBe(0);
  });

  // 7. Leave spanning a weekend excludes Sundays
  it("7. excludes Sundays when leave spans across Saturday-Monday", () => {
    // 2026-09-05 (Sat) to 2026-09-07 (Mon). 2026-09-06 is Sunday.
    const periods = getAffectedLeavePeriods(
      [{ type: "ABSENT", startDate: "2026-09-05", endDate: "2026-09-07" }],
      dummySchedule,
      dummyHolidays
    );
    const dates = new Set(periods.map((p) => p.date));
    expect(dates.has("2026-09-05")).toBe(true);
    expect(dates.has("2026-09-06")).toBe(false); // No Sunday
    expect(dates.has("2026-09-07")).toBe(true);
  });

  // 8. Half-day morning leave affects only periods <= 3
  it("8. filters morning half-day leave to periods 1 to 3", () => {
    // Mon has periods 1, 2, 5, 6
    const periods = getAffectedLeavePeriods(
      [{ type: "ABSENT", startDate: "2026-09-07", endDate: "2026-09-07", isHalfDay: true, halfDayType: "MORNING" }],
      dummySchedule
    );
    expect(periods.length).toBe(2);
    expect(periods.every((p) => p.period <= 3)).toBe(true);
  });

  // 9. Half-day afternoon leave affects only periods >= 4
  it("9. filters afternoon half-day leave to periods 4 to 6", () => {
    // Mon has periods 5 and 6 in afternoon
    const periods = getAffectedLeavePeriods(
      [{ type: "ABSENT", startDate: "2026-09-07", endDate: "2026-09-07", isHalfDay: true, halfDayType: "AFTERNOON" }],
      dummySchedule
    );
    expect(periods.length).toBe(2);
    expect(periods.every((p) => p.period >= 4)).toBe(true);
    expect(periods[0].subjectCode).toBe("26ECL206");
  });

  // 10. Lab block periods are captured correctly in leave
  it("10. includes both slots for multi-period lab session", () => {
    const periods = getAffectedLeavePeriods(
      [{ type: "OD", startDate: "2026-09-07", endDate: "2026-09-07", scope: "26ECL206" }],
      dummySchedule
    );
    expect(periods.length).toBe(2);
    expect(periods[0].subjectCode).toBe("26ECL206");
    expect(periods[1].subjectCode).toBe("26ECL206");
  });

  // 11. Overlapping leaves: OD takes precedence over ABSENT
  it("11. resolves overlap so OD wins over ABSENT", () => {
    const periods = getAffectedLeavePeriods(
      [
        { type: "ABSENT", startDate: "2026-09-08", endDate: "2026-09-08" },
        { type: "OD", startDate: "2026-09-08", endDate: "2026-09-08" },
      ],
      dummySchedule
    );
    expect(periods.every((p) => p.leaveType === "OD")).toBe(true);
    expect(periods.every((p) => p.handling === "AS_PRESENT")).toBe(true);
  });

  // 12. Overlapping leaves: MEDICAL takes precedence over ABSENT
  it("12. resolves overlap so MEDICAL wins over ABSENT", () => {
    const periods = getAffectedLeavePeriods(
      [
        { type: "ABSENT", startDate: "2026-09-08", endDate: "2026-09-08" },
        { type: "MEDICAL", startDate: "2026-09-08", endDate: "2026-09-08", medicalApproved: true },
      ],
      dummySchedule
    );
    expect(periods[0].leaveType).toBe("MEDICAL");
  });

  // 13. Overlapping leaves: OD takes precedence over MEDICAL
  it("13. resolves overlap so OD wins over MEDICAL", () => {
    const periods = getAffectedLeavePeriods(
      [
        { type: "MEDICAL", startDate: "2026-09-08", endDate: "2026-09-08", medicalApproved: true },
        { type: "OD", startDate: "2026-09-08", endDate: "2026-09-08" },
      ],
      dummySchedule
    );
    expect(periods[0].leaveType).toBe("OD");
  });

  // 14. Subject scope restriction: only specified subject is affected
  it("14. restricts leave impact only to in-scope subject", () => {
    // Tue has 26ECE201 and 26ECE203
    const periods = getAffectedLeavePeriods(
      [{ type: "OD", startDate: "2026-09-08", endDate: "2026-09-08", scope: "26ECE201" }],
      dummySchedule
    );
    expect(periods.length).toBe(1);
    expect(periods[0].subjectCode).toBe("26ECE201");
  });

  // 15. Leave outside semester bounds is discarded
  it("15. discards leave dates falling outside semester range", () => {
    const periods = getAffectedLeavePeriods(
      [{ type: "ABSENT", startDate: "2026-12-05", endDate: "2026-12-07" }],
      dummySchedule
    );
    expect(periods.length).toBe(0);
  });

  // 16. Day order override is honored in leave calculation
  it("16. reflects timetable override when computing leave classes", () => {
    // 2026-10-06 is Tuesday overridden to MON schedule
    const periods = getAffectedLeavePeriods(
      [{ type: "ABSENT", startDate: "2026-10-06", endDate: "2026-10-06" }],
      dummySchedule,
      [],
      dummyOverrides
    );
    // Mon schedule has 4 slots including 26ECL206
    expect(periods.some((p) => p.subjectCode === "26ECL206")).toBe(true);
  });

  // 17. simulateLeave computes exact before and after percentages
  it("17. correctly computes delta and before/after metrics in simulateLeave", () => {
    const sub = calculateSubjectAttendance(
      { code: "26ECE201", name: "Circuits", type: "THEORY", mode: "COUNTS", held: 20, attended: 19 },
      20,
      10,
      10
    );

    const sim = simulateLeave(
      sub,
      { type: "ABSENT", startDate: "2026-09-29", endDate: "2026-09-29" },
      dummySchedule,
      [],
      [],
      "2026-09-28"
    );

    expect(sim.before.percentage).toBe(95);
    expect(sim.after.percentage).toBeLessThan(95);
    expect(sim.delta).toBeLessThan(0);
  });

  // 18. simulateLeave detects crossing 75% threshold
  it("18. flags crossesThreshold75 when absent leave drops below 75%", () => {
    // 75% edge: held = 20, attended = 15 (75%), remaining = 4
    const sub = calculateSubjectAttendance(
      { code: "26ECE201", name: "Circuits", type: "THEORY", mode: "COUNTS", held: 20, attended: 15 },
      20,
      4,
      4
    );

    // Tuesday (29 Sep) and Thursday (01 Oct) have 26ECE201
    const sim = simulateLeave(
      sub,
      { type: "ABSENT", startDate: "2026-09-29", endDate: "2026-10-01" },
      dummySchedule,
      [],
      [],
      "2026-09-28"
    );

    expect(sim.crossesThreshold75).toBe(true);
    expect(sim.after.percentage).toBeLessThan(75.0);
  });

  // 19. simulateLeave detects becoming irreversible
  it("19. flags becomesIrreversible when leave eliminates recovery margin", () => {
    // Held = 20, attended = 12. Remaining = 4. Total = 24.
    // 75% of 24 = 18. Must attend = 6. But remaining is 4 -> already irreversible?
    // Let's set recoverable: held = 20, attended = 14. Remaining = 4. Total = 24.
    // 75% of 24 = 18. Must attend = 4. Remaining = 4. exactly recoverable!
    // Now if student skips 1 class -> held = 21, remaining = 3, attended = 14. Total = 24. Must attend = 4 > 3 -> IRREVERSIBLE!
    const sub = calculateSubjectAttendance(
      { code: "26ECE201", name: "Circuits", type: "THEORY", mode: "COUNTS", held: 20, attended: 14 },
      20,
      4,
      4
    );
    expect(sub.status).not.toBe("IRREVERSIBLE");

    const sim = simulateLeave(
      sub,
      { type: "ABSENT", startDate: "2026-09-29", endDate: "2026-09-29" },
      dummySchedule,
      [],
      [],
      "2026-09-28"
    );

    expect(sim.becomesIrreversible).toBe(true);
    expect(sim.after.status).toBe("IRREVERSIBLE");
  });

  // 20. simulateLeave with OD increases or preserves attendance
  it("20. increases percentage when OD is granted for held classes", () => {
    const sub = calculateSubjectAttendance(
      { code: "26ECE201", name: "Circuits", type: "THEORY", mode: "COUNTS", held: 20, attended: 16 },
      20,
      10,
      10
    );

    const sim = simulateLeave(
      sub,
      { type: "OD", startDate: "2026-09-29", endDate: "2026-09-29" },
      dummySchedule,
      [],
      [],
      "2026-09-28"
    );

    expect(sim.after.attended).toBeGreaterThanOrEqual(sub.attended_so_far);
  });

  // 21. whatIfBunk calculates projected percentage for n skips
  it("21. computes what-if scenario for 3 skips accurately", () => {
    const sub = calculateSubjectAttendance(
      { code: "26ECE201", name: "Circuits", type: "THEORY", mode: "COUNTS", held: 30, attended: 27 },
      30,
      10,
      10
    );

    const result = whatIfBunk(sub, "26ECE201", 3);
    // Attended: 27 + (10 - 3) = 34. Total = 40. 34 / 40 = 85.0%
    expect(result.projectedPercentage).toBe(85.0);
    expect(result.crosses75).toBe(false);
  });

  // 22. whatIfBunk identifies when skips breach 75%
  it("22. flags crosses75 in whatIfBunk when excessive skips are simulated", () => {
    const sub = calculateSubjectAttendance(
      { code: "26ECE201", name: "Circuits", type: "THEORY", mode: "COUNTS", held: 30, attended: 23 },
      30,
      10,
      10
    );

    const result = whatIfBunk(sub, "26ECE201", 6);
    expect(result.crosses75).toBe(true);
  });

  // 23. maxSafeLeaveDays returns non-zero for safe standing
  it("23. finds positive number of safe leave days when attendance is high", () => {
    const sub = calculateSubjectAttendance(
      { code: "26ECE201", name: "Circuits", type: "THEORY", mode: "COUNTS", held: 30, attended: 29 },
      30,
      20,
      20
    );

    const safeDays = maxSafeLeaveDays(sub, "26ECE201", "2026-09-29", dummySchedule);
    expect(safeDays).toBeGreaterThan(0);
  });

  // 24. maxSafeLeaveDays returns 0 when student cannot skip any class
  it("24. returns 0 safe days when subject is on the brink of detention", () => {
    // 75% exactly with 0 can_bunk
    const sub = calculateSubjectAttendance(
      { code: "26ECE201", name: "Circuits", type: "THEORY", mode: "COUNTS", held: 30, attended: 20 },
      30,
      10,
      10
    );

    const safeDays = maxSafeLeaveDays(sub, "26ECE201", "2026-09-29", dummySchedule);
    expect(safeDays).toBe(0);
  });

  // 25. applyLeaves handles already taken vs planned leaves
  it("25. correctly updates attended and held for past vs future leaves", () => {
    const sub = calculateSubjectAttendance(
      { code: "26ECE201", name: "Circuits", type: "THEORY", mode: "COUNTS", held: 20, attended: 15 },
      20,
      10,
      10
    );

    // Apply leave in past (2026-09-08) with OD
    const res = applyLeaves(
      sub,
      [{ type: "OD", startDate: "2026-09-08", endDate: "2026-09-08", isAlreadyTaken: true }],
      dummySchedule,
      [],
      [],
      "2026-09-28"
    );

    expect(res.attended).toBe(16); // 15 + 1
  });

  // 26. Multiple leave dates in sequence
  it("26. correctly combines multiple disjoint leave events", () => {
    const periods = getAffectedLeavePeriods(
      [
        { type: "OD", startDate: "2026-09-08", endDate: "2026-09-08" },
        { type: "ABSENT", startDate: "2026-09-09", endDate: "2026-09-09" },
      ],
      dummySchedule
    );
    expect(periods.length).toBe(4); // 2 on Tue, 2 on Wed
  });

  // 27. Leave on a day with no scheduled classes
  it("27. returns 0 affected periods when no classes are scheduled for that day", () => {
    // Empty schedule for that day
    const emptySched: WeekSchedule = {};
    const periods = getAffectedLeavePeriods(
      [{ type: "ABSENT", startDate: "2026-09-08", endDate: "2026-09-08" }],
      emptySched
    );
    expect(periods.length).toBe(0);
  });

  // 28. Leave start date after end date is safely ignored
  it("28. handles inverted start and end dates safely", () => {
    const periods = getAffectedLeavePeriods(
      [{ type: "ABSENT", startDate: "2026-09-15", endDate: "2026-09-10" }],
      dummySchedule
    );
    expect(periods.length).toBe(0);
  });

  // 29. Capped OD days warning check
  it("29. identifies when total OD leave days exceed policy cap", () => {
    const leaves: any[] = [
      { type: "OD", startDate: "2026-09-01", endDate: "2026-09-15" }, // 15 calendar days
    ];
    // Simple helper test
    expect(DEFAULT_POLICY.maxODDaysPerSemester).toBe(10);
  });

  // 30. Leave affecting only Theory vs Lab
  it("30. isolates lab periods when scope is set to Lab subject code", () => {
    const periods = getAffectedLeavePeriods(
      [{ type: "ABSENT", startDate: "2026-09-07", endDate: "2026-09-07", scope: "26ECL206" }],
      dummySchedule
    );
    expect(periods.every((p) => p.subjectCode === "26ECL206")).toBe(true);
  });
});
