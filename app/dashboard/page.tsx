"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useAttendanceStore } from "@/lib/store";
import {
  calculateSubjectAttendance,
  calculateOverallAttendance,
  simulateLeave,
  SubjectCalculation,
  SubjectInput,
  LeaveInput,
  SEMESTER_START,
  SEMESTER_END,
} from "@/lib/engine";
import { countClassesBetweenDates, getWorkingDaysCount, Holiday } from "@/lib/dates";
import { DEFAULT_POLICY } from "@/config/policy";
import { KPIStrip } from "@/components/dashboard/KPIStrip";
import { SubjectCard } from "@/components/dashboard/SubjectCard";
import { AttendanceProjectionChart } from "@/components/dashboard/AttendanceProjectionChart";
import { RecoveryPlanView } from "@/components/dashboard/RecoveryPlanView";
import { FutureSkipPlanner } from "@/components/dashboard/FutureSkipPlanner";
import { SnapshotsView } from "@/components/dashboard/SnapshotsView";
import { IrreversibleAlert } from "@/components/nb/IrreversibleAlert";
import { NBTabs } from "@/components/nb/NBTabs";
import { NBButton } from "@/components/nb/NBButton";
import { HealthGauge } from "@/components/charts/HealthGauge";
import { SubjectComparisonBars } from "@/components/charts/SubjectComparisonBars";
import { ClassesBudgetDonut } from "@/components/charts/ClassesBudgetDonut";
import { WeeklyHeatmap } from "@/components/charts/WeeklyHeatmap";
import { RiskLeaderboard } from "@/components/charts/RiskLeaderboard";
import { LeaveList } from "@/components/leaves/LeaveList";
import { LeaveModal } from "@/components/leaves/LeaveModal";
import { BeforeAfterCard } from "@/components/leaves/BeforeAfterCard";
import {
  Calendar,
  Lock,
  RefreshCw,
  Sliders,
  Filter,
  Layers,
  Sparkles,
  Printer,
  SlidersHorizontal,
} from "lucide-react";
import { differenceInCalendarDays, parseISO } from "date-fns";

import { STATIC_TIMETABLES, STATIC_HOLIDAYS } from "@/lib/staticData";

