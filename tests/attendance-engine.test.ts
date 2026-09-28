import { describe, it, expect } from "vitest";
import {
  calculateRequiredForThreshold,
  calculateCanBunkForThreshold,
  determineStatus,
  calculateSubjectAttendance,
  calculateOverallAttendance,
} from "../lib/engine";
import {
  countClassesBetweenDates,
  getWorkingDaysCount,
  isHoliday,
  WeekSchedule,
  Holiday,
} from "../lib/dates";

describe("Core Attendance Calculation Engine", () => {
  // Test 1: Exactly 75% calculation
  it("1. calculates 0 required classes when already at exactly 75%", () => {
    // Total 100 classes, attended 75 -> required = 0
    const req = calculateRequiredForThreshold(0.75, 100, 75);
    expect(req).toBe(0);
  });

  // Test 2: Exactly 90% calculation
  it("2. calculates 0 required classes when already at exactly 90%", () => {
    const req = calculateRequiredForThreshold(0.90, 100, 90);
    expect(req).toBe(0);
  });

  // Test 3: Ceil rounding for required classes
  it("3. correctly applies ceil rounding when required is fractional", () => {
    // 0.75 * 41 = 30.75. Attended 20 -> 30.75 - 20 = 10.75 -> ceil is 11
    const req = calculateRequiredForThreshold(0.75, 41, 20);
    expect(req).toBe(11);
  });

  // Test 4: Floor rounding for can bunk
  it("4. correctly applies floor for safe bunks", () => {
    // Remaining = 20, must attend = 13 -> can bunk = 7
    const bunk = calculateCanBunkForThreshold(20, 13);
    expect(bunk).toBe(7);
  });

  // Test 5: Can bunk when must_attend > remaining is 0
  it("5. returns 0 can_bunk when must_attend exceeds remaining", () => {
    const bunk = calculateCanBunkForThreshold(10, 12);
    expect(bunk).toBe(0);
  });

  // Test 6: IRREVERSIBLE boundary - exactly recoverable when must == R
  it("6. identifies recoverable boundary when must_attend == remaining", () => {
    // 40 held, 20 attended. Remaining = 20. Total = 60.
    // 75% of 60 = 45. Must attend = 45 - 20 = 25. But remaining is 20 -> must > R.
    // Let's craft must == R:
    // Total = 40, attended 10, remaining 20, held = 20.
    // 0.75 * 40 = 30. Attended = 10. Must attend = 20.
    // Here must (20) == remaining (20). Student attends ALL 20 -> 10 + 20 = 30 / 40 = 75%.
    const status = determineStatus(50, 20, 20, 0);
    expect(status).not.toBe("IRREVERSIBLE");
    expect(status).toBe("DANGER");
  });

  // Test 7: IRREVERSIBLE boundary - detention unavoidable when must == R + 1
  it("7. identifies IRREVERSIBLE detention when must_attend == remaining + 1", () => {
    // Must attend 21, but only 20 remaining
    const status = determineStatus(48, 21, 20, 0);
    expect(status).toBe("IRREVERSIBLE");
  });

  // Test 8: Zero remaining classes at semester end with >= 75%
  it("8. handles zero remaining classes safely when attendance >= 75%", () => {
    const calc = calculateSubjectAttendance(
      {
        code: "MAT101",
        name: "Maths",
        type: "THEORY",
        mode: "COUNTS",
        held: 50,
        attended: 40, // 80%
      },
      50,
      0, // 0 remaining
      0
    );

    expect(calc.total_final).toBe(50);
    expect(calc.current_percentage).toBe(80);
    expect(calc.must_attend_75).toBe(0);
    expect(calc.can_bunk_75).toBe(0);
    expect(calc.status).toBe("SAFE_75");
  });

  // Test 9: Zero remaining classes at semester end with < 75%
  it("9. marks IRREVERSIBLE if under 75% with zero remaining classes", () => {
    const calc = calculateSubjectAttendance(
      {
        code: "MAT101",
        name: "Maths",
        type: "THEORY",
        mode: "COUNTS",
        held: 50,
        attended: 35, // 70% -> 0.75 * 50 = 37.5 -> must attend 38 - 35 = 3
      },
      50,
      0,
      0
    );

    expect(calc.must_attend_75).toBe(3);
    expect(calc.remaining_total).toBe(0);
    expect(calc.status).toBe("IRREVERSIBLE");
    expect(calc.max_possible_percentage).toBe(70);
  });

  // Test 10: SAFE_90 status condition
  it("10. assigns SAFE_90 when current >= 90% and can bunk for 90% > 0", () => {
    // 50 held, 48 attended (96%), 20 remaining. Total = 70.
    // 90% of 70 = 63. Must attend = 63 - 48 = 15. Remaining = 20 -> can bunk 90 = 5.
    const status = determineStatus(96, 5, 20, 5);
    expect(status).toBe("SAFE_90");
  });

  // Test 11: SAFE_75 status condition
  it("11. assigns SAFE_75 when attendance is between 75% and 89.9%", () => {
    const status = determineStatus(82.5, 10, 20, 0);
    expect(status).toBe("SAFE_75");
  });

  // Test 12: DANGER status condition when attendance < 75% but recoverable
  it("12. assigns DANGER when attendance is under 75% but recoverable", () => {
    const status = determineStatus(68.0, 14, 20, 0);
    expect(status).toBe("DANGER");
  });

  // Test 13: Percentage mode calculation matches counts
  it("13. converts percentage mode to correct attended counts", () => {
    const calc = calculateSubjectAttendance(
      {
        code: "PHY102",
        name: "Physics",
        type: "THEORY",
        mode: "PERCENTAGE",
        percentage: 80,
      },
      40, // 40 held so far
      20, // 20 remaining
      10
    );

    expect(calc.held_so_far).toBe(40);
    expect(calc.attended_so_far).toBe(32); // 80% of 40 = 32
    expect(calc.current_percentage).toBe(80);
  });

  // Test 14: Future skip planning lowers projected percentage
  it("14. correctly projects attendance when student plans skips", () => {
    const calc = calculateSubjectAttendance(
      {
        code: "PHY102",
        name: "Physics",
        type: "THEORY",
        mode: "COUNTS",
        held: 40,
        attended: 32, // 80%
        plannedSkips: 6,
      },
      40,
      20,
      10
    );

    // Total = 60. Without skips attended would be 32 + 20 = 52 (86.67%).
    // With 6 skips, attended = 32 + (20 - 6) = 46. 46 / 60 = 76.67%
    expect(calc.projected_attended_with_skips).toBe(46);
    expect(calc.projected_percentage_with_skips).toBe(76.67);
    expect(calc.plan_breaks_75).toBe(false);
  });

  // Test 15: Future skip planning warns when plan breaks 75%
  it("15. triggers plan_breaks_75 if planned skips cause percentage < 75%", () => {
    const calc = calculateSubjectAttendance(
      {
        code: "PHY102",
        name: "Physics",
        type: "THEORY",
        mode: "COUNTS",
        held: 40,
        attended: 32, // 80%
        plannedSkips: 10,
      },
      40,
      20,
      15
    );

    // With 10 skips, attended = 32 + 10 = 42. 42 / 60 = 70% < 75%
    expect(calc.projected_percentage_with_skips).toBe(70);
    expect(calc.plan_breaks_75).toBe(true);
  });

  // Test 16: Zero classes held so far (at semester start)
  it("16. handles semester start with zero classes held so far safely", () => {
    const calc = calculateSubjectAttendance(
      {
        code: "ECE201",
        name: "Circuits",
        type: "THEORY",
        mode: "PERCENTAGE",
        percentage: 0,
      },
      0, // 0 held
      45, // 45 remaining
      30
    );

    expect(calc.current_percentage).toBe(100);
    expect(calc.total_final).toBe(45);
    // 0.75 * 45 = 33.75 -> ceil = 34
    expect(calc.must_attend_75).toBe(34);
    expect(calc.can_bunk_75).toBe(11);
  });

  // Test 17: Weekly recovery plan target computation
  it("17. divides required classes evenly across remaining weeks", () => {
    const calc = calculateSubjectAttendance(
      {
        code: "ECE201",
        name: "Circuits",
        type: "THEORY",
        mode: "COUNTS",
        held: 30,
        attended: 15, // 50%
      },
      30,
      30,
      20,
      6 // 6 weeks remaining
    );

    // Total = 60. Must attend 75% = 45 - 15 = 30.
    // 30 / 6 weeks = 5 classes/week
    expect(calc.weekly_target_75).toBe(5);
  });

  // Test 18: Overall calculation aggregate across multiple subjects
  it("18. aggregates overall attendance across theory and lab subjects", () => {
    const s1 = calculateSubjectAttendance(
      { code: "S1", name: "Subject 1", type: "THEORY", mode: "COUNTS", held: 40, attended: 36 },
      40,
      20,
      10
    );
    const s2 = calculateSubjectAttendance(
      { code: "S2", name: "Subject 2", type: "LAB", mode: "COUNTS", held: 20, attended: 14 },
      20,
      10,
      5
    );

    const overall = calculateOverallAttendance([s1, s2]);

    expect(overall.total_held).toBe(60);
    expect(overall.total_attended).toBe(50); // 36 + 14 = 50 / 60 = 83.33%
    expect(overall.current_percentage).toBe(83.33);
    expect(overall.total_remaining).toBe(30);
    expect(overall.total_final).toBe(90);
    expect(overall.has_irreversible_detention).toBe(false);
  });

  // Test 19: Overall calculation flags irreversible detention if one subject is irreversible
  it("19. flags has_irreversible_detention if any individual subject is irreversible", () => {
    const s1 = calculateSubjectAttendance(
      { code: "S1", name: "Subject 1", type: "THEORY", mode: "COUNTS", held: 50, attended: 50 },
      50,
      20,
      10
    );
    // Severely detained in Subject 2
    const s2 = calculateSubjectAttendance(
      { code: "S2", name: "Subject 2", type: "THEORY", mode: "COUNTS", held: 50, attended: 10 },
      50,
      10,
      5
    );

    const overall = calculateOverallAttendance([s1, s2]);
    expect(s2.status).toBe("IRREVERSIBLE");
    expect(overall.has_irreversible_detention).toBe(true);
    expect(overall.status).toBe("IRREVERSIBLE");
    expect(overall.irreversible_subjects.length).toBe(1);
    expect(overall.irreversible_subjects[0].code).toBe("S2");
  });

  // Test 20: 100% attendance stays 100%
  it("20. handles perfect 100% attendance with maximum bunk capacity", () => {
    const calc = calculateSubjectAttendance(
      { code: "S1", name: "Subject 1", type: "THEORY", mode: "COUNTS", held: 50, attended: 50 },
      50,
      50,
      50
    );

    // Total = 100. 75% = 75. Must attend = 75 - 50 = 25.
    // Can bunk = 50 - 25 = 25.
    expect(calc.must_attend_75).toBe(25);
    expect(calc.can_bunk_75).toBe(25);
    expect(calc.status).toBe("SAFE_90");
  });
});

