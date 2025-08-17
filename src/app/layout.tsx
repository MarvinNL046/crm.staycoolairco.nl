import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import ToastProvider from "@/components/ui/ToastProvider";
import "./globals.css";

const lexend = Lexend({ 
  subsets: ["latin"],
  variable: "--font-lexend",
  display: 'swap',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
});

export const metadata: Metadata = {
  title: "StayCool CRM - Lead Management & Automation",
  description: "Moderne CRM voor HVAC bedrijven met lead management, automatisering en multi-tenant ondersteuning",
  icons: {
    icon: '/favicon.ico',
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body className={lexend.className}>
        <ThemeProvider
          defaultTheme="system"
          storageKey="staycool-theme"
        >
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
