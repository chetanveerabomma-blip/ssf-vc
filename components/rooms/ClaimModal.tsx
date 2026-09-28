"use client";

import React, { useState } from "react";
import { NBModal } from "@/components/nb/NBModal";
import { NBButton } from "@/components/nb/NBButton";
import { Flag, Users, Check } from "lucide-react";

interface ClaimModalProps {
  isOpen: boolean;
  roomId: string;
  roomLabel?: string;
  onClose: () => void;
  onConfirmClaim: (data: { squadSize: number; nickname: string }) => Promise<void>;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  isOpen,
  roomId,
  roomLabel,
  onClose,
  onConfirmClaim,
}) => {
  const [squadSize, setSquadSize] = useState(3);
  const [nickname, setNickname] = useState("ECE Project Group");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirmClaim({ squadSize, nickname });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <NBModal
      isOpen={isOpen}
      onClose={onClose}
      title={`CLAIM ROOM: ${roomLabel || roomId}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
        <p className="text-gray-700">
          Claiming holds this room for your group on the 3D building map and alerts other students that a squad is inside.
        </p>

        <div>
          <label className="block font-heading font-black uppercase text-xs mb-1">
            Squad / Group Nickname
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g. ECE Study Squad"
            className="w-full p-2 border-2 border-black rounded bg-white font-mono text-sm"
            required
          />
        </div>

        <div>
          <label className="block font-heading font-black uppercase text-xs mb-1">
            Headcount (Squad Size)
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
              <button
                type="button"
                key={num}
                onClick={() => setSquadSize(num)}
                className={`w-9 h-9 border-2 border-black rounded font-black font-mono text-xs ${
                  squadSize === num
                    ? "bg-[#4D96FF] text-white shadow-[2px_2px_0px_#0A0A0A]"
                    : "bg-white text-black hover:bg-gray-100"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border-2 border-black rounded font-heading font-bold text-xs uppercase"
          >
            CANCEL
          </button>
          <NBButton type="submit" variant="yellow" size="sm" disabled={loading}>
            <Flag size={14} /> {loading ? "HOLDING ROOM..." : "CONFIRM CLAIM"}
          </NBButton>
        </div>
      </form>
    </NBModal>
  );
};
