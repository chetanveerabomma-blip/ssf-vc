import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/nb/Navbar";
import { Footer } from "@/components/nb/Footer";
import { CampusAssistant } from "@/components/assistant/CampusAssistant";
import { SessionProviderWrapper } from "@/components/SessionProviderWrapper";

export const metadata: Metadata = {
  title: "CAMPUS UNIFIED | SRM Trichy School of EEE",
  description:
    "Integrated attendance forecasting, 3D interactive building map, live per-room countdowns, and Call the Squad for SRM Trichy School of EEE.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-[#FFF8E7] text-black">
        <SessionProviderWrapper>
          <Navbar />
          <main className="flex-1">{children}</main>
          <CampusAssistant />
          <Footer />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
