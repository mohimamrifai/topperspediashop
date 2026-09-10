import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

import { RealtimeBridge } from "./_components/realtime-bridge";
import { ToastProvider } from "./_components/toast";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TopperspediaShop",
  description: "TopperspediaShop",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <RealtimeBridge />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
