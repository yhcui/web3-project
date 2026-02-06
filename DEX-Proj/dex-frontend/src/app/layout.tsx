import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import Header from "@/components/layout/Header";
import { Web3Provider } from "@/components/providers/Web3Provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MetaNodeSwap - 去中心化交易所",
  description: "基于区块链的去中心化代币交换平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground min-h-screen font-sans`}
      >
        <Web3Provider>
          <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-100 to-gray-100">
            <Header />
            <main className="container mx-auto px-4 py-8">{children}</main>
          </div>
        </Web3Provider>
      </body>
    </html>
  );
}
