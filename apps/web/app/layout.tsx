import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumen",
  description: "AI-powered journaling, memory, and mental wellness."
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
