import { Outfit, Inter, Nothing_You_Could_Do, Playfair_Display } from "next/font/google"; // Use google fonts
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const nothingYouCouldDo = Nothing_You_Could_Do({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-nothing-you-could-do",
  display: "swap",
});

export const metadata = {
  title: "OurLoveNotes - Share Your Love Story",
  description: "Create beautiful, animated love stories to share with your special someone.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${inter.variable} ${nothingYouCouldDo.variable} ${playfair.variable} antialiased bg-stone-50 text-stone-900 selection:bg-pink-200 selection:text-pink-900 h-full`}
      >
        {children}
      </body>
    </html>
  );
}