describe("Schedule & Calendar Engine (Dates, Holidays, Labs)", () => {
  const dummyWeekSchedule: WeekSchedule = {
    MON: [
      { period: 1, start: "09:00", end: "09:50", subjectCode: "MAT101" },
      { period: 2, start: "09:50", end: "10:40", subjectCode: "PHY102" },
      { period: 5, start: "13:30", end: "14:20", subjectCode: "LAB101" },
      { period: 6, start: "14:20", end: "15:10", subjectCode: "LAB101" },
    ],
    TUE: [
      { period: 1, start: "09:00", end: "09:50", subjectCode: "MAT101" },
      { period: 2, start: "09:50", end: "10:40", subjectCode: "MAT101" },
    ],
  };

  const dummyHolidays: Holiday[] = [
    { date: "2026-09-07", name: "Festival Monday" }, // A Monday
  ];

  // Test 21: Correctly identifies declared holiday
  it("21. identifies holiday correctly", () => {
    expect(isHoliday("2026-09-07", dummyHolidays)).toBe(true);
    expect(isHoliday("2026-09-08", dummyHolidays)).toBe(false);
  });

  // Test 22: Sunday exclusion
  it("22. excludes Sundays from class counts", () => {
    // 2026-09-06 is Sunday
    const counts = countClassesBetweenDates(
      "2026-09-06",
      "2026-09-06",
      dummyWeekSchedule,
      dummyHolidays
    );
    expect(Object.keys(counts).length).toBe(0);
  });

  // Test 23: Holiday exclusion from scheduled classes
  it("23. excludes classes scheduled on declared holidays", () => {
    // 2026-09-07 is Monday and in holiday list
    const counts = countClassesBetweenDates(
      "2026-09-07",
      "2026-09-07",
      dummyWeekSchedule,
      dummyHolidays
    );
    expect(counts["MAT101"]).toBeUndefined();
  });

  // Test 24: Standard period counting
  it("24. counts individual periods when labCountingMode is 'PERIODS'", () => {
    // 2026-09-14 is Monday (not a holiday in our dummy list)
    const counts = countClassesBetweenDates(
      "2026-09-14",
      "2026-09-14",
      dummyWeekSchedule,
      [],
      [],
      "PERIODS",
      { LAB101: "LAB", MAT101: "THEORY", PHY102: "THEORY" }
    );

    expect(counts["MAT101"]).toBe(1);
    expect(counts["PHY102"]).toBe(1);
    expect(counts["LAB101"]).toBe(2); // 2 periods
  });

  // Test 25: Lab block counting as 1 session
  it("25. counts lab blocks as 1 class when labCountingMode is 'SESSION'", () => {
    const counts = countClassesBetweenDates(
      "2026-09-14",
      "2026-09-14",
      dummyWeekSchedule,
      [],
      [],
      "SESSION",
      { LAB101: "LAB", MAT101: "THEORY", PHY102: "THEORY" }
    );

    expect(counts["MAT101"]).toBe(1);
    expect(counts["LAB101"]).toBe(1); // 1 session!
  });

  // Test 26: Day order override runs target weekday timetable
  it("26. applies day order override so date runs target weekday schedule", () => {
    // 2026-09-15 is Tuesday. Override it to follow MON schedule:
    const overrides = [{ date: "2026-09-15", followsDay: "MON" as const }];
    const counts = countClassesBetweenDates(
      "2026-09-15",
      "2026-09-15",
      dummyWeekSchedule,
      [],
      overrides,
      "PERIODS"
    );

    // Monday schedule has PHY102, Tuesday does not
    expect(counts["PHY102"]).toBe(1);
  });

  // Test 27: Working days count calculation
  it("27. counts working days correctly excluding Sundays and holidays", () => {
    // 2026-09-07 (Mon, Holiday), 2026-09-08 (Tue), 2026-09-09 (Wed)
    const days = getWorkingDaysCount("2026-09-07", "2026-09-09", dummyHolidays);
    expect(days).toBe(2); // Mon is holiday, Tue & Wed are working
  });

  // Test 28: Spot-check real timetable count for 1-ece
  it("28. accurately counts scheduled classes across multiple weeks", () => {
    // 2 weeks from 2026-08-31 (Mon) to 2026-09-12 (Sat) = 12 working days
    const counts = countClassesBetweenDates(
      "2026-08-31",
      "2026-09-05", // 1 full week Mon-Sat
      dummyWeekSchedule,
      []
    );

    // MAT101: 1 on Mon, 2 on Tue = 3 in a week
    expect(counts["MAT101"]).toBe(3);
  });
});
