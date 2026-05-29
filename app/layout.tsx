import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Load Inter via next/font for optimal performance (self-hosted, no FOUT)
// This takes precedence over the @import in globals.css for production,
// but both are included for resilience.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Student Daily Marks Tracker",
  description:
    "An internship management tool for recording and reviewing daily student performance marks on a calendar-based interface.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Default to dark mode as per PRD Section 2 and 7.2.
    // The ThemeToggle component will update this attribute on the client
    // based on localStorage / prefers-color-scheme on first load.
    <html lang="en" data-theme="dark" className={inter.variable}>
      <body style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
