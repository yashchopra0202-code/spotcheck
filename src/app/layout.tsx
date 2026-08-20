import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpotCheck — trust your AI's numbers",
  description: "A 2-minute daily check for finance professionals who use AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
