import React from "react";
import Link from "next/link";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#0A0A0A] text-white border-t-[4px] border-black py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Brand */}
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#FFD93D] border-2 border-white rounded-[2px] flex items-center justify-center font-heading font-black text-black text-lg">
              FM
            </div>
            <span className="font-heading font-black text-xl tracking-wider text-white">
              FLOOR MANAGER
            </span>
          </div>
          <p className="font-mono text-xs text-gray-300 max-w-md">
            Department of Electrical and Electronics Engineering (EEE), SRM Trichy Campus.
            Engineered to end corridor wandering with deterministic room search.
          </p>
          <div className="p-3 bg-[#1A1A1A] border-2 border-gray-700 rounded-[2px] text-xs font-mono text-[#FFD93D] max-w-lg">
            <strong>NOTICE:</strong> Based on published timetables (Semester 29 Aug - 29 Nov 2026).
            Ad-hoc bookings and unscheduled faculty meetings are not tracked.
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-2">
          <h4 className="font-heading font-black text-sm uppercase tracking-wider text-[#FF6B9D]">
            Navigation
          </h4>
          <ul className="space-y-1 font-mono text-xs text-gray-300">
            <li>
              <Link href="/grid" className="hover:text-[#FFD93D] hover:underline">
                Floor Grid (Live)
              </Link>
            </li>
            <li>
              <Link href="/finder" className="hover:text-[#FFD93D] hover:underline">
                AI Room Finder
              </Link>
            </li>
            <li>
              <Link href="/data" className="hover:text-[#FFD93D] hover:underline">
                Transparency & Audits
              </Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-[#FFD93D] hover:underline">
                Admin Panel
              </Link>
            </li>
          </ul>
        </div>

        {/* System Info */}
        <div className="space-y-2">
          <h4 className="font-heading font-black text-sm uppercase tracking-wider text-[#6BCB77]">
            System Info
          </h4>
          <ul className="space-y-1 font-mono text-xs text-gray-300">
            <li>Timezone: Asia/Kolkata (IST)</li>
            <li>Operating Hours: 08:00 - 18:00</li>
            <li>Sections Tracked: 12 Sections</li>
            <li>Design: Neobrutalism System</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-gray-400 gap-4">
        <span>© 2026 SRM Trichy • School of EEE. All rights reserved.</span>
        <span className="px-2 py-0.5 bg-gray-800 text-[#FFD93D] border border-gray-600 rounded-[2px]">
          v1.0.0 NEOBRUTAL
        </span>
      </div>
    </footer>
  );
};
