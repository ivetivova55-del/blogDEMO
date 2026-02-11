import { Sora, Newsreader } from "next/font/google";
import "./globals.css";
import { SonnerToaster } from "@/components/ui/sonner-toaster";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

export const metadata = {
  title: "Apex Digital - Marketing Task Hub",
  description: "Track marketing and blog-writing tasks with clarity.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${sora.variable} ${newsreader.variable} antialiased text-ink`}
      >
        {children}
        <SonnerToaster />
      </body>
    </html>
  );
}
