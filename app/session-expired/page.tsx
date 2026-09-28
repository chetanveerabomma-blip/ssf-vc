import React from "react";
import Link from "next/link";
import { NBButton } from "@/components/nb/NBButton";
import { NBSticker } from "@/components/nb/NBSticker";
import { Clock, LogIn } from "lucide-react";

export default function SessionExpiredPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
      <div className="inline-block">
        <NBSticker text="AUTH TIMEOUT" color="yellow" rotation="-2deg" />
      </div>

      <div className="bg-white border-[4px] border-nb-ink p-8 shadow-[8px_8px_0px_#0A0A0A] space-y-4">
        <div className="w-16 h-16 bg-yellow-100 border-[3px] border-nb-ink flex items-center justify-center mx-auto shadow-[3px_3px_0px_#0A0A0A]">
          <Clock className="w-10 h-10 text-nb-ink" />
        </div>

        <h1 className="font-heading uppercase font-black text-2xl sm:text-3xl text-nb-ink">
          SESSION EXPIRED
        </h1>

        <p className="font-mono text-xs sm:text-sm text-zinc-700 leading-relaxed max-w-md mx-auto">
          Your secure authentication cookie has expired or was cleared. Please sign in again with your registration number.
        </p>

        <div className="pt-4 flex justify-center">
          <Link href="/login">
            <NBButton size="md" variant="primary">
              <LogIn className="w-4 h-4 mr-2" />
              Sign In Again
            </NBButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
