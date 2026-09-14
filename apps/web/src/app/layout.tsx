import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrustFlow - Financial Trust Platform",
  description: "Simulation / Research Prototype",
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
