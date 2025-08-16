import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ToastProvider from "@/components/ui/ToastProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StayCool CRM - Lead Management & Automation",
  description: "Moderne CRM voor HVAC bedrijven met lead management, automatisering en multi-tenant ondersteuning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className={inter.className}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
