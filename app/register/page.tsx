"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NBCard } from "@/components/nb/NBCard";
import { NBButton } from "@/components/nb/NBButton";
import { NBInput } from "@/components/nb/NBInput";
import { NBSelect } from "@/components/nb/NBSelect";
import { NBSticker } from "@/components/nb/NBSticker";
import { NBAlert } from "@/components/nb/NBAlert";
import { UserPlus, ArrowRight, Check } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    regNo: "",
    email: "",
    sectionId: "2-ece-a",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const sectionsList = [
    { group: "Year I", value: "1-ece", label: "Year I - Electronics & Communication Engineering" },
    { group: "Year I", value: "1-bme", label: "Year I - Biomedical Engineering" },
    { group: "Year II", value: "2-ece-a", label: "Year II - ECE Section A" },
    { group: "Year II", value: "2-ece-b", label: "Year II - ECE Section B" },
    { group: "Year II", value: "2-bme", label: "Year II - Biomedical Engineering" },
    { group: "Year III", value: "3-ece", label: "Year III - Electronics & Communication Engineering" },
    { group: "Year III", value: "3-ece-ds", label: "Year III - ECE (Data Science Specialization)" },
    { group: "Year III", value: "3-bme", label: "Year III - Biomedical Engineering" },
    { group: "Year IV", value: "4-ece", label: "Year IV - Electronics & Communication Engineering" },
    { group: "Year IV", value: "4-bme", label: "Year IV - Biomedical Engineering" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError("");

    // Client validation
    const newErrors: Record<string, string> = {};
    const regNoRegex = /^[A-Za-z]{2}\d{10,13}$/;

    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!regNoRegex.test(formData.regNo.trim())) {
      newErrors.regNo = "Format: 2 letters followed by 10-13 digits (e.g. RA2611003010042)";
    }
    if (!formData.email.includes("@")) {
      newErrors.email = "Valid college email required";
    }
    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/[0-9]/.test(formData.password) || !/[A-Za-z]/.test(formData.password)) {
      newErrors.password = "Password must contain at least 1 number and 1 letter";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.terms) {
      newErrors.terms = "You must agree to attendance calculation guidelines";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          regNo: formData.regNo.trim().toUpperCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.issues) {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(data.issues)) {
            flat[k] = (v as string[])[0];
          }
          setErrors(flat);
        } else {
          setGlobalError(data.error || "Registration failed");
        }
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      }
    } catch (err: any) {
      setGlobalError("Connection failure during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="text-center mb-8 space-y-2">
        <div className="inline-block mb-1">
          <NBSticker text="STUDENT ENROLLMENT" color="pink" rotation="2deg" />
        </div>
        <h1 className="font-heading uppercase font-black text-3xl sm:text-4xl text-nb-ink">
          CREATE ACCOUNT
        </h1>
        <p className="font-mono text-xs text-zinc-600">
          Register with your official registration number to link your timetable.
        </p>
      </div>

      <NBCard variant="white" shadowSize="lg" className="p-6 sm:p-8 space-y-6">
        {globalError && (
          <NBAlert variant="danger" title="Registration Error">
            {globalError}
          </NBAlert>
        )}

        {success ? (
          <div className="bg-green-100 border-[3px] border-nb-ink p-6 text-center space-y-3">
            <Check className="w-12 h-12 mx-auto text-green-700 bg-white border-2 border-nb-ink p-1 shadow-[2px_2px_0px_#0A0A0A]" />
            <h3 className="font-heading uppercase font-black text-lg text-green-900">
              Account Created Successfully!
            </h3>
            <p className="font-mono text-xs text-green-800">
              Redirecting you to the student login terminal...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <NBInput
              label="Full Name"
              placeholder="e.g. Arun Varadharajan"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
              required
            />

            <NBInput
              label="Registration Number"
              placeholder="e.g. RA2611003010042"
              value={formData.regNo}
              onChange={(e) => setFormData({ ...formData, regNo: e.target.value.toUpperCase() })}
              error={errors.regNo}
              helperText="Official format: 2 capital letters followed by 10-13 digits"
              required
            />

            <NBInput
              label="College Email Address"
              type="email"
              placeholder="student@srmtrichy.edu.in"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              required
            />

            {/* Section dropdown grouped by Year */}
            <div className="space-y-1.5">
              <label className="block font-heading uppercase text-xs font-black tracking-wider text-nb-ink">
                Class Section (Timetable)
              </label>
              <select
                value={formData.sectionId}
                onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white text-nb-ink font-mono text-sm border-[3px] border-nb-ink shadow-[4px_4px_0px_#0A0A0A] focus:outline-none cursor-pointer"
              >
                <optgroup label="Year I (Foundations)">
                  <option value="1-ece">Year I - ECE (Electronics &amp; Comm.)</option>
                  <option value="1-bme">Year I - BME (Biomedical Engg)</option>
                </optgroup>
                <optgroup label="Year II (Core)">
                  <option value="2-ece-a">Year II - ECE Section A</option>
                  <option value="2-ece-b">Year II - ECE Section B</option>
                  <option value="2-bme">Year II - BME (Biomedical Engg)</option>
                </optgroup>
                <optgroup label="Year III (Specialization)">
                  <option value="3-ece">Year III - ECE (General)</option>
                  <option value="3-ece-ds">Year III - ECE (Data Science Track)</option>
                  <option value="3-bme">Year III - BME (Biomedical Engg)</option>
                </optgroup>
                <optgroup label="Year IV (Final Year)">
                  <option value="4-ece">Year IV - ECE (IoT &amp; Projects)</option>
                  <option value="4-bme">Year IV - BME (Telemedicine &amp; Projects)</option>
                </optgroup>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NBInput
                label="Password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
                helperText="Min. 8 chars, 1 number & 1 letter"
                required
              />

              <NBInput
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                error={errors.confirmPassword}
                required
              />
            </div>

            {/* Terms checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.checked })}
                  className="mt-1 w-4 h-4 border-2 border-nb-ink text-nb-yellow rounded-none"
                />
                <span className="font-mono text-xs text-zinc-700 leading-tight">
                  I understand that this predictor calculates mathematical estimates based on my section timetable, and the official university portal remains the statutory record for detention.
                </span>
              </label>
              {errors.terms && (
                <div className="bg-nb-red text-white font-mono text-xs font-bold px-2.5 py-1 border-[2px] border-nb-ink shadow-[2px_2px_0px_#0A0A0A] inline-block mt-1">
                  ⚠ {errors.terms}
                </div>
              )}
            </div>

            <NBButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-4"
              disabled={loading}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              {loading ? "Registering Student Account..." : "Create Account & Go To Dashboard"}
            </NBButton>
          </form>
        )}

        <div className="text-center font-mono text-xs border-t border-zinc-200 pt-3">
          Already registered?{" "}
          <Link href="/login" className="font-black text-nb-ink underline hover:text-nb-blue">
            Sign In Here →
          </Link>
        </div>
      </NBCard>
    </div>
  );
}
