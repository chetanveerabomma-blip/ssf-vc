import { create } from "zustand";
import { Room, RoomStatus } from "@/lib/schemas";
import roomsData from "@/data/rooms.json";
import sectionsData from "@/data/sections.json";

export interface FilterState {
  floor: number | null; // null means all floors
  roomType: string | null; // null means all
  ac: "all" | "ac" | "non-ac";
  minCapacity: number;
  minFreeMinutes: number;
  hideLabs: boolean;
}

interface FloorManagerState {
  // Time and Date Controls
  selectedDate: string; // YYYY-MM-DD
  selectedTime: string; // HH:mm
  isLiveNow: boolean;
  strictReservation: boolean;

  // View state
  activeView: "grid" | "timeline" | "list";

  // Filters
  filters: FilterState;

  // Data customization
  rooms: Room[];
  enabledSections: Record<string, boolean>;

  // Actions
  setDate: (date: string) => void;
  setTime: (time: string) => void;
  setLiveNow: (live: boolean) => void;
  setStrictReservation: (strict: boolean) => void;
  setActiveView: (view: "grid" | "timeline" | "list") => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  updateRoom: (room: Room) => void;
  toggleSection: (sectionId: string, enabled: boolean) => void;
}

const initialEnabledSections: Record<string, boolean> = {};
sectionsData.forEach((s) => {
  initialEnabledSections[s.id] = s.enabled;
});

export const useFloorStore = create<FloorManagerState>((set) => ({
  selectedDate: "2026-09-28", // Monday in active semester
  selectedTime: "10:15",
  isLiveNow: false,
  strictReservation: false,
  activeView: "grid",
  filters: {
    floor: null,
    roomType: null,
    ac: "all",
    minCapacity: 0,
    minFreeMinutes: 0,
    hideLabs: false,
  },
  rooms: roomsData as unknown as Room[],
  enabledSections: initialEnabledSections,

  setDate: (date) => set({ selectedDate: date, isLiveNow: false }),
  setTime: (time) => set({ selectedTime: time, isLiveNow: false }),
  setLiveNow: (live) => set({ isLiveNow: live }),
  setStrictReservation: (strict) => set({ strictReservation: strict }),
  setActiveView: (view) => set({ activeView: view }),
  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  resetFilters: () =>
    set({
      filters: {
        floor: null,
        roomType: null,
        ac: "all",
        minCapacity: 0,
        minFreeMinutes: 0,
        hideLabs: false,
      },
    }),
  updateRoom: (updated) =>
    set((state) => ({
      rooms: state.rooms.map((r) => (r.id === updated.id ? updated : r)),
    })),
  toggleSection: (sectionId, enabled) =>
    set((state) => ({
      enabledSections: { ...state.enabledSections, [sectionId]: enabled },
    })),
}));
