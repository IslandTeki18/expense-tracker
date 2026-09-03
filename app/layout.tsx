import type { Metadata, Viewport } from "next";
import { Space_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { AuthProvider } from "@/components/AuthContext";
import { ActorProvider } from "@/components/ActorContext";
import ThemeProvider from "@/components/ThemeProvider";

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shared Ledger",
  description: "Track shared income and expenses for one bank account",
  icons: { icon: "/favicon.svg", apple: "/mark-dark.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={spaceMono.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ConvexClientProvider>
            <AuthProvider>
              <ActorProvider>{children}</ActorProvider>
            </AuthProvider>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
