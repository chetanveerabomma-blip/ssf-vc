"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FinderBar } from "@/components/finder/FinderBar";
import { InterpretationStrip } from "@/components/finder/InterpretationStrip";
import { ResultCard } from "@/components/finder/ResultCard";
import { RoomMatch, findRooms } from "@/lib/engine";
import { RoomQuery } from "@/lib/schemas";
import { NBSticker } from "@/components/nb/NBSticker";
import { Sparkles, AlertCircle, Info, RefreshCw } from "lucide-react";

function FinderPageContent() {
  const searchParams = useSearchParams();
  const [queryText, setQueryText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [parsedQuery, setParsedQuery] = useState<RoomQuery | null>(null);
  const [assumptions, setAssumptions] = useState<string[]>([]);
  const [matches, setMatches] = useState<RoomMatch[]>([]);
  const [partialMatches, setPartialMatches] = useState<RoomMatch[]>([]);
  const [isFallback, setIsFallback] = useState(false);

  const executeSearch = async (text: string) => {
    setIsLoading(true);
    setError(null);
    setQueryText(text);

    try {
      const res = await fetch("/api/finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process query");
      }

      setAiMessage(data.message || null);
      setParsedQuery(data.query || null);
      setAssumptions(data.assumptions || []);
      setMatches(data.matches || []);
      setPartialMatches(data.partial || []);
      setIsFallback(Boolean(data.isFallback));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while finding rooms.");
    } finally {
      setIsLoading(false);
    }
  };

  // Re-run search directly from the client when user edits the interpretation strip chips
  const handleUpdateQuery = (newQuery: RoomQuery) => {
    setParsedQuery(newQuery);
    setAssumptions(newQuery.assumptions);

    // Run engine directly on client!
    const searchRes = findRooms(newQuery);
    setMatches(searchRes.matches);
    setPartialMatches(searchRes.partial);

    const count = searchRes.matches.length;
    setAiMessage(
      count > 0
        ? `Parameters updated directly: Found ${count} matching room${count > 1 ? "s" : ""}.`
        : `Parameters updated directly: No full matches found. Showing ${searchRes.partial.length} partial matches.`
    );
  };

  // Handle URL param ?q=
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQueryText(q);
      executeSearch(q);
    }
  }, [searchParams]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Title & Badges */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <NBSticker color="pink" rotate="-1">
            SMART ASSISTANT
          </NBSticker>
          {isFallback && (
            <span className="px-2.5 py-0.5 bg-[#FFD93D] border-2 border-black rounded-[2px] font-mono text-xs font-black">
              AI OFFLINE • REGEX ENGINE ACTIVE
            </span>
          )}
        </div>
        <h1 className="font-heading font-black text-3xl sm:text-4xl uppercase tracking-wider text-black">
          AI ROOM FINDER
        </h1>
        <p className="font-sans text-sm text-gray-700">
          Describe what kind of space you need in plain English. We extract time, floor, team size,
          and AC requirements, and calculate exact free availability windows.
        </p>
      </div>

      {/* Main Search Input */}
      <div className="p-4 sm:p-6 bg-white border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A]">
        <FinderBar onSearch={executeSearch} isLoading={isLoading} initialValue={queryText} />
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-100 border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A] flex items-center gap-3 text-red-900 font-mono text-xs font-bold">
          <AlertCircle size={20} className="flex-shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state skeleton */}
      {isLoading && (
        <div className="p-8 bg-white border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] text-center space-y-3 animate-pulse">
          <div className="inline-block p-3 bg-[#FFD93D] border-2 border-black rounded-full">
            <Sparkles size={24} className="text-black animate-spin" />
          </div>
          <h3 className="font-heading font-black text-lg uppercase text-black">
            SEARCHING SRM TRICHY EEE TIMETABLES...
          </h3>
          <p className="font-mono text-xs text-gray-600">
            Resolving time expressions and evaluating cross-section period allocations
          </p>
        </div>
      )}

      {/* Results Section */}
      {!isLoading && parsedQuery && (
        <div className="space-y-6 animate-in fade-in">
          {/* Interpretation Strip */}
          <InterpretationStrip
            query={parsedQuery}
            assumptions={assumptions}
            onUpdateQuery={handleUpdateQuery}
          />

          {/* AI Message Explanation */}
          {aiMessage && (
            <div className="p-4 bg-[#FF6B9D]/15 border-[3px] border-black rounded-[4px] shadow-[4px_4px_0px_#0A0A0A] font-sans text-sm text-black font-semibold flex items-start gap-3">
              <Sparkles size={18} className="text-[#FF6B9D] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-mono text-[10px] uppercase font-black tracking-wider block text-gray-700">
                  Assistant Summary
                </span>
                {aiMessage}
              </div>
            </div>
          )}

          {/* Full Matches */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <h2 className="font-heading font-black text-xl uppercase tracking-wider text-black flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-[#6BCB77] border-2 border-black inline-block rounded-xs" />
                EXACT MATCHES ({matches.length})
              </h2>
              <span className="font-mono text-xs font-bold text-gray-600">
                Covers your full requested duration
              </span>
            </div>

            {matches.length === 0 ? (
              <div className="p-6 bg-white border-2 border-black rounded-[4px] text-center space-y-2">
                <p className="font-heading font-black text-base text-gray-800 uppercase">
                  NO FULL MATCHES FOUND FOR THIS EXACT INTERVAL
                </p>
                <p className="font-sans text-xs text-gray-600 max-w-md mx-auto">
                  Every room that meets your floor/AC filters has a class scheduled during part of
                  your requested time. Check the partial matches below or adjust your time in the
                  chips above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map((match) => (
                  <ResultCard key={match.room.id} match={match} />
                ))}
              </div>
            )}
          </div>

          {/* Partial Matches ("CLOSE, BUT NOT QUITE") */}
          {partialMatches.length > 0 && (
            <div className="space-y-4 pt-6">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <h2 className="font-heading font-black text-xl uppercase tracking-wider text-black flex items-center gap-2">
                  <span className="w-3.5 h-3.5 bg-[#FFD93D] border-2 border-black inline-block rounded-xs" />
                  CLOSE, BUT NOT QUITE ({partialMatches.length})
                </h2>
                <span className="font-mono text-xs font-bold text-gray-600">
                  Free for part of your requested time
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {partialMatches.slice(0, 6).map((match) => (
                  <ResultCard key={match.room.id} match={match} isPartial />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FinderPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto p-12 text-center font-mono text-sm font-bold">
          LOADING AI ROOM FINDER...
        </div>
      }
    >
      <FinderPageContent />
    </Suspense>
  );
}
