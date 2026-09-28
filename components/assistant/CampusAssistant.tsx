"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sparkles, X, Send, Bot, Calculator, Box, Flag, ArrowRight, CornerDownLeft } from "lucide-react";
import { findRooms, getRoomStatus, buildBookings } from "@/lib/engine";
import { parseQueryWithRegex } from "@/lib/parse";
import { useClockStore } from "@/lib/time/clockStore";
import sectionsData from "@/data/sections.json";
import roomsData from "@/data/rooms.json";
import { Section, Room } from "@/lib/schemas";

interface AssistantMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  actionCard?: {
    type: "ROOM_MATCH" | "ATTENDANCE_SUMMARY" | "LEAVE_SIMULATION";
    title: string;
    details: string;
    actionLabel?: string;
    actionHref?: string;
  };
}

export const CampusAssistant: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { getCorrectedNow, currentTimeStr } = useClockStore();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: "intro",
      sender: "assistant",
      text: "Hey! I am your SRM Trichy Campus Assistant. Ask me about free rooms on campus or simulated attendance and leave limits.",
    },
  ]);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSend = () => {
    const query = input.trim();
    if (!query) return;

    const userMsg: AssistantMessage = {
      id: String(Date.now()),
      sender: "user",
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Dual-Domain Engine Router
    const lower = query.toLowerCase();
    const now = getCorrectedNow();

    // 1. Attendance Domain Check
    if (lower.includes("attendance") || lower.includes("leave") || lower.includes("bunk") || lower.includes("margin") || lower.includes("od")) {
      setTimeout(() => {
        if (!session?.user) {
          setMessages((prev) => [
            ...prev,
            {
              id: String(Date.now() + 1),
              sender: "assistant",
              text: "To simulate personalized attendance and safe leaves, please sign in with your SRM registration number.",
              actionCard: {
                type: "ATTENDANCE_SUMMARY",
                title: "STUDENT LOGIN REQUIRED",
                details: "Access leave simulations, recovery targets, and official 75% calculations.",
                actionLabel: "GO TO LOGIN",
                actionHref: "/login",
              },
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: String(Date.now() + 1),
              sender: "assistant",
              text: `Based on your profile (${session.user?.name}): All calculations enforce the SRM 75% detention threshold. You can simulate OD and medical leaves directly on your dashboard.`,
              actionCard: {
                type: "ATTENDANCE_SUMMARY",
                title: "ATTENDANCE SIMULATOR",
                details: "Run What-If bunk analyses and safe leave forecasts.",
                actionLabel: "OPEN DASHBOARD",
                actionHref: "/dashboard",
              },
            },
          ]);
        }
      }, 300);
      return;
    }

    // 2. Room Domain Check
    const parsed = parseQueryWithRegex(query, now);
    if (parsed.off_topic) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now() + 1),
            sender: "assistant",
            text: "I can only answer questions about SRM Trichy EEE room availability or attendance forecasting.",
          },
        ]);
      }, 300);
      return;
    }

    // Run deterministic room engine
    const searchRes = findRooms(parsed, { referenceDate: now });
    const topMatch = searchRes.matches[0] || searchRes.partial[0];

    setTimeout(() => {
      if (topMatch) {
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now() + 1),
            sender: "assistant",
            text: `Found ${searchRes.matches.length} matching room(s). Best match: ${topMatch.room.label || topMatch.room.id} is available for ${topMatch.minutesAvailable} minutes.`,
            actionCard: {
              type: "ROOM_MATCH",
              title: `${topMatch.room.label || topMatch.room.id} (${topMatch.room.floor !== null ? `Floor ${topMatch.room.floor}` : "Annex"})`,
              details: `Available from ${topMatch.window.startTime} to ${topMatch.window.endTime} (${topMatch.minutesAvailable} mins)`,
              actionLabel: "FOCUS IN 3D MAP",
              actionHref: `/rooms?focus=${topMatch.room.id}`,
            },
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now() + 1),
            sender: "assistant",
            text: "No rooms currently meet your exact duration and criteria. Try checking the 3D building map for upcoming free slots.",
            actionCard: {
              type: "ROOM_MATCH",
              title: "EXPLORE 3D BUILDING",
              details: "View live floor grid and per-room countdowns.",
              actionLabel: "OPEN 3D MAP",
              actionHref: "/rooms",
            },
          },
        ]);
      }
    }, 300);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 px-3.5 py-2.5 bg-[#FF6B9D] text-black font-heading text-xs font-black uppercase tracking-wider border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0A0A0A] transition-all flex items-center gap-2"
      >
        <Sparkles size={16} />
        <span>ASSISTANT</span>
        <span className="hidden sm:inline px-1 py-0.2 bg-black text-[#FFD93D] text-[10px] rounded border border-black">
          ⌘K
        </span>
      </button>

      {/* Modal / Command Palette */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50">
          <div className="w-full max-w-xl bg-white border-[4px] border-black rounded-[6px] shadow-[8px_8px_0px_#0A0A0A] flex flex-col max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="p-3 bg-[#FFD93D] border-b-2 border-black flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-black" />
                <span className="font-heading font-black text-sm uppercase tracking-wide text-black">
                  CAMPUS ASSISTANT • DUAL DOMAIN
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-black/10 rounded border border-black text-black"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs max-h-[400px]">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-[3px] border-2 border-black ${
                      m.sender === "user"
                        ? "bg-[#4D96FF] text-white shadow-[2px_2px_0px_#0A0A0A]"
                        : "bg-white text-black shadow-[2px_2px_0px_#0A0A0A]"
                    }`}
                  >
                    {m.text}
                  </div>

                  {/* Result Action Card */}
                  {m.actionCard && (
                    <div className="mt-2 w-[85%] p-3 bg-[#FFF8E7] border-2 border-black rounded-[3px] shadow-[3px_3px_0px_#0A0A0A] space-y-1">
                      <div className="font-heading font-black text-xs uppercase text-black">
                        {m.actionCard.title}
                      </div>
                      <div className="text-[11px] text-gray-700">{m.actionCard.details}</div>
                      {m.actionCard.actionHref && (
                        <div className="pt-2">
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              router.push(m.actionCard!.actionHref!);
                            }}
                            className="px-3 py-1 bg-black text-[#FFD93D] font-heading text-[11px] font-black uppercase rounded-[2px] border border-black hover:bg-[#FF6B9D] hover:text-white flex items-center gap-1 transition-all"
                          >
                            {m.actionCard.actionLabel} <ArrowRight size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Prompt Input */}
            <div className="p-3 border-t-2 border-black bg-gray-50 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask e.g. 'AC room on 4th floor for 90 mins' or 'Check my attendance'"
                className="flex-1 p-2.5 border-2 border-black rounded-[2px] bg-white font-mono text-xs focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleSend}
                className="p-2.5 bg-[#FF6B9D] text-black border-2 border-black rounded-[2px] shadow-[2px_2px_0px_#0A0A0A] hover:bg-[#ff558f]"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
