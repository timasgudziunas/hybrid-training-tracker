import type { Metadata } from "next";
import { Big_Shoulders, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

// Condensed display face for workout names, weekday eyebrows, and every big
// numeral (timer, weights, set counts, completion stats). Stadium-signage
// character without reading as a gym flyer.
const displayFont = Big_Shoulders({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-shoulders",
  display: "swap",
});

// Engineering-grade humanist sans for everything else: body copy, labels,
// buttons, form fields, nav.
const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hybrid Training Tracker",
  description: "Personal athletic training tracker",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full ${displayFont.variable} ${bodyFont.variable}`}>
      <body className="flex min-h-full flex-col bg-surface-0 font-sans text-ink-primary antialiased">
        {children}
      </body>
    </html>
  );
}
