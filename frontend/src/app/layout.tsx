import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FutureTr@ce — AI Innovation Intelligence Platform",
  description: "Real-time agentic AI platform that detects emerging technologies, explores rabbit holes, and generates actionable intelligence for VCs and R&D labs.",
  keywords: "AI, emerging technology, trend detection, innovation intelligence, venture capital, technology radar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
