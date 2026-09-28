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
]);

export type RoomStatus = z.infer<typeof RoomStatusEnum>;
