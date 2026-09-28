import Link from "next/link";
import { NBButton } from "@/components/nb/NBButton";
import { NBSticker } from "@/components/nb/NBSticker";
import { DoorClosed, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
      <div className="inline-block">
        <NBSticker color="red" rotate="-2" className="text-sm px-4 py-2">
          ERROR 404 • ROOM NOT FOUND
        </NBSticker>
      </div>

      <div className="w-20 h-20 bg-[#FFD93D] border-[3px] border-black rounded-[4px] shadow-[6px_6px_0px_#0A0A0A] flex items-center justify-center mx-auto">
        <DoorClosed size={40} className="text-black" />
      </div>

      <h1 className="font-heading font-black text-4xl sm:text-5xl uppercase tracking-tight text-black">
        YOU WANDERED INTO A BLANK CORRIDOR
      </h1>

      <p className="font-sans text-sm text-gray-700 max-w-md mx-auto">
        The page or room URL you requested does not exist in the SRM Trichy EEE floor registry.
      </p>

      <div className="pt-2 flex justify-center gap-4">
        <Link href="/grid">
          <NBButton variant="green" size="md">
            VIEW LIVE FLOOR GRID
          </NBButton>
        </Link>
        <Link href="/">
          <NBButton variant="secondary" size="md">
            <Home size={16} /> RETURN HOME
          </NBButton>
        </Link>
      </div>
    </div>
  );
}
