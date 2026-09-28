"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NBButton } from "./NBButton";
import { Menu, X, Sparkles, LayoutGrid, Database, ShieldAlert } from "lucide-react";
import { clsx } from "clsx";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "GRID", href: "/grid", icon: LayoutGrid },
    { label: "AI FINDER", href: "/finder", icon: Sparkles },
    { label: "DATA & AUDIT", href: "/data", icon: Database },
    { label: "ADMIN", href: "/admin", icon: ShieldAlert },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFF8E7] border-b-[3px] border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-[#FFD93D] border-[3px] border-black rounded-[4px] shadow-[3px_3px_0px_#0A0A0A] flex items-center justify-center font-heading font-black text-xl text-black group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
            FM
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-black text-base sm:text-lg tracking-wider text-black leading-none">
              FLOOR MANAGER
            </span>
            <span className="font-mono text-[10px] font-bold text-gray-700 tracking-widest mt-0.5">
              SRM TRICHY • EEE
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "font-heading text-xs font-black uppercase tracking-wider px-3 py-1.5 transition-all rounded-[2px]",
                  isActive
                    ? "bg-[#FFD93D] border-2 border-black shadow-[2px_2px_0px_#0A0A0A] text-black"
                    : "text-black hover:bg-white hover:border-2 hover:border-black hover:shadow-[2px_2px_0px_#0A0A0A]"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* CTA Button */}
        <div className="hidden sm:flex items-center gap-3">
          <Link href="/grid">
            <NBButton variant="pink" size="sm">
              OPEN FLOOR GRID
            </NBButton>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <Link href="/grid">
            <NBButton variant="pink" size="sm" className="px-2 py-1 text-xs">
              GRID
            </NBButton>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 bg-white border-2 border-black rounded-[4px] shadow-[2px_2px_0px_#0A0A0A] text-black focus:outline-none"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-[3px] border-black bg-white p-4 space-y-2 animate-in slide-in-from-top-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-4 py-2.5 rounded-[4px] border-2 border-black font-heading text-sm font-black uppercase tracking-wider",
                  isActive ? "bg-[#FFD93D] shadow-[2px_2px_0px_#0A0A0A]" : "bg-white"
                )}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
