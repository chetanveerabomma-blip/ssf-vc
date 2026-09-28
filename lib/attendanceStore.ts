import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SubjectInput } from "@/lib/engine";

export interface AttendanceStoreState {
  sectionId: string;
  todayDate: string; // YYYY-MM-DD
  planningDate: string; // YYYY-MM-DD
  includeHolidays: boolean;
  todayClassesDone: boolean;
  labCountingMode: "PERIODS" | "SESSION";
  subjectInputs: Record<string, Partial<SubjectInput>>;

  // Actions
  setSectionId: (id: string) => void;
  setPlanningDate: (date: string) => void;
  setIncludeHolidays: (include: boolean) => void;
  setTodayClassesDone: (done: boolean) => void;
  setLabCountingMode: (mode: "PERIODS" | "SESSION") => void;
  setSubjectInput: (code: string, input: Partial<SubjectInput>) => void;
  resetInputs: () => void;
}

export const useAttendanceStore = create<AttendanceStoreState>()(
  persist(
    (set, get) => ({
      sectionId: "2-ece-a",
      todayDate: "2026-09-28", // IST locked chip
      planningDate: "2026-11-29",
      includeHolidays: true,
      todayClassesDone: false,
      labCountingMode: "PERIODS",
      subjectInputs: {
        "26ECE201": { code: "26ECE201", mode: "COUNTS", held: 28, attended: 24, plannedSkips: 0 },
        "26ECE202": { code: "26ECE202", mode: "COUNTS", held: 26, attended: 21, plannedSkips: 0 },
        "26ECE203": { code: "26ECE203", mode: "COUNTS", held: 27, attended: 22, plannedSkips: 0 },
        "26ECE204": { code: "26ECE204", mode: "PERCENTAGE", percentage: 84.0, plannedSkips: 0 },
        "26MAT205": { code: "26MAT205", mode: "PERCENTAGE", percentage: 76.5, plannedSkips: 0 },
        "26ECL206": { code: "26ECL206", mode: "COUNTS", held: 8, attended: 8, plannedSkips: 0 },
        "26ECL207": { code: "26ECL207", mode: "COUNTS", held: 8, attended: 7, plannedSkips: 0 },
      },

      setSectionId: (id: string) => set({ sectionId: id }),
      setPlanningDate: (date: string) => set({ planningDate: date }),
      setIncludeHolidays: (include: boolean) => set({ includeHolidays: include }),
      setTodayClassesDone: (done: boolean) => set({ todayClassesDone: done }),
      setLabCountingMode: (mode: "PERIODS" | "SESSION") => set({ labCountingMode: mode }),
      setSubjectInput: (code: string, input: Partial<SubjectInput>) =>
        set((state) => ({
          subjectInputs: {
            ...state.subjectInputs,
            [code]: {
              ...(state.subjectInputs[code] || {}),
              ...input,
            },
          },
        })),
      resetInputs: () =>
        set({
          subjectInputs: {},
        }),
    }),
    {
      name: "srm-attendance-calculator-v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
