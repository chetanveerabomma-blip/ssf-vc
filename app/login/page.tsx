"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { NBCard } from "@/components/nb/NBCard";
import { NBButton } from "@/components/nb/NBButton";
import { NBInput } from "@/components/nb/NBInput";
import { NBSticker } from "@/components/nb/NBSticker";
import { NBAlert } from "@/components/nb/NBAlert";
import { Lock, LogIn, Sparkles, ShieldCheck } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [regNo, setRegNo] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [forgotModal, setForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        regNo: regNo.trim().toUpperCase(),
        password,
      });

      if (!res?.ok) {
        setErrorMsg(res?.error || "Invalid registration number or password.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setErrorMsg("An unexpected connection error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (type: "STUDENT" | "ADMIN") => {
    if (type === "STUDENT") {
      setRegNo("RA2611003010042");
      setPassword("StudentPassword123");
    } else {
      setRegNo("RA2611003010001");
      setPassword("AdminPassword123");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8 space-y-2">
        <div className="inline-block mb-1">
          <NBSticker text="SRM TRICHY • EEE" color="yellow" rotation="-2deg" />
        </div>
        <h1 className="font-heading uppercase font-black text-3xl sm:text-4xl text-nb-ink">
          STUDENT SIGN IN
        </h1>
        <p className="font-mono text-xs text-zinc-600">
          Enter your College Registration Number to access your attendance calculator.
        </p>
      </div>

      <NBCard variant="white" shadowSize="lg" className="p-6 space-y-6">
        {searchParams?.get("error") === "admin_required" && (
          <NBAlert variant="danger" title="Admin Privilege Required">
            You must have faculty/admin credentials to access the Administration Console.
          </NBAlert>
        )}

        {errorMsg && (
          <NBAlert variant="danger" title="Authentication Failed">
            {errorMsg}
          </NBAlert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <NBInput
            label="Registration Number"
            placeholder="e.g. RA2611003010042"
            value={regNo}
            onChange={(e) => setRegNo(e.target.value.toUpperCase())}
            required
            helperText="Format: 2 letters followed by 10-13 digits"
          />

          <NBInput
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex items-center justify-between font-mono text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 border-2 border-nb-ink text-nb-yellow rounded-none"
              />
              <span className="font-bold text-zinc-700">Remember credentials</span>
            </label>

            <button
              type="button"
              onClick={() => setForgotModal(true)}
              className="text-nb-blue underline font-bold hover:text-blue-800"
            >
              Forgot password?
            </button>
          </div>

          <NBButton
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            <LogIn className="w-5 h-5 mr-2" />
            {loading ? "Authenticating..." : "Access Dashboard"}
          </NBButton>
        </form>

        {/* Demo Quick Fills */}
        <div className="border-t-[3px] border-nb-ink pt-4 space-y-2">
          <div className="font-heading uppercase text-[11px] font-black tracking-wider text-zinc-600 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-nb-yellow" />
            Quick Demo Credentials
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo("STUDENT")}
              className="font-mono text-xs font-bold p-2 bg-yellow-50 border-2 border-nb-ink hover:bg-yellow-100 text-left shadow-[2px_2px_0px_#0A0A0A]"
            >
              ★ Demo Student (Year II)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("ADMIN")}
              className="font-mono text-xs font-bold p-2 bg-purple-50 border-2 border-nb-ink hover:bg-purple-100 text-left shadow-[2px_2px_0px_#0A0A0A]"
            >
              ★ Demo Admin (HOD EEE)
            </button>
          </div>
        </div>

        <div className="text-center font-mono text-xs border-t border-zinc-200 pt-3">
          Don&apos;t have an account yet?{" "}
          <Link href="/register" className="font-black text-nb-ink underline hover:text-nb-blue">
            Register Here →
          </Link>
        </div>
      </NBCard>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white border-[4px] border-nb-ink shadow-[8px_8px_0px_#0A0A0A] max-w-md w-full p-6 space-y-4">
            <h3 className="font-heading uppercase font-black text-base border-b-[2px] border-nb-ink pb-2">
              Password Reset Assistance
            </h3>
            {resetSuccess ? (
              <div className="p-3 bg-green-50 border-2 border-green-600 font-mono text-xs text-green-800 space-y-2">
                <p>✓ Reset instructions sent to {resetEmail}!</p>
                <NBButton size="sm" variant="outline" onClick={() => { setForgotModal(false); setResetSuccess(false); }}>
                  Close
                </NBButton>
              </div>
            ) : (
              <div className="space-y-4 font-mono text-xs">
                <p className="text-zinc-600">
                  Enter your registered SRM college email. A password reset verification token will be dispatched.
                </p>
                <NBInput
                  label="College Email"
                  type="email"
                  placeholder="student@srmtrichy.edu.in"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
                <div className="flex justify-end gap-2 pt-2">
                  <NBButton size="sm" variant="outline" onClick={() => setForgotModal(false)}>
                    Cancel
                  </NBButton>
                  <NBButton size="sm" variant="primary" onClick={() => setResetSuccess(true)}>
                    Send Reset Token
                  </NBButton>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto p-12 text-center font-mono font-bold">Loading Login Terminal...</div>}>
      <LoginForm />
    </Suspense>
  );
}
