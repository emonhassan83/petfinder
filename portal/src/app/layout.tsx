import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import ColorSchemeScript from "@/lib/providers/ColorSchemeScript";
import Providers from "@/lib/providers/Provider";
import { Toaster } from "sonner";

//* Body/UI font
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body" });
//* Heading font (variable, optical-size axis; italic used for emphasis words)
const fraunces = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"], variable: "--font-heading" });

//* The site has its own dark mode; ask the Dark Reader extension not to re-theme it
export const metadata: Metadata = { other: { "darkreader-lock": "true" } };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${fraunces.variable} ${manrope.className}`}>
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
