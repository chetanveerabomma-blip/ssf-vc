"use client";

import React, { useState } from "react";
import { useFloorStore } from "@/lib/store";
import { Room } from "@/lib/schemas";
import { NBButton } from "@/components/nb/NBButton";
import { NBInput } from "@/components/nb/NBInput";
import { NBBadge } from "@/components/nb/NBBadge";
import { NBToggle } from "@/components/nb/NBToggle";
import { NBModal } from "@/components/nb/NBModal";
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
} from "lucide-react";

export default function AdminPage() {
  const {
    rooms,
    enabledSections,
    strictReservation,
    updateRoom,
    toggleSection,
    setStrictReservation,
  } = useFloorStore();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");

  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

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
      // Local dev fallback
      if (passcode === "srm-eee-admin") {
        setIsAuthenticated(true);
      } else {
        setAuthError("Incorrect passcode.");
      }
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
      console.warn("Could not persist to file in this environment, updated client state:", err);
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
              Enter the department administrator passcode to modify room metadata, manage sections,
              and configure reservation strictness.
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
          </div>
          <h1 className="font-heading font-black text-3xl uppercase tracking-wider text-black mt-1">
            DEPARTMENT ADMIN CONTROL
          </h1>
          <p className="font-mono text-xs text-gray-700">
            Edit room physical metadata, toggle section timetables, and control reservation rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
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

      {/* 1. TIMETABLE SECTION TOGGLES */}
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

      {/* 2. ENGINE CONFIGURATION: STRICT RESERVATION */}
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

      {/* 3. ROOM METADATA DIRECTORY & EDITING */}
      <div className="p-6 bg-white border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] space-y-4">
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
