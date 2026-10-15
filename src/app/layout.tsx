import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pixel Palace — your favorite little arcade",
  description:
    "Five tiny throwbacks, absolutely no quarters. Drop into Pixel Palace and play Snake, Block Party, Breakout, Pong, and Space Invaders.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
