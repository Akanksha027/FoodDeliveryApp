import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "Sandwiches — Food Delivery App by Akanksha",
  description:
    "A complete end-to-end food delivery mobile app built for restaurants and customers. Download the APK or contact Akanksha to get a custom version for your business.",
  keywords: ["food delivery app", "restaurant app", "mobile app", "Akanksha", "order management"],
  openGraph: {
    title: "Sandwiches — Food Delivery App",
    description: "Order food, manage your restaurant, track deliveries — all in one app.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
