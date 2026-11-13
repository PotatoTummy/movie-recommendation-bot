import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CineBot | LiveKit Voice Movie Sommelier",
  description: "Real-time voice interactive AI movie recommendation assistant built with LiveKit WebRTC and TMDB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className="min-h-screen bg-[#080b11] text-gray-100 antialiased selection:bg-red-500/30 selection:text-white"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
