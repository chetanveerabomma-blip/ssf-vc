export type LeaveType = "OD" | "MEDICAL" | "ABSENT";
export type MedicalHandlingMode = "AS_ABSENT" | "AS_PRESENT" | "EXCLUDED";
export type ODHandlingMode = "AS_PRESENT" | "EXCLUDED";

export interface AttendancePolicy {
  odHandling: ODHandlingMode; // "AS_PRESENT" (default): attended +1, held +1
  medicalDefaultHandling: MedicalHandlingMode; // "AS_ABSENT" (default unapproved)
  medicalApprovedHandling: MedicalHandlingMode; // "AS_PRESENT" or "EXCLUDED"
  maxODDaysPerSemester: number; // e.g. 10 days limit
  maxMedicalCondonationPercent: number; // e.g. 10% condonation (down to 65%)
  detentionThreshold: number; // 75%
  targetThreshold: number; // 90%
}

export const DEFAULT_POLICY: AttendancePolicy = {
  odHandling: "AS_PRESENT",
  medicalDefaultHandling: "AS_ABSENT",
  medicalApprovedHandling: "AS_PRESENT",
  maxODDaysPerSemester: 10,
  maxMedicalCondonationPercent: 10,
  detentionThreshold: 0.75,
  targetThreshold: 0.90,
};
