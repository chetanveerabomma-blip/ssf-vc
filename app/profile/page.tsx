"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { NBCard } from "@/components/nb/NBCard";
import { NBButton } from "@/components/nb/NBButton";
import { NBInput } from "@/components/nb/NBInput";
import { NBAlert } from "@/components/nb/NBAlert";
import { NBSticker } from "@/components/nb/NBSticker";
import { User, ShieldCheck, KeyRound, Trash2, CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [sectionId, setSectionId] = useState(
    (session?.user as any)?.sectionId || "2-ece-a"
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [sectionSuccess, setSectionSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleUpdateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update section");
      } else {
        setSectionSuccess(true);
        await update({ sectionId });
        setTimeout(() => setSectionSuccess(false), 3000);
      }
    } catch {
      setErrorMsg("Failed to update section.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match");
      return;
    }

    if (newPassword.length < 8 || !/[0-9]/.test(newPassword) || !/[A-Za-z]/.test(newPassword)) {
      setErrorMsg("Password must be at least 8 characters with 1 number and 1 letter");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Password change failed");
      } else {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(false), 3000);
      }
    } catch {
      setErrorMsg("Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch("/api/profile", {
        method: "DELETE",
      });
      if (res.ok) {
        signOut({ callbackUrl: "/" });
      }
    } catch (err) {
      console.error("Account deletion failed", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* Top Banner */}
      <div className="bg-white border-[3px] border-nb-ink p-6 shadow-[6px_6px_0px_#0A0A0A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <NBSticker text="ACCOUNT SETTINGS" color="purple" rotation="-2deg" />
          </div>
          <h1 className="font-heading uppercase font-black text-2xl sm:text-3xl text-nb-ink">
            STUDENT PROFILE &amp; PREFERENCES
          </h1>
          <p className="font-mono text-xs text-zinc-600">
            Manage your registered timetable assignment and authentication security.
          </p>
        </div>

        <div className="bg-nb-yellow p-3 border-2 border-nb-ink font-mono text-xs font-bold">
          Role: <strong className="text-nb-ink uppercase">{(session?.user as any)?.role || "STUDENT"}</strong>
        </div>
      </div>

      {errorMsg && (
        <NBAlert variant="danger" title="Profile Error">
          {errorMsg}
        </NBAlert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Account Details & Section Update */}
        <div className="space-y-6">
          <NBCard variant="white" shadowSize="md" className="p-6 space-y-4">
            <h3 className="font-heading uppercase font-black text-base border-b-[2px] border-nb-ink pb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-nb-ink" />
              Academic Identity
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <span className="text-zinc-500 block">Full Name:</span>
                <span className="font-bold text-sm text-nb-ink">{session?.user?.name || "Student"}</span>
              </div>

              <div>
                <span className="text-zinc-500 block">Registration Number:</span>
                <span className="font-bold text-sm text-nb-ink">
                  {(session?.user as any)?.regNo || "RA2611003010042"}
                </span>
              </div>

              <div>
                <span className="text-zinc-500 block">College Email:</span>
                <span className="font-bold text-zinc-800">{session?.user?.email || "student@srmtrichy.edu.in"}</span>
              </div>
            </div>

            <form onSubmit={handleUpdateSection} className="pt-4 border-t-[2px] border-zinc-200 space-y-3">
              <label className="block font-heading uppercase text-xs font-black text-nb-ink">
                Assigned Section (Timetable)
              </label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="w-full px-3 py-2 bg-white text-nb-ink font-mono text-xs font-bold border-2 border-nb-ink shadow-[2px_2px_0px_#0A0A0A] focus:outline-none cursor-pointer"
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

              {sectionSuccess && (
                <div className="font-mono text-xs font-bold text-green-700 bg-green-50 p-2 border border-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Timetable Section Updated!
                </div>
              )}

              <NBButton size="sm" variant="primary" type="submit" disabled={loading}>
                Save Section Assignment
              </NBButton>
            </form>
          </NBCard>
        </div>

        {/* Right Column: Password Change & Danger Zone */}
        <div className="space-y-6">
          <NBCard variant="white" shadowSize="md" className="p-6 space-y-4">
            <h3 className="font-heading uppercase font-black text-base border-b-[2px] border-nb-ink pb-2 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-nb-ink" />
              Security &amp; Password
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <NBInput
                label="Current Password"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />

              <NBInput
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                helperText="Min. 8 characters with 1 number and 1 letter"
                required
              />

              <NBInput
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              {passwordSuccess && (
                <div className="font-mono text-xs font-bold text-green-700 bg-green-50 p-2 border border-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Password Changed Successfully!
                </div>
              )}

              <NBButton size="sm" variant="primary" type="submit" disabled={loading}>
                Update Password
              </NBButton>
            </form>
          </NBCard>

          {/* Danger Zone */}
          <div className="border-[3px] border-nb-red bg-red-50 p-6 shadow-[4px_4px_0px_#0A0A0A] space-y-3">
            <h4 className="font-heading uppercase font-black text-sm text-nb-red flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Danger Zone
            </h4>
            <p className="font-mono text-xs text-zinc-700 leading-relaxed">
              Permanently delete your attendance predictor profile, saved snapshots, and custom calculations.
            </p>

            <NBButton
              size="sm"
              variant="danger"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              Delete My Account
            </NBButton>
          </div>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-white border-[4px] border-nb-ink p-6 shadow-[8px_8px_0px_#0A0A0A] max-w-md w-full space-y-4">
            <h3 className="font-heading uppercase font-black text-lg text-nb-red">
              Confirm Account Deletion
            </h3>
            <p className="font-mono text-xs text-zinc-700 leading-relaxed">
              Are you sure you want to permanently delete your account ({(session?.user as any)?.regNo})? This action is irreversible and all your saved snapshot history will be cleared.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <NBButton size="sm" variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </NBButton>
              <NBButton size="sm" variant="danger" onClick={handleDeleteAccount}>
                Yes, Delete Permanently
              </NBButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
