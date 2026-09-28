"use client";

import React, { useState, useEffect } from "react";
import { SubjectCalculation } from "@/lib/engine";
import { AlertOctagon, AlertTriangle, X, ArrowLeft, ArrowUpRight, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { NBButton } from "./NBButton";

export interface IrreversibleAlertProps {
  irreversibleSubjects: SubjectCalculation[];
}

export const IrreversibleAlert: React.FC<IrreversibleAlertProps> = ({
  irreversibleSubjects,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBannerCollapsed, setIsBannerCollapsed] = useState(false);

  // Keyboard accessibility: Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
      }
    };
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  if (irreversibleSubjects.length === 0) return null;

  const handleGoToSubject = (subjectCode: string) => {
    setIsModalOpen(false);
    setTimeout(() => {
      const el = document.getElementById(`subject-${subjectCode}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-4", "ring-nb-yellow");
        setTimeout(() => el.classList.remove("ring-4", "ring-nb-yellow"), 2500);
      }
    }, 100);
  };

  return (
    <>
      {/* 1. Full-Width Persistent Banner pinned above results */}
      <div className="w-full hazard-stripes border-[4px] border-nb-ink p-3 sm:p-5 shadow-[6px_6px_0px_#0A0A0A] mb-8">
        <div className="bg-nb-ink text-white p-4 border-[3px] border-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertOctagon className="w-9 h-9 text-nb-red animate-pulse flex-shrink-0" />
              <div>
                <h3 className="font-heading uppercase text-base sm:text-lg font-black text-nb-yellow tracking-wider">
                  ⚠ IRREVERSIBLE DETENTION ALERT ⚠
                </h3>
                <p className="font-mono text-xs text-zinc-300 mt-0.5">
                  Even attending 100% of remaining scheduled classes cannot reach 75% in{" "}
                  <span className="text-nb-red font-bold underline">
                    {irreversibleSubjects.length} course(s)
                  </span>
                  .
                </p>
              </div>
            </div>

            {/* Banner Action Toggles */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setIsModalOpen((prev) => !prev)}
                className="font-heading uppercase text-xs font-bold px-3 py-1.5 bg-nb-yellow text-nb-ink border-2 border-nb-ink shadow-[2px_2px_0px_#FFFFFF] hover:bg-yellow-400 flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5"
                aria-label="Toggle Detention Breakdown Modal"
              >
                <span>{isModalOpen ? "Close Modal ✕" : "View Breakdown ▾"}</span>
              </button>

              <button
                onClick={() => setIsBannerCollapsed((prev) => !prev)}
                className="font-heading uppercase text-xs font-bold px-2 py-1.5 bg-zinc-800 text-white border-2 border-white hover:bg-zinc-700 flex items-center gap-1"
                title={isBannerCollapsed ? "Expand Banner" : "Minimize Banner"}
              >
                {isBannerCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Subject Grid (collapsible) */}
          {!isBannerCollapsed && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-zinc-700">
              {irreversibleSubjects.map((sub) => (
                <div
                  key={sub.code}
                  className="bg-zinc-900 border-2 border-nb-red p-3 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-heading font-black text-xs text-white truncate">
                      {sub.code}: {sub.name}
                    </span>
                    <span className="font-mono text-[10px] bg-nb-red text-white px-2 py-0.5 font-black uppercase flex-shrink-0">
                      Detained
                    </span>
                  </div>
                  <div className="font-mono text-xs text-red-400 mt-2">
                    Attended: <strong>{sub.attended_so_far} / {sub.held_so_far}</strong> ({sub.current_percentage}%) • Remaining: <strong>{sub.remaining_total}</strong>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800">
                    <span className="font-mono text-[11px] text-yellow-300 font-bold">
                      Max: {sub.max_possible_percentage}% &lt; 75%
                    </span>
                    <button
                      onClick={() => handleGoToSubject(sub.code)}
                      className="font-mono text-[11px] font-bold text-nb-yellow hover:text-white underline flex items-center gap-1"
                    >
                      Action: Edit {sub.code} <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Interactive Modal Breakdown with multiple close & go-back options */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-none animate-in fade-in"
          onClick={() => setIsModalOpen(false)} // Backdrop click dismisses
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-xl bg-white border-[5px] border-nb-ink shadow-[10px_10px_0px_#0A0A0A] max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()} // Prevent inside clicks from closing
          >
            {/* Modal Header with Close & Go Back Actions */}
            <div className="bg-nb-yellow p-3.5 border-b-[4px] border-nb-ink flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-2 py-1 bg-white text-nb-ink border-2 border-nb-ink font-heading font-black text-xs uppercase shadow-[2px_2px_0px_#0A0A0A] hover:bg-zinc-100 flex items-center gap-1"
                  aria-label="Go Back to Dashboard"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Go Back</span>
                </button>
                <h2 className="font-heading font-black text-sm uppercase text-nb-ink tracking-wider">
                  Detention Breakdown
                </h2>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 bg-nb-red text-white border-2 border-nb-ink shadow-[2px_2px_0px_#0A0A0A] flex items-center justify-center font-black text-sm hover:bg-red-700 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                aria-label="Close dialog"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="flex items-start gap-3 bg-red-50 border-[3px] border-nb-red p-3.5">
                <AlertTriangle className="w-7 h-7 text-nb-red flex-shrink-0 mt-0.5" />
                <div className="text-xs font-mono leading-relaxed text-nb-ink">
                  <strong className="font-heading uppercase block text-xs font-black text-nb-red mb-0.5">
                    Statutory Alert: Action Required
                  </strong>
                  SRM Trichy policy mandates a minimum 75% attendance to receive semester exam hall tickets. The subjects below cannot reach 75% under current inputs.
                </div>
              </div>

              {/* Affected Courses List */}
              <div className="space-y-3">
                <h4 className="font-heading uppercase text-xs font-black tracking-widest text-zinc-700">
                  Affected Course(s):
                </h4>
                {irreversibleSubjects.map((sub) => (
                  <div
                    key={sub.code}
                    className="border-[3px] border-nb-ink bg-zinc-50 p-3.5 space-y-2 shadow-[3px_3px_0px_#0A0A0A]"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-heading font-black text-sm truncate">
                        {sub.code} - {sub.name}
                      </span>
                      <span className="bg-nb-red text-white text-[10px] font-mono font-bold px-2 py-0.5 uppercase flex-shrink-0">
                        {sub.type}
                      </span>
                    </div>

                    <div className="font-mono text-xs text-zinc-700">
                      Current Standing: <strong>{sub.attended_so_far} / {sub.held_so_far}</strong> ({sub.current_percentage}%) • Remaining Scheduled: <strong>{sub.remaining_total} classes</strong>
                    </div>

                    <div className="font-mono text-xs font-bold text-nb-red bg-red-100/60 p-2 border border-nb-red">
                      Math: Max Possible Attendance = <strong>{sub.max_possible_percentage}%</strong> (must attend {sub.must_attend_75}, but only {sub.remaining_total} classes remain).
                    </div>

                    {/* Action Toggle Button */}
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => handleGoToSubject(sub.code)}
                        className="px-3 py-1.5 bg-nb-yellow text-nb-ink border-2 border-nb-ink font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_#0A0A0A] hover:bg-yellow-400 active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1.5"
                      >
                        <span>Action: Edit {sub.code} Attendance</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-yellow-50 border-[2px] border-nb-ink p-3 text-[11px] font-mono text-zinc-700">
                <strong>Next Step:</strong> Review your inputs or consult your Faculty Advisor / HOD regarding official Medical Leave (Condonation) or OD approval.
              </div>
            </div>

            {/* Modal Footer with Dismiss & Return */}
            <div className="p-3.5 bg-zinc-100 border-t-[3px] border-nb-ink flex flex-col sm:flex-row items-center justify-between gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 font-mono font-bold text-xs uppercase border-2 border-nb-ink bg-white text-zinc-700 hover:bg-zinc-200"
              >
                ← Back to Dashboard
              </button>

              <NBButton
                variant="primary"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto"
              >
                I Understand • Close Alert
              </NBButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
