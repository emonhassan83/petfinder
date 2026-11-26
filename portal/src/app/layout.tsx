import type { Metadata } from "next";
import { Nunito, Raleway } from "next/font/google";
import "./globals.css";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import ColorSchemeScript from "@/lib/providers/ColorSchemeScript";
import Providers from "@/lib/providers/Provider";
import { Toaster } from "sonner";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-inter" });
const raleway = Raleway({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-heading" });

//* The site has its own dark mode; ask the Dark Reader extension not to re-theme it
export const metadata: Metadata = { other: { "darkreader-lock": "true" } };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${nunito.variable} ${raleway.variable} ${nunito.className}`}>
        <ColorSchemeScript />
        <AppRouterCacheProvider>
          <Providers>
            <Toaster position="top-center" richColors />
            {children}
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