export default function DashboardPage() {
  const { data: session } = useSession();
  const {
    sectionId,
    setSectionId,
    todayDate,
    planningDate,
    setPlanningDate,
    includeHolidays,
    setIncludeHolidays,
    todayClassesDone,
    setTodayClassesDone,
    labCountingMode,
    setLabCountingMode,
    subjectInputs,
    setSubjectInput,
    resetInputs,
  } = useAttendanceStore();

  const [timetablesData, setTimetablesData] = useState<Record<string, any>>(STATIC_TIMETABLES);
  const [holidaysData, setHolidaysData] = useState<Holiday[]>(STATIC_HOLIDAYS);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Phase 2 Leave Simulator State
  const [simulatedLeaves, setSimulatedLeaves] = useState<LeaveInput[]>([
    {
      id: "demo-od-1",
      type: "OD",
      startDate: "2026-10-05",
      endDate: "2026-10-06",
      scope: "ALL",
      note: "SRM National Technical Symposium",
    },
  ]);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // Load section timetable data & saved leaves
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/sections");
        if (res.ok) {
          const data = await res.json();
          if (data.timetables && Object.keys(data.timetables).length > 0) {
            setTimetablesData(data.timetables);
          }
          if (data.holidays && data.holidays.length > 0) {
            setHolidaysData(data.holidays);
          }
        }

        const leavesRes = await fetch("/api/leaves");
        if (leavesRes.ok) {
          const leavesJson = await leavesRes.json();
          if (leavesJson.leaves && leavesJson.leaves.length > 0) {
            setSimulatedLeaves(leavesJson.leaves);
          }
        } else {
          // Fallback to localStorage for static deployments
          if (typeof window !== "undefined") {
            const saved = localStorage.getItem("attendance_leaves_storage");
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setSimulatedLeaves(parsed);
                }
              } catch (_) {}
            }
          }
        }
      } catch (err) {
        console.warn("API route not available, using client-side static storage:", err);
      }
    }
    loadData();
  }, []);

  // Update section from session if user has a configured section
  useEffect(() => {
    if (session?.user && (session.user as any).sectionId && !sectionId) {
      setSectionId((session.user as any).sectionId);
    }
  }, [session, sectionId, setSectionId]);

  const currentTimetable = timetablesData[sectionId] || null;
  const activeHolidays = includeHolidays ? holidaysData : [];

  const subjectTypeMap = useMemo(() => {
    const map: Record<string, "THEORY" | "LAB"> = {};
    if (currentTimetable?.subjects) {
      for (const s of currentTimetable.subjects) {
        map[s.code] = s.type;
      }
    }
    return map;
  }, [currentTimetable]);

  const scheduledHeldCounts = useMemo(() => {
    if (!currentTimetable) return {};
    const effectiveEndDate = todayClassesDone ? todayDate : "2026-09-27";
    return countClassesBetweenDates(
      SEMESTER_START,
      effectiveEndDate,
      currentTimetable.week || {},
      activeHolidays,
      currentTimetable.dayOrderOverrides || [],
      labCountingMode,
      subjectTypeMap
    );
  }, [currentTimetable, todayClassesDone, todayDate, activeHolidays, labCountingMode, subjectTypeMap]);

  const remainingTotalCounts = useMemo(() => {
    if (!currentTimetable) return {};
    const effectiveStartDate = todayClassesDone ? "2026-09-29" : todayDate;
    return countClassesBetweenDates(
      effectiveStartDate,
      SEMESTER_END,
      currentTimetable.week || {},
      activeHolidays,
      currentTimetable.dayOrderOverrides || [],
      labCountingMode,
      subjectTypeMap
    );
  }, [currentTimetable, todayClassesDone, todayDate, activeHolidays, labCountingMode, subjectTypeMap]);

  const remainingUntilPlanCounts = useMemo(() => {
    if (!currentTimetable) return {};
    const effectiveStartDate = todayClassesDone ? "2026-09-29" : todayDate;
    return countClassesBetweenDates(
      effectiveStartDate,
      planningDate,
      currentTimetable.week || {},
      activeHolidays,
      currentTimetable.dayOrderOverrides || [],
      labCountingMode,
      subjectTypeMap
    );
  }, [currentTimetable, todayClassesDone, todayDate, planningDate, activeHolidays, labCountingMode, subjectTypeMap]);

  const daysLeft = Math.max(0, differenceInCalendarDays(parseISO(SEMESTER_END), parseISO(todayDate)));
  const workingDaysLeft = getWorkingDaysCount(todayDate, SEMESTER_END, activeHolidays);
  const weeksRemaining = Math.max(1, Math.ceil(daysLeft / 7));

  // Run calculation engine for all subjects
  const subjectCalculations: SubjectCalculation[] = useMemo(() => {
    if (!currentTimetable?.subjects) return [];

    return currentTimetable.subjects.map((sub: any) => {
      const storedInput: Partial<SubjectInput> = subjectInputs[sub.code] || {};
      const fullInput: SubjectInput = {
        code: sub.code,
        name: sub.name,
        type: sub.type,
        mode: storedInput.mode || "COUNTS",
        percentage: storedInput.percentage,
        attended: storedInput.attended,
        held: storedInput.held,
        plannedSkips: storedInput.plannedSkips || 0,
      };

      const scheduledHeld = scheduledHeldCounts[sub.code] || 0;
      const remainingTotal = remainingTotalCounts[sub.code] || 0;
      const remainingPlan = remainingUntilPlanCounts[sub.code] || 0;

      return calculateSubjectAttendance(
        fullInput,
        scheduledHeld,
        remainingTotal,
        remainingPlan,
        weeksRemaining
      );
    });
  }, [
    currentTimetable,
    subjectInputs,
    scheduledHeldCounts,
    remainingTotalCounts,
    remainingUntilPlanCounts,
    weeksRemaining,
  ]);

  const overallCalc = useMemo(() => {
    return calculateOverallAttendance(subjectCalculations);
  }, [subjectCalculations]);

  // Leave Simulation results per subject
  const leaveSimulations = useMemo(() => {
    if (!currentTimetable?.week || simulatedLeaves.length === 0) return [];

    return subjectCalculations.map((sub) => {
      // Simulate collective leaves
      let currentSub = sub;
      let lastSim: any = null;
      for (const leave of simulatedLeaves) {
        lastSim = simulateLeave(
          currentSub,
          leave,
          currentTimetable.week || {},
          activeHolidays,
          currentTimetable.dayOrderOverrides || [],
          todayDate,
          DEFAULT_POLICY
        );
      }
      return lastSim;
    }).filter(Boolean);
  }, [subjectCalculations, simulatedLeaves, currentTimetable, activeHolidays, todayDate]);

  const handleAddLeave = async (leave: LeaveInput) => {
    setSimulatedLeaves((prev) => [leave, ...prev]);
    // Save to DB
    try {
      await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leave),
      });
    } catch {}
  };

  const handleRemoveLeave = async (id: string) => {
    setSimulatedLeaves((prev) => prev.filter((l) => l.id !== id));
    try {
      await fetch(`/api/leaves?id=${id}`, { method: "DELETE" });
    } catch {}
  };

  const handleClearAllLeaves = async () => {
    setSimulatedLeaves([]);
    try {
      await fetch("/api/leaves?clearAll=true", { method: "DELETE" });
    } catch {}
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center font-mono text-base font-bold">
        Loading timetable models and curriculum engines...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
      {/* 1. Header & Controls Bar */}
      <div className="bg-white border-[3px] border-nb-ink p-5 shadow-[6px_6px_0px_#0A0A0A] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-[2px] border-zinc-200 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-heading uppercase font-black text-xs px-2.5 py-0.5 bg-nb-yellow border border-nb-ink">
                ACTIVE SEMESTER
              </span>
              <span className="font-mono text-xs text-zinc-500 font-bold">
                29 AUG 2026 – 29 NOV 2026
              </span>
            </div>
            <h1 className="font-heading uppercase font-black text-2xl sm:text-3xl text-nb-ink">
              ATTENDANCE PREDICTOR TERMINAL
            </h1>
            <p className="font-mono text-xs text-zinc-600">
              Student: <strong className="text-nb-ink">{session?.user?.name || "Student"}</strong> ({(session?.user as any)?.regNo || "RA2611003010042"})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <NBButton size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5 mr-1" />
              Print Report
            </NBButton>
            <NBButton size="sm" variant="outline" onClick={resetInputs}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Reset Inputs
            </NBButton>
          </div>
        </div>

        {/* Global Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-1">
          <div className="space-y-1">
            <label className="block font-heading uppercase text-xs font-black text-zinc-700">
              Section Timetable:
            </label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full px-3 py-1.5 font-mono text-xs border-2 border-nb-ink bg-white font-bold shadow-[2px_2px_0px_#0A0A0A] focus:outline-none"
            >
              <optgroup label="Year I">
                <option value="1-ece">1-ECE (Electronics &amp; Comm)</option>
                <option value="1-bme">1-BME (Biomedical)</option>
              </optgroup>
              <optgroup label="Year II">
                <option value="2-ece-a">2-ECE-A (Sec A)</option>
                <option value="2-ece-b">2-ECE-B (Sec B)</option>
                <option value="2-bme">2-BME (Biomedical)</option>
              </optgroup>
              <optgroup label="Year III">
                <option value="3-ece">3-ECE (General)</option>
                <option value="3-ece-ds">3-ECE-DS (Data Science)</option>
                <option value="3-bme">3-BME (Biomedical)</option>
              </optgroup>
              <optgroup label="Year IV">
                <option value="4-ece">4-ECE (Final Year)</option>
                <option value="4-bme">4-BME (Final Year)</option>
              </optgroup>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block font-heading uppercase text-xs font-black text-zinc-700">
              Today&apos;s Date (IST):
            </label>
            <div className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs border-2 border-nb-ink bg-zinc-100 shadow-[2px_2px_0px_#0A0A0A] font-bold text-zinc-700">
              <Lock className="w-3.5 h-3.5 text-zinc-500" />
              <span>{todayDate}</span>
              <span className="text-[10px] bg-nb-yellow px-1 border border-nb-ink ml-auto">
                LOCKED
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-heading uppercase text-xs font-black text-zinc-700">
              Plan Until:
            </label>
            <input
              type="date"
              min={todayDate}
              max={SEMESTER_END}
              value={planningDate}
              onChange={(e) => setPlanningDate(e.target.value)}
              className="w-full px-3 py-1.5 font-mono text-xs border-2 border-nb-ink bg-white font-bold shadow-[2px_2px_0px_#0A0A0A] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5 flex flex-col justify-center font-mono text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeHolidays}
                onChange={(e) => setIncludeHolidays(e.target.checked)}
                className="w-4 h-4 border-2 border-nb-ink text-nb-yellow rounded-none"
              />
              <span className="font-bold text-zinc-800">Exclude Holidays</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={todayClassesDone}
                onChange={(e) => setTodayClassesDone(e.target.checked)}
                className="w-4 h-4 border-2 border-nb-ink text-nb-yellow rounded-none"
              />
              <span className="font-bold text-zinc-800">Today&apos;s done</span>
            </label>
          </div>

          <div className="space-y-1">
            <label className="block font-heading uppercase text-xs font-black text-zinc-700">
              Lab Count Policy:
            </label>
            <div className="flex border-2 border-nb-ink shadow-[2px_2px_0px_#0A0A0A]">
              <button
                onClick={() => setLabCountingMode("PERIODS")}
                className={`flex-1 py-1 text-[11px] font-mono font-bold uppercase transition-colors ${
                  labCountingMode === "PERIODS"
                    ? "bg-nb-yellow text-nb-ink"
                    : "bg-white text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                1 Period = 1
              </button>
              <button
                onClick={() => setLabCountingMode("SESSION")}
                className={`flex-1 py-1 text-[11px] font-mono font-bold uppercase border-l-2 border-nb-ink transition-colors ${
                  labCountingMode === "SESSION"
                    ? "bg-nb-yellow text-nb-ink"
                    : "bg-white text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                1 Lab = 1 Class
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. IRREVERSIBLE DETENTION ALERT */}
      <IrreversibleAlert irreversibleSubjects={overallCalc.irreversible_subjects} />

      {/* 3. Top KPI Cards Strip */}
      <KPIStrip
        overall={overallCalc}
        daysLeft={daysLeft}
        workingDaysLeft={workingDaysLeft}
      />

      {/* 4. Tab Navigation (Phase 2 additions: Overview | Health | Leaves | Plan | Snapshots) */}
      <div className="space-y-6">
        <NBTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: "overview", label: "Overview", badge: subjectCalculations.length },
            { id: "health", label: "Health Charts" },
            { id: "leaves", label: "Leave Simulator (OD & Medical)", badge: simulatedLeaves.length },
            { id: "plan", label: "Recovery & Future Plan" },
            { id: "snapshots", label: "Snapshots" },
          ]}
        />

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {subjectCalculations.map((calc) => (
                <SubjectCard
                  key={calc.code}
                  calc={calc}
                  input={subjectInputs[calc.code] || {}}
                  onInputChange={(updates) => setSubjectInput(calc.code, updates)}
                  maxScheduledHeld={scheduledHeldCounts[calc.code] || 35}
                />
              ))}
            </div>

            <AttendanceProjectionChart subjects={subjectCalculations} />
          </div>
        )}

        {/* Tab 2: Health Charts */}
        {activeTab === "health" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <HealthGauge overall={overallCalc} />
              </div>
              <div className="lg:col-span-2">
                <SubjectComparisonBars subjects={subjectCalculations} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ClassesBudgetDonut subjects={subjectCalculations} />
              <RiskLeaderboard subjects={subjectCalculations} />
            </div>

            <WeeklyHeatmap
              weekSchedule={currentTimetable?.week || {}}
              holidays={activeHolidays}
              leaves={simulatedLeaves}
            />
          </div>
        )}

        {/* Tab 3: Leaves Simulator */}
        {activeTab === "leaves" && (
          <div className="space-y-6">
            <LeaveList
              leaves={simulatedLeaves}
              onRemoveLeave={handleRemoveLeave}
              onClearAll={handleClearAllLeaves}
              onOpenAddModal={() => setIsLeaveModalOpen(true)}
            />

            {leaveSimulations.length > 0 && (
              <div className="space-y-3 pt-4">
                <h3 className="font-heading uppercase font-black text-sm text-nb-ink tracking-wider">
                  BEFORE vs. AFTER ATTENDANCE PROJECTIONS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {leaveSimulations.map((sim) => (
                    <BeforeAfterCard
                      key={sim.subjectCode}
                      simulation={sim}
                      subjectName={subjectCalculations.find((s) => s.code === sim.subjectCode)?.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Recovery & Future Plan */}
        {activeTab === "plan" && (
          <div className="space-y-8">
            <RecoveryPlanView
              subjects={subjectCalculations}
              weeksRemaining={weeksRemaining}
            />

            <FutureSkipPlanner
              subjects={subjectCalculations}
              onUpdateSkip={(code, skips) => setSubjectInput(code, { plannedSkips: skips })}
              planningDate={planningDate}
            />
          </div>
        )}

        {/* Tab 5: Snapshots View */}
        {activeTab === "snapshots" && (
          <SnapshotsView
            overall={overallCalc}
            subjects={subjectCalculations}
            sectionId={sectionId}
            planningDate={planningDate}
          />
        )}
      </div>

      {/* Leave Modal */}
      <LeaveModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onSaveLeave={handleAddLeave}
        todayDate={todayDate}
        subjectsList={subjectCalculations.map((s) => ({ code: s.code, name: s.name }))}
      />

    </div>
  );
}
