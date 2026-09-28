"use client";

import React, { useState } from "react";
import { useFloorStore } from "@/lib/store";
import {
  Room,
  DayOrderSchema,
  CancellationSchema,
  RoomClosureSchema,
  OverridesDataSchema,
  DayOrder,
  Cancellation,
  RoomClosure,
  OverridesData,
} from "@/lib/schemas";
import { NBButton } from "@/components/nb/NBButton";
import { NBInput } from "@/components/nb/NBInput";
import { NBBadge } from "@/components/nb/NBBadge";
import { NBToggle } from "@/components/nb/NBToggle";
import { NBModal } from "@/components/nb/NBModal";
import { NBTabs } from "@/components/nb/NBTabs";
import sectionsData from "@/data/sections.json";
import {
  ShieldAlert,
  Lock,
  Unlock,
  Check,
  Edit2,
  FileSpreadsheet,
  AlertTriangle,
  Layers,
  Save,
  Trash2,
  Plus,
  Download,
  Upload,
  Calendar,
  XCircle,
  Clock,
  Ban,
} from "lucide-react";

export default function AdminPage() {
  const {
    rooms,
    enabledSections,
    strictReservation,
    overrides,
    updateRoom,
    toggleSection,
    setStrictReservation,
    setOverrides,
    addDayOrder,
    deleteDayOrder,
    addCancellation,
    deleteCancellation,
    addRoomClosure,
    deleteRoomClosure,
  } = useFloorStore();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");
  const [adminTab, setAdminTab] = useState<string>("overrides");

  // Room Edit Modal State
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Overrides Forms State
  const [doDate, setDoDate] = useState("2026-10-10");
  const [doFollowsDay, setDoFollowsDay] = useState<"MON" | "TUE" | "WED" | "THU" | "FRI">("WED");
  const [doNote, setDoNote] = useState("Saturday working day");
  const [doError, setDoError] = useState("");

  const [canDate, setCanDate] = useState("2026-10-06");
  const [canSection, setCanSection] = useState(sectionsData[0]?.id || "III-ECE-A");
  const [canPeriods, setCanPeriods] = useState<number[]>([1, 2]);
  const [canReason, setCanReason] = useState("Faculty on leave");
  const [canError, setCanError] = useState("");

  const [rcRoomId, setRcRoomId] = useState(rooms[0]?.id || "IST-108");
  const [rcFrom, setRcFrom] = useState("2026-10-12T00:00");
  const [rcTo, setRcTo] = useState("2026-10-14T23:59");
  const [rcReason, setRcReason] = useState("Maintenance");
  const [rcError, setRcError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });

      if (res.ok) {
        setIsAuthenticated(true);
      } else {
        setAuthError("Invalid passcode. Default is 'srm-eee-admin'");
      }
    } catch {
      if (passcode === "srm-eee-admin") {
        setIsAuthenticated(true);
      } else {
        setAuthError("Incorrect passcode.");
      }
    }
  };

  const persistOverrides = async (newOverrides: OverridesData) => {
    try {
      await fetch("/api/admin/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOverrides),
      });
    } catch (err) {
      console.warn("Could not persist overrides to file:", err);
    }
  };

  const handleOpenEdit = (room: Room) => {
    setEditingRoom({ ...room });
    setIsModalOpen(true);
  };

  const handleSaveRoom = async () => {
    if (!editingRoom) return;

    updateRoom(editingRoom);

    try {
      await fetch("/api/admin/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingRoom),
      });
    } catch (err) {
      console.warn("Could not persist room to file:", err);
    }

    setSaveSuccessMsg(`Saved metadata for ${editingRoom.label || editingRoom.id}`);
    setTimeout(() => setSaveSuccessMsg(""), 3000);
    setIsModalOpen(false);
  };

  const handleExportCsv = () => {
    const headers = "id,label,floor,type,ac,capacity,notes\n";
    const rows = rooms
      .map(
        (r) =>
          `"${r.id}","${r.label}",${r.floor ?? ""},"${r.type}",${r.ac ?? ""},${r.capacity ?? ""},"${r.notes || ""}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rooms-metadata.csv";
    a.click();
  };

  const handleExportOverrides = () => {
    const blob = new Blob([JSON.stringify(overrides, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "overrides.json";
    a.click();
  };

  const handleImportOverrides = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const validated = OverridesDataSchema.parse(json);
        setOverrides(validated);
        await persistOverrides(validated);
        setSaveSuccessMsg("Successfully imported and persisted overrides.json");
        setTimeout(() => setSaveSuccessMsg(""), 3000);
      } catch (err: any) {
        alert("Import validation error: " + (err.message || "Invalid JSON schema"));
      }
    };
    reader.readAsText(file);
  };

  const handleAddDayOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setDoError("");
    try {
      const parsed = DayOrderSchema.parse({
        date: doDate,
        followsDay: doFollowsDay,
        note: doNote || undefined,
      });
      const updated: OverridesData = {
        ...overrides,
        dayOrders: [...(overrides.dayOrders || []), parsed],
      };
      addDayOrder(parsed);
      await persistOverrides(updated);
      setSaveSuccessMsg(`Added Day Order: ${parsed.date} follows ${parsed.followsDay}`);
      setTimeout(() => setSaveSuccessMsg(""), 3000);
    } catch (err: any) {
      setDoError(err.errors?.[0]?.message || err.message || "Invalid Day Order");
    }
  };

  const handleDeleteDayOrder = async (index: number) => {
    const updated: OverridesData = {
      ...overrides,
      dayOrders: (overrides.dayOrders || []).filter((_, i) => i !== index),
    };
    deleteDayOrder(index);
    await persistOverrides(updated);
  };

  const togglePeriod = (p: number) => {
    setCanPeriods((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p).sort() : [...prev, p].sort()
    );
  };

  const handleAddCancellation = async (e: React.FormEvent) => {
    e.preventDefault();
    setCanError("");
    if (canPeriods.length === 0) {
      setCanError("Please select at least one period to cancel.");
      return;
    }
    try {
      const parsed = CancellationSchema.parse({
        date: canDate,
        sectionId: canSection,
        periods: canPeriods,
        reason: canReason,
      });
      const updated: OverridesData = {
        ...overrides,
        cancellations: [...(overrides.cancellations || []), parsed],
      };
      addCancellation(parsed);
      await persistOverrides(updated);
      setSaveSuccessMsg(`Added Cancellation for ${parsed.sectionId} on ${parsed.date}`);
      setTimeout(() => setSaveSuccessMsg(""), 3000);
    } catch (err: any) {
      setCanError(err.errors?.[0]?.message || err.message || "Invalid Cancellation");
    }
  };

  const handleDeleteCancellation = async (index: number) => {
    const updated: OverridesData = {
      ...overrides,
      cancellations: (overrides.cancellations || []).filter((_, i) => i !== index),
    };
    deleteCancellation(index);
    await persistOverrides(updated);
  };

  const handleAddRoomClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    setRcError("");
    try {
      const parsed = RoomClosureSchema.parse({
        roomId: rcRoomId,
        from: rcFrom,
        to: rcTo,
        reason: rcReason,
      });
      const updated: OverridesData = {
        ...overrides,
        roomClosures: [...(overrides.roomClosures || []), parsed],
      };
      addRoomClosure(parsed);
      await persistOverrides(updated);
      setSaveSuccessMsg(`Added Room Closure for ${parsed.roomId}`);
      setTimeout(() => setSaveSuccessMsg(""), 3000);
    } catch (err: any) {
      setRcError(err.errors?.[0]?.message || err.message || "Invalid Room Closure");
    }
  };

  const handleDeleteRoomClosure = async (index: number) => {
    const updated: OverridesData = {
      ...overrides,
      roomClosures: (overrides.roomClosures || []).filter((_, i) => i !== index),
    };
    deleteRoomClosure(index);
    await persistOverrides(updated);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="p-6 bg-white border-[4px] border-black rounded-[6px] shadow-[8px_8px_0px_#0A0A0A] space-y-4">
          <div className="w-12 h-12 bg-[#FFD93D] border-2 border-black rounded-[4px] flex items-center justify-center">
            <Lock size={24} className="text-black" />
          </div>
          <div>
            <h1 className="font-heading font-black text-2xl uppercase tracking-wider text-black">
              ADMIN PASSCODE REQUIRED
            </h1>
            <p className="font-mono text-xs text-gray-600 mt-1">
              Enter the department administrator passcode to manage timetable overrides, room metadata,
              and timetable sections.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <NBInput
              label="Admin Passcode"
              type="password"
              placeholder="Default: srm-eee-admin"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              error={authError}
            />

            <NBButton type="submit" variant="pink" size="md" className="w-full">
              <Unlock size={16} /> UNLOCK PORTAL
            </NBButton>
          </form>

          <div className="text-[11px] font-mono text-gray-500 pt-2 border-t border-gray-200">
            Hint: Default developer passcode is <code>srm-eee-admin</code>.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#6BCB77] border-2 border-black font-mono text-xs font-black">
              AUTHENTICATED
            </span>
            <span className="px-2 py-0.5 bg-[#FFD93D] border-2 border-black font-mono text-xs font-black">
              SECTION 13 READY
            </span>
          </div>
          <h1 className="font-heading font-black text-3xl uppercase tracking-wider text-black mt-1">
            DEPARTMENT ADMIN CONTROL
          </h1>
          <p className="font-mono text-xs text-gray-700">
            Manage live timetable overrides (day orders, class cancellations, room closures), room physical metadata, and section schedules.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <NBButton variant="secondary" size="sm" onClick={handleExportCsv}>
            <FileSpreadsheet size={16} /> EXPORT CSV
          </NBButton>
          <NBButton
            variant="outline"
            size="sm"
            onClick={() => setIsAuthenticated(false)}
            className="border-red-600 text-red-600 hover:bg-red-50"
          >
            LOG OUT
          </NBButton>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-green-100 border-[3px] border-black rounded-[4px] font-mono text-xs font-bold text-green-900 shadow-[3px_3px_0px_#0A0A0A]">
          ✓ {saveSuccessMsg}
        </div>
      )}

      {/* Tabs Navigation */}
      <div>
        <NBTabs
          tabs={[
            { id: "overrides", label: "TIMETABLE OVERRIDES", icon: <Calendar size={14} /> },
            { id: "rooms", label: `ROOM INVENTORY (${rooms.length})`, icon: <Layers size={14} /> },
            { id: "sections", label: "SECTIONS & RULES", icon: <AlertTriangle size={14} /> },
          ]}
          activeTab={adminTab}
          onChange={(id) => setAdminTab(id)}
        />
      </div>

      {/* TAB 1: TIMETABLE OVERRIDES */}
      {adminTab === "overrides" && (
        <div className="space-y-8 animate-in fade-in-50 duration-150">
          {/* JSON Import/Export Strip */}
          <div className="p-4 bg-[#FFF8E7] border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A] flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-heading font-black text-sm uppercase text-black">
                OVERRIDES BACKUP & DATA SYNC
              </h3>
              <p className="font-mono text-xs text-gray-600">
                Directly export or import overrides JSON matching Section 13.2 specification.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <NBButton variant="secondary" size="sm" onClick={handleExportOverrides}>
                <Download size={14} /> EXPORT OVERRIDES.JSON
              </NBButton>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-[2px] font-heading text-xs font-black uppercase shadow-[2px_2px_0px_#0A0A0A] hover:bg-[#FFD93D] transition-all">
                <Upload size={14} /> IMPORT OVERRIDES.JSON
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleImportOverrides}
                />
              </label>
            </div>
          </div>

          {/* 3 Forms Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Day Order Form */}
            <div className="p-5 bg-white border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-[#FFD93D] text-black border border-black font-mono text-[10px] font-black uppercase">
                    RULE 1
                  </span>
                  <h3 className="font-heading font-black text-base uppercase text-black">
                    DAY ORDER
                  </h3>
                </div>
                <p className="font-mono text-[11px] text-gray-600 mb-4">
                  Run a weekday timetable on a Saturday or holiday.
                </p>

                {doError && (
                  <div className="p-2 mb-3 bg-red-50 border border-red-500 rounded text-red-600 font-mono text-xs">
                    {doError}
                  </div>
                )}

                <form onSubmit={handleAddDayOrder} className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="block font-bold mb-1">Target Date (YYYY-MM-DD)</label>
                    <input
                      type="date"
                      min="2026-08-29"
                      max="2026-11-29"
                      value={doDate}
                      onChange={(e) => setDoDate(e.target.value)}
                      className="w-full p-2 border-2 border-black rounded bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Follows Day Order</label>
                    <select
                      value={doFollowsDay}
                      onChange={(e) => setDoFollowsDay(e.target.value as any)}
                      className="w-full p-2 border-2 border-black rounded bg-white"
                    >
                      <option value="MON">MON (Monday)</option>
                      <option value="TUE">TUE (Tuesday)</option>
                      <option value="WED">WED (Wednesday)</option>
                      <option value="THU">THU (Thursday)</option>
                      <option value="FRI">FRI (Friday)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Note (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Saturday working day"
                      value={doNote}
                      onChange={(e) => setDoNote(e.target.value)}
                      className="w-full p-2 border-2 border-black rounded bg-white"
                    />
                  </div>

                  <div className="pt-2">
                    <NBButton type="submit" variant="primary" size="sm" className="w-full">
                      <Plus size={14} /> ADD DAY ORDER
                    </NBButton>
                  </div>
                </form>
              </div>
            </div>

            {/* 2. Cancellation Form */}
            <div className="p-5 bg-white border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-[#FF6B9D] text-white border border-black font-mono text-[10px] font-black uppercase">
                    RULE 2
                  </span>
                  <h3 className="font-heading font-black text-base uppercase text-black">
                    CLASS CANCELLATION
                  </h3>
                </div>
                <p className="font-mono text-[11px] text-gray-600 mb-4">
                  Cancel section classes and instantly free the room.
                </p>

                {canError && (
                  <div className="p-2 mb-3 bg-red-50 border border-red-500 rounded text-red-600 font-mono text-xs">
                    {canError}
                  </div>
                )}

                <form onSubmit={handleAddCancellation} className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="block font-bold mb-1">Date (YYYY-MM-DD)</label>
                    <input
                      type="date"
                      min="2026-08-29"
                      max="2026-11-29"
                      value={canDate}
                      onChange={(e) => setCanDate(e.target.value)}
                      className="w-full p-2 border-2 border-black rounded bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Section</label>
                    <select
                      value={canSection}
                      onChange={(e) => setCanSection(e.target.value)}
                      className="w-full p-2 border-2 border-black rounded bg-white"
                    >
                      {sectionsData.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label} ({s.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Periods Cancelled</label>
                    <div className="flex flex-wrap gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => {
                        const selected = canPeriods.includes(p);
                        return (
                          <button
                            type="button"
                            key={p}
                            onClick={() => togglePeriod(p)}
                            className={`w-7 h-7 text-xs font-mono font-black border-2 border-black rounded-[2px] transition-all ${
                              selected
                                ? "bg-[#FF3B30] text-white shadow-[1px_1px_0px_#0A0A0A]"
                                : "bg-white text-black hover:bg-gray-100"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Reason</label>
                    <input
                      type="text"
                      placeholder="e.g. Faculty on leave"
                      value={canReason}
                      onChange={(e) => setCanReason(e.target.value)}
                      className="w-full p-2 border-2 border-black rounded bg-white"
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <NBButton type="submit" variant="pink" size="sm" className="w-full">
                      <Plus size={14} /> ADD CANCELLATION
                    </NBButton>
                  </div>
                </form>
              </div>
            </div>

            {/* 3. Room Closure Form */}
            <div className="p-5 bg-white border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-[#262626] text-white border border-black font-mono text-[10px] font-black uppercase">
                    RULE 3
                  </span>
                  <h3 className="font-heading font-black text-base uppercase text-black">
                    ROOM CLOSURE
                  </h3>
                </div>
                <p className="font-mono text-[11px] text-gray-600 mb-4">
                  Lock room (CLOSED), dark grey, never returned by finder.
                </p>

                {rcError && (
                  <div className="p-2 mb-3 bg-red-50 border border-red-500 rounded text-red-600 font-mono text-xs">
                    {rcError}
                  </div>
                )}

                <form onSubmit={handleAddRoomClosure} className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="block font-bold mb-1">Room</label>
                    <select
                      value={rcRoomId}
                      onChange={(e) => setRcRoomId(e.target.value)}
                      className="w-full p-2 border-2 border-black rounded bg-white"
                    >
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label || r.id} ({r.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">From (ISO / Local Time)</label>
                    <input
                      type="datetime-local"
                      value={rcFrom}
                      onChange={(e) => setRcFrom(e.target.value)}
                      className="w-full p-2 border-2 border-black rounded bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">To (ISO / Local Time)</label>
                    <input
                      type="datetime-local"
                      value={rcTo}
                      onChange={(e) => setRcTo(e.target.value)}
                      className="w-full p-2 border-2 border-black rounded bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Reason</label>
                    <input
                      type="text"
                      placeholder="e.g. Maintenance"
                      value={rcReason}
                      onChange={(e) => setRcReason(e.target.value)}
                      className="w-full p-2 border-2 border-black rounded bg-white"
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <NBButton type="submit" variant="danger" size="sm" className="w-full">
                      <Lock size={14} /> LOCK ROOM
                    </NBButton>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* List of Active & Scheduled Overrides */}
          <div className="space-y-6">
            <h3 className="font-heading font-black text-xl uppercase tracking-wider text-black border-b-2 border-black pb-2">
              ACTIVE & SCHEDULED OVERRIDES
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Day Orders List */}
              <div className="p-4 bg-white border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A] space-y-3">
                <div className="flex items-center justify-between border-b border-black pb-2">
                  <span className="font-heading font-black text-xs uppercase">
                    DAY ORDERS ({(overrides.dayOrders || []).length})
                  </span>
                </div>
                {(!overrides.dayOrders || overrides.dayOrders.length === 0) ? (
                  <p className="font-mono text-xs text-gray-400 py-3">No day orders scheduled.</p>
                ) : (
                  <div className="space-y-2">
                    {overrides.dayOrders.map((d, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-[#FFF8E7] border-2 border-black rounded-[2px] flex items-center justify-between text-xs font-mono"
                      >
                        <div>
                          <div className="font-black text-black">
                            {d.date} → <span className="bg-[#FFD93D] px-1 border border-black">{d.followsDay}</span>
                          </div>
                          {d.note && <div className="text-[11px] text-gray-600 mt-0.5">{d.note}</div>}
                        </div>
                        <button
                          onClick={() => handleDeleteDayOrder(idx)}
                          className="p-1 hover:bg-red-100 text-red-600 border border-black rounded"
                          title="Delete Day Order"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cancellations List */}
              <div className="p-4 bg-white border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A] space-y-3">
                <div className="flex items-center justify-between border-b border-black pb-2">
                  <span className="font-heading font-black text-xs uppercase">
                    CANCELLATIONS ({(overrides.cancellations || []).length})
                  </span>
                </div>
                {(!overrides.cancellations || overrides.cancellations.length === 0) ? (
                  <p className="font-mono text-xs text-gray-400 py-3">No cancellations scheduled.</p>
                ) : (
                  <div className="space-y-2">
                    {overrides.cancellations.map((c, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-[#FFF8E7] border-2 border-black rounded-[2px] flex items-center justify-between text-xs font-mono"
                      >
                        <div>
                          <div className="font-black text-black">
                            {c.date} • {c.sectionId}
                          </div>
                          <div className="text-[11px] text-red-700 font-bold mt-0.5">
                            Periods: {c.periods.join(", ")} ({c.reason})
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteCancellation(idx)}
                          className="p-1 hover:bg-red-100 text-red-600 border border-black rounded"
                          title="Delete Cancellation"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Room Closures List */}
              <div className="p-4 bg-white border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A] space-y-3">
                <div className="flex items-center justify-between border-b border-black pb-2">
                  <span className="font-heading font-black text-xs uppercase">
                    ROOM CLOSURES ({(overrides.roomClosures || []).length})
                  </span>
                </div>
                {(!overrides.roomClosures || overrides.roomClosures.length === 0) ? (
                  <p className="font-mono text-xs text-gray-400 py-3">No room closures active.</p>
                ) : (
                  <div className="space-y-2">
                    {overrides.roomClosures.map((r, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-neutral-900 text-white border-2 border-black rounded-[2px] flex items-center justify-between text-xs font-mono"
                      >
                        <div>
                          <div className="font-black text-[#FFD93D] flex items-center gap-1">
                            <Lock size={12} /> {r.roomId}
                          </div>
                          <div className="text-[10px] text-gray-300 mt-0.5">
                            {r.from.replace("T", " ")} to {r.to.replace("T", " ")}
                          </div>
                          <div className="text-[11px] text-white font-bold mt-0.5">
                            Reason: {r.reason}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteRoomClosure(idx)}
                          className="p-1 hover:bg-red-600 bg-neutral-800 text-white border border-gray-600 rounded"
                          title="Delete Room Closure"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROOM INVENTORY & METADATA */}
      {adminTab === "rooms" && (
        <div className="p-6 bg-white border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] space-y-4 animate-in fade-in-50 duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-black text-xl uppercase tracking-wider text-black">
                ROOM METADATA & INVENTORY ({rooms.length} ROOMS)
              </h2>
              <p className="font-mono text-xs text-gray-600">
                Click "Edit" on any room to assign official AC status, verified floor, seating
                capacity, and usage notes.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-gray-100 border-b-2 border-black text-black">
                <tr>
                  <th className="p-2.5 font-heading font-black">ROOM ID</th>
                  <th className="p-2.5 font-heading font-black">FLOOR</th>
                  <th className="p-2.5 font-heading font-black">TYPE</th>
                  <th className="p-2.5 font-heading font-black">AIR CONDITIONING</th>
                  <th className="p-2.5 font-heading font-black">CAPACITY</th>
                  <th className="p-2.5 font-heading font-black">NOTES / DESIGNATION</th>
                  <th className="p-2.5 font-heading font-black text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rooms.map((r) => (
                  <tr key={r.id} className="hover:bg-yellow-50/50">
                    <td className="p-2.5 font-black text-sm">{r.label || r.id}</td>
                    <td className="p-2.5 font-bold">
                      {r.floor !== null ? `Floor ${r.floor}` : <span className="text-red-600">Unmapped</span>}
                    </td>
                    <td className="p-2.5">{r.type}</td>
                    <td className="p-2.5">
                      {r.ac === true ? (
                        <NBBadge variant="blue" size="sm">AC VERIFIED</NBBadge>
                      ) : r.ac === false ? (
                        <NBBadge variant="gray" size="sm">NON-AC</NBBadge>
                      ) : (
                        <NBBadge variant="yellow" size="sm">UNVERIFIED (NULL)</NBBadge>
                      )}
                    </td>
                    <td className="p-2.5 font-bold">
                      {r.capacity ? `${r.capacity} seats` : <span className="text-gray-400">Not recorded</span>}
                    </td>
                    <td className="p-2.5 font-sans text-gray-700 truncate max-w-xs">{r.notes || "—"}</td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => handleOpenEdit(r)}
                        className="px-2.5 py-1 bg-white border border-black rounded font-heading text-[11px] font-black uppercase shadow-[1px_1px_0px_#0A0A0A] hover:bg-[#FFD93D] flex items-center gap-1 ml-auto"
                      >
                        <Edit2 size={12} /> EDIT
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SECTIONS & RESERVATION RULES */}
      {adminTab === "sections" && (
        <div className="space-y-8 animate-in fade-in-50 duration-150">
          {/* Strict Reservation Mode */}
          <div className="p-6 bg-white border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] space-y-4">
            <h2 className="font-heading font-black text-xl uppercase tracking-wider text-black">
              ROOM RESERVATION LOGIC
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#FFF8E7] border-2 border-black rounded-[2px]">
              <div className="space-y-1">
                <span className="font-heading font-black text-sm uppercase text-black block">
                  Strict Half-Day Reservation Mode
                </span>
                <p className="font-sans text-xs text-gray-700 max-w-xl">
                  When <strong>OFF (Default)</strong>, home rooms (e.g. IST 225, IST 518) are considered
                  FREE during blank periods, tea breaks, and when students are in external labs.
                  <br />
                  When <strong>ON</strong>, a section strictly books its home room for the entire half-day
                  (FN = P1-5, AN = P6-9).
                </p>
              </div>
              <NBToggle
                label="Strict Mode"
                checked={strictReservation}
                onChange={(checked) => setStrictReservation(checked)}
              />
            </div>
          </div>

          {/* Timetable Section Toggles */}
          <div className="p-6 bg-white border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading font-black text-xl uppercase tracking-wider text-black">
                  SECTION TIMETABLES TOGGLE (12 SECTIONS)
                </h2>
                <p className="font-mono text-xs text-gray-600">
                  Toggle specific section schedules on or off. Toggling Year I sections directly
                  controls whether the IST-602 collision is active.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {sectionsData.map((sec) => {
                const isEnabled = enabledSections[sec.id] ?? sec.enabled;
                const isYear1 = sec.year === 1;

                return (
                  <div
                    key={sec.id}
                    className={`p-3 border-2 border-black rounded-[2px] shadow-[2px_2px_0px_#0A0A0A] flex flex-col justify-between ${
                      isEnabled ? "bg-white" : "bg-gray-100 opacity-70"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-sm">{sec.label}</span>
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-black ${
                            isYear1 ? "bg-[#FFD93D]" : "bg-gray-200"
                          }`}
                        >
                          Year {sec.year}
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-gray-600 mt-1">
                        Home: {sec.homeRoom || "None"} ({sec.homeHalf})
                      </div>
                      {isYear1 && (
                        <div className="text-[10px] font-bold text-red-600 mt-0.5">
                          Provisional 2024-25 Sheet
                        </div>
                      )}
                    </div>

                    <div className="pt-3 mt-2 border-t border-gray-200">
                      <NBToggle
                        label={isEnabled ? "ENABLED" : "DISABLED"}
                        checked={isEnabled}
                        onChange={(checked) => toggleSection(sec.id, checked)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {editingRoom && (
        <NBModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`EDIT METADATA: ${editingRoom.label || editingRoom.id}`}
        >
          <div className="space-y-4 font-mono text-xs">
            <div>
              <label className="block font-heading font-black uppercase text-xs mb-1">
                Room Label / Display Name
              </label>
              <input
                type="text"
                value={editingRoom.label}
                onChange={(e) => setEditingRoom({ ...editingRoom, label: e.target.value })}
                className="w-full p-2 border-2 border-black rounded bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-heading font-black uppercase text-xs mb-1">
                  Floor (0 to 6)
                </label>
                <select
                  value={editingRoom.floor !== null ? editingRoom.floor : "null"}
                  onChange={(e) =>
                    setEditingRoom({
                      ...editingRoom,
                      floor: e.target.value === "null" ? null : Number(e.target.value),
                    })
                  }
                  className="w-full p-2 border-2 border-black rounded bg-white"
                >
                  <option value="null">Unmapped Floor (null)</option>
                  <option value="0">Floor 0 (Ground)</option>
                  <option value="1">Floor 1 (First)</option>
                  <option value="2">Floor 2 (Second)</option>
                  <option value="3">Floor 3 (Third)</option>
                  <option value="4">Floor 4 (Fourth)</option>
                  <option value="5">Floor 5 (Fifth)</option>
                  <option value="6">Floor 6 (Sixth)</option>
                </select>
              </div>

              <div>
                <label className="block font-heading font-black uppercase text-xs mb-1">
                  Room Type
                </label>
                <select
                  value={editingRoom.type}
                  onChange={(e) => setEditingRoom({ ...editingRoom, type: e.target.value as any })}
                  className="w-full p-2 border-2 border-black rounded bg-white"
                >
                  <option value="CLASSROOM">CLASSROOM</option>
                  <option value="LAB">LAB</option>
                  <option value="CDC">CDC</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-heading font-black uppercase text-xs mb-1">
                  Air Conditioning Status
                </label>
                <select
                  value={editingRoom.ac === true ? "true" : editingRoom.ac === false ? "false" : "null"}
                  onChange={(e) =>
                    setEditingRoom({
                      ...editingRoom,
                      ac: e.target.value === "true" ? true : e.target.value === "false" ? false : null,
                    })
                  }
                  className="w-full p-2 border-2 border-black rounded bg-white"
                >
                  <option value="null">Unverified (null)</option>
                  <option value="true">Air Conditioned (true)</option>
                  <option value="false">Non-AC (false)</option>
                </select>
              </div>

              <div>
                <label className="block font-heading font-black uppercase text-xs mb-1">
                  Seating Capacity
                </label>
                <input
                  type="number"
                  placeholder="e.g. 60 (blank for null)"
                  value={editingRoom.capacity ?? ""}
                  onChange={(e) =>
                    setEditingRoom({
                      ...editingRoom,
                      capacity: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full p-2 border-2 border-black rounded bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-heading font-black uppercase text-xs mb-1">
                Notes & Assigned Sections
              </label>
              <textarea
                rows={2}
                value={editingRoom.notes || ""}
                onChange={(e) => setEditingRoom({ ...editingRoom, notes: e.target.value })}
                className="w-full p-2 border-2 border-black rounded bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border-2 border-black rounded font-heading font-bold text-xs uppercase"
              >
                CANCEL
              </button>
              <NBButton variant="green" size="sm" onClick={handleSaveRoom}>
                <Save size={14} /> SAVE CHANGES
              </NBButton>
            </div>
          </div>
        </NBModal>
      )}
    </div>
  );
}
