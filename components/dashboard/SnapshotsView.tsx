"use client";

import React, { useState, useEffect } from "react";
import { NBButton } from "../nb/NBButton";
import { NBTable } from "../nb/NBTable";
import { NBBadge } from "../nb/NBBadge";
import { Camera, History, Calendar, Check, ArrowRight } from "lucide-react";
import { OverallCalculation, SubjectCalculation } from "@/lib/engine";

export interface SnapshotItem {
  id: string;
  date: string;
  planningDate: string;
  createdAt: string;
  payload: string;
}

export interface SnapshotsViewProps {
  overall: OverallCalculation;
  subjects: SubjectCalculation[];
  sectionId: string;
  planningDate: string;
}

export const SnapshotsView: React.FC<SnapshotsViewProps> = ({
  overall,
  subjects,
  sectionId,
  planningDate,
}) => {
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<any | null>(null);

  const fetchSnapshots = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/snapshots");
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data.snapshots || []);
      }
    } catch (e) {
      console.error("Error fetching snapshots:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, []);

  const handleSaveSnapshot = async () => {
    try {
      setSaving(true);
      const payload = {
        sectionId,
        overall: {
          current_percentage: overall.current_percentage,
          status: overall.status,
          total_held: overall.total_held,
          total_attended: overall.total_attended,
          must_attend_75: overall.must_attend_75,
          can_bunk_75: overall.can_bunk_75,
        },
        subjects: subjects.map((s) => ({
          code: s.code,
          name: s.name,
          current_percentage: s.current_percentage,
          must_attend_75: s.must_attend_75,
          can_bunk_75: s.can_bunk_75,
          status: s.status,
        })),
      };

      const res = await fetch("/api/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          planningDate,
          payload,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
        fetchSnapshots();
      }
    } catch (e) {
      console.error("Failed to save snapshot", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Save Action */}
      <div className="bg-white border-[3px] border-nb-ink p-5 shadow-[4px_4px_0px_#0A0A0A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-heading font-black text-base uppercase text-nb-ink tracking-wider flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Attendance Snapshot Archive
          </h3>
          <p className="font-mono text-xs text-zinc-600 mt-1">
            Store immutable records of your attendance standing to trace weekly progress and condonation status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="font-mono text-xs font-bold text-green-700 bg-green-100 px-2 py-1 border border-green-600 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Snapshot Recorded!
            </span>
          )}
          <NBButton
            variant="primary"
            size="md"
            onClick={handleSaveSnapshot}
            disabled={saving}
          >
            <Camera className="w-4 h-4 mr-1.5" />
            {saving ? "Saving..." : "Save Snapshot Now"}
          </NBButton>
        </div>
      </div>

      {/* Snapshot History Table */}
      {loading ? (
        <div className="p-8 text-center font-mono text-sm font-bold bg-white border-[3px] border-nb-ink">
          Loading archived snapshots...
        </div>
      ) : snapshots.length === 0 ? (
        <div className="p-8 text-center bg-white border-[3px] border-nb-ink shadow-[4px_4px_0px_#0A0A0A]">
          <History className="w-10 h-10 mx-auto text-zinc-400 mb-2" />
          <h4 className="font-heading font-bold text-sm uppercase text-zinc-800">No Snapshots Saved Yet</h4>
          <p className="font-mono text-xs text-zinc-500 mt-1">
            Click "Save Snapshot Now" to record your first standing.
          </p>
        </div>
      ) : (
        <NBTable headers={["Timestamp", "Recorded Date", "Plan Date", "Overall %", "Status", "Actions"]}>
          {snapshots.map((snap) => {
            let data: any = {};
            try {
              data = JSON.parse(snap.payload);
            } catch {}

            return (
              <tr key={snap.id} className="hover:bg-zinc-50">
                <td className="px-3 py-3 border-r-[2px] border-nb-ink font-mono text-xs text-zinc-600">
                  {new Date(snap.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                </td>
                <td className="px-3 py-3 border-r-[2px] border-nb-ink font-mono font-bold text-xs">
                  {snap.date}
                </td>
                <td className="px-3 py-3 border-r-[2px] border-nb-ink font-mono text-xs">
                  {snap.planningDate}
                </td>
                <td className="px-3 py-3 border-r-[2px] border-nb-ink font-mono font-black text-sm text-nb-ink">
                  {data?.overall?.current_percentage || "--"}%
                </td>
                <td className="px-3 py-3 border-r-[2px] border-nb-ink">
                  {data?.overall?.status ? (
                    <NBBadge status={data.overall.status} size="sm" />
                  ) : (
                    <span className="font-mono text-xs">--</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <button
                    onClick={() => setSelectedSnapshot({ ...snap, parsedPayload: data })}
                    className="font-mono text-xs font-bold text-nb-blue underline hover:text-blue-800"
                  >
                    View Details →
                  </button>
                </td>
              </tr>
            );
          })}
        </NBTable>
      )}

      {/* Snapshot Details Modal */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white border-[4px] border-nb-ink shadow-[8px_8px_0px_#0A0A0A] max-w-2xl w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b-[2px] border-nb-ink pb-3">
              <div>
                <h4 className="font-heading uppercase font-black text-base">
                  Snapshot: {selectedSnapshot.date}
                </h4>
                <div className="font-mono text-xs text-zinc-500">
                  Recorded at {new Date(selectedSnapshot.createdAt).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedSnapshot(null)}
                className="font-mono font-black px-2 py-1 border-2 border-nb-ink bg-zinc-100 hover:bg-zinc-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs bg-zinc-50 p-3 border-2 border-nb-ink">
              <div>
                Overall: <strong>{selectedSnapshot.parsedPayload?.overall?.current_percentage}%</strong>
              </div>
              <div>
                Must Attend: <strong>{selectedSnapshot.parsedPayload?.overall?.must_attend_75}</strong>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border-2 border-nb-ink">
              <table className="w-full font-mono text-xs text-left">
                <thead className="bg-nb-yellow border-b border-nb-ink font-bold">
                  <tr>
                    <th className="p-2">Subject</th>
                    <th className="p-2">%</th>
                    <th className="p-2">Must Attend</th>
                    <th className="p-2">Can Bunk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {(selectedSnapshot.parsedPayload?.subjects || []).map((s: any) => (
                    <tr key={s.code} className="hover:bg-zinc-100">
                      <td className="p-2 font-bold">{s.code} - {s.name}</td>
                      <td className="p-2">{s.current_percentage}%</td>
                      <td className="p-2">{s.must_attend_75}</td>
                      <td className="p-2 text-green-700 font-bold">{s.can_bunk_75}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <NBButton size="sm" variant="outline" onClick={() => setSelectedSnapshot(null)}>
                Close Window
              </NBButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
