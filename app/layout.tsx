import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/nb/Navbar";
import { Footer } from "@/components/nb/Footer";
import { Marquee } from "@/components/nb/Marquee";

export const metadata: Metadata = {
  title: "FLOOR MANAGER | SRM Trichy School of EEE",
  description:
    "Real-time room availability and AI room finder for SRM Trichy, School of EEE. Find which rooms are empty right now, and which fit your needs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <Marquee />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
