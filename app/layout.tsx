import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "RotaFlow",
  description: "Vezi tura ta și cere schimburi cu colegii",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#1c1c1e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body className="bg-[#1c1c1e] antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
