import { z } from "zod";

export const RoomTypeSchema = z.enum(["CLASSROOM", "LAB", "CDC", "OTHER"]);

export const RoomSchema = z.object({
  id: z.string(),
  label: z.string(),
  floor: z.number().int().min(0).max(6).nullable(),
  type: RoomTypeSchema,
  ac: z.boolean().nullable(),
  capacity: z.number().int().positive().nullable(),
  notes: z.string().optional(),
});

export type Room = z.infer<typeof RoomSchema>;

export const BookingKindSchema = z.enum(["THEORY", "LAB", "PROJECT", "OTHER"]);

export const BookingBlockSchema = z.object({
  startPeriod: z.number().int().min(1).max(9),
  endPeriod: z.number().int().min(1).max(9),
  slot: z.string(),
  rooms: z.array(z.string()),
  kind: BookingKindSchema.optional().default("THEORY"),
  verified: z.boolean().optional(),
});

export type BookingBlock = z.infer<typeof BookingBlockSchema>;

export const DayScheduleSchema = z.record(
  z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]),
  z.array(BookingBlockSchema).optional()
);

export const SectionSchema = z.object({
  id: z.string(),
  label: z.string(),
  year: z.number().int().min(1).max(4),
  homeRoom: z.string(),
  homeHalf: z.enum(["FULL", "FN", "AN"]),
  periodGrid: z.enum(["Y2_4", "Y1"]),
  semesterLabel: z.string(),
  enabled: z.boolean(),
  source: z.string(),
  duplicateSource: z.string().optional(),
  verified: z.boolean().optional(),
  days: DayScheduleSchema,
  slots: z.record(
    z.string(),
    z.object({
      code: z.string().optional(),
      name: z.string(),
    })
  ),
});

export type Section = z.infer<typeof SectionSchema>;

export const HolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string(),
});

export type Holiday = z.infer<typeof HolidaySchema>;

export const RoomQuerySchema = z.object({
  floor: z.array(z.number().int().min(0).max(6)).optional(),
  ac: z.boolean().optional(),
  minCapacity: z.number().int().positive().optional(),
  roomType: RoomTypeSchema.optional(),
  date: z.string().optional(), // YYYY-MM-DD
  startTime: z.string().optional(), // HH:mm
  durationMin: z.number().int().positive().optional(),
  endTime: z.string().optional(), // HH:mm
  quietPreference: z.boolean().optional(),
  assumptions: z.array(z.string()).default([]),
  off_topic: z.boolean().optional(),
});

export type RoomQuery = z.infer<typeof RoomQuerySchema>;

export const RoomStatusEnum = z.enum([
  "FREE",
  "FREE_SOON",
  "OCCUPIED",
  "DATA_CONFLICT",
  "NO_CLASSES",
  "CLOSED",
]);

export type RoomStatus = z.infer<typeof RoomStatusEnum>;

export const DayOrderSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .refine((d) => d >= "2026-08-29" && d <= "2026-11-29", {
      message: "Date must be within the active semester (2026-08-29 to 2026-11-29)",
    }),
  followsDay: z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]),
  note: z.string().optional(),
});

export type DayOrder = z.infer<typeof DayOrderSchema>;

export const CancellationSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .refine((d) => d >= "2026-08-29" && d <= "2026-11-29", {
      message: "Date must be within the active semester (2026-08-29 to 2026-11-29)",
    }),
  sectionId: z.string().min(1, "Section ID is required"),
  periods: z.array(z.number().int().min(1).max(9)).min(1, "At least one period required"),
  reason: z.string().optional(),
});

export type Cancellation = z.infer<typeof CancellationSchema>;

export const RoomClosureSchema = z
  .object({
    roomId: z.string().min(1, "Room ID is required"),
    from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "From timestamp must be YYYY-MM-DDTHH:mm")
      .refine(
        (d) => {
          const datePart = d.split("T")[0];
          return datePart >= "2026-08-29" && datePart <= "2026-11-29";
        },
        { message: "From date must be within active semester (2026-08-29 to 2026-11-29)" }
      ),
    to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "To timestamp must be YYYY-MM-DDTHH:mm")
      .refine(
        (d) => {
          const datePart = d.split("T")[0];
          return datePart >= "2026-08-29" && datePart <= "2026-11-29";
        },
        { message: "To date must be within active semester (2026-08-29 to 2026-11-29)" }
      ),
    reason: z.string().optional(),
  })
  .refine((data) => data.from <= data.to, {
    message: "'from' timestamp must be earlier than or equal to 'to' timestamp",
    path: ["to"],
  });

export type RoomClosure = z.infer<typeof RoomClosureSchema>;

export const OverridesDataSchema = z.object({
  dayOrders: z.array(DayOrderSchema).default([]),
  cancellations: z.array(CancellationSchema).default([]),
  roomClosures: z.array(RoomClosureSchema).default([]),
});

export type OverridesData = z.infer<typeof OverridesDataSchema>;
