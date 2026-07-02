import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/providers";
import { AuthProvider } from "../components/AuthProvider";
import { ToastProvider } from "../components/Toaster";
import { PushForegroundListener } from "../components/PushForegroundListener";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gram Panchayat Gandhawad — Official Village Portal",
  description:
    "Official portal of Gram Panchayat Gandhawad, Madhya Pradesh: schemes, polls, complaints, budget transparency, development works and Gram Sabha records.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Gandhawad Portal", statusBarStyle: "default" },
};

export const viewport = {
  themeColor: "#15803d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Suppress hydration warning for next-themes
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ToastProvider>
              {children}
              <PushForegroundListener />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
