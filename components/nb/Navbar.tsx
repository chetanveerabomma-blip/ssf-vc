"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Box, LayoutGrid, Calculator, ShieldCheck, User, LogOut, Menu, X, Sparkles } from "lucide-react";
import { useClockStore } from "@/lib/time/clockStore";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { currentTimeStr } = useClockStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "ROOMS (3D)", href: "/rooms", icon: <Box size={14} /> },
    { label: "ATTENDANCE", href: "/dashboard", icon: <Calculator size={14} /> },
    { label: "DATA & AUDIT", href: "/data", icon: <ShieldCheck size={14} /> },
    { label: "ADMIN", href: "/admin", icon: <User size={14} /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b-[3px] border-black bg-[#FFF8E7]">
      {/* Top Ticker Strip */}
      <div className="bg-[#0A0A0A] text-[#FFD93D] px-4 py-1 font-mono text-[10px] font-black uppercase tracking-wider overflow-hidden whitespace-nowrap border-b border-black flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>⚡ SRM TRICHY • SCHOOL OF EEE</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">RATE YOUR ATTENDANCE</span>
          <span>•</span>
          <span>ROOMS FREE NOW</span>
          <span>•</span>
          <span className="text-[#6BCB77]">SEMESTER RUNNING (AUG 29 - NOV 29)</span>
        </div>
        <div className="font-mono text-white flex items-center gap-1.5 pl-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span>{currentTimeStr || "IST"}</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-[#FF6B9D] border-2 border-black rounded-[2px] flex items-center justify-center font-heading font-black text-black text-lg shadow-[2px_2px_0px_#0A0A0A] group-hover:-translate-y-0.5 transition-all">
            FM
          </div>
          <div>
            <span className="font-heading font-black text-lg sm:text-xl tracking-tight text-black block leading-none">
              CAMPUS UNIFIED
            </span>
            <span className="font-mono text-[9px] font-bold text-gray-600 uppercase tracking-widest">
              EEE • FLOOR & ATTENDANCE
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-heading text-xs font-black uppercase rounded-[2px] border-2 border-black transition-all ${
                  isActive
                    ? "bg-[#FFD93D] text-black shadow-[2px_2px_0px_#0A0A0A] -translate-y-0.5"
                    : "bg-white text-black hover:bg-gray-100"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Auth Info / Login */}
        <div className="hidden md:flex items-center gap-2">
          {session?.user ? (
            <div className="flex items-center gap-2">
              <Link href="/profile">
                <div className="px-3 py-1 bg-white border-2 border-black rounded-[2px] font-mono text-xs font-black shadow-[2px_2px_0px_#0A0A0A] hover:bg-gray-100 flex items-center gap-1.5">
                  <User size={13} />
                  <span>{session.user.name?.split(" ")[0] || "Student"}</span>
                </div>
              </Link>
              <button
                onClick={() => signOut()}
                className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 border-2 border-black rounded-[2px]"
                title="Sign Out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 bg-white text-black font-heading text-xs font-black uppercase rounded-[2px] border-2 border-black shadow-[2px_2px_0px_#0A0A0A] hover:bg-gray-100"
              >
                LOGIN
              </Link>
              <Link
                href="/register"
                className="px-3 py-1.5 bg-[#FF6B9D] text-black font-heading text-xs font-black uppercase rounded-[2px] border-2 border-black shadow-[2px_2px_0px_#0A0A0A] hover:bg-[#ff558f]"
              >
                REGISTER
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 border-2 border-black rounded-[2px] bg-white"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden p-4 bg-white border-t-2 border-black space-y-2 font-heading font-black text-xs uppercase">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2.5 border-2 border-black rounded-[2px] bg-[#FFF8E7]"
            >
              {item.icon} {item.label}
            </Link>
          ))}
          {session?.user ? (
            <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
              <span className="font-mono">{session.user.name}</span>
              <button
                onClick={() => signOut()}
                className="px-2.5 py-1 bg-red-100 text-red-700 border border-black rounded font-bold"
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-gray-200 flex gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center border-2 border-black rounded bg-white"
              >
                LOGIN
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center border-2 border-black rounded bg-[#FF6B9D]"
              >
                REGISTER
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
