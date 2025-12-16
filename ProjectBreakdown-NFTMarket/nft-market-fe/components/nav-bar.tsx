"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Search, Globe, Sun, Moon, Bell, Menu, X } from "lucide-react";
import { Input } from "@/components/ui/input";
// import { ConnectButton } from "@rainbow-me/rainbowkit";
import WalletConnect from "./wallet";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useEffect } from "react";

export function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNavigation = (path: string) => {
    router.push(`/${path}`);
  };

  return (
    <nav className="border-b border-gray-800 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="text-primary font-bold text-2xl font-poppins">
            {/* RCC */}
            <img src="/logo.png" alt="RCC" width={100} height={100} />
          </div>
          {/* 桌面端导航菜单 */}
          <div className="hidden md:flex space-x-6 text-sm">
            <a
              onClick={() => handleNavigation("collections")}
              className={`cursor-pointer ${
                pathname?.includes("collections")
                  ? "text-[#8e67e9] glow-text"
                  : "text-foreground hover:text-white"
              }`}
            >
              COLLECTIONS
            </a>
            <a
              onClick={() => handleNavigation("portfolio")}
              className={`cursor-pointer ${
                pathname?.includes("portfolio")
                  ? "text-[#8e67e9] glow-text"
                  : "text-foreground hover:text-white"
              }`}
            >
              PORTFOLIO
            </a>
            <a
              onClick={() => handleNavigation("activity")}
              className={`cursor-pointer ${
                pathname?.includes("activity")
                  ? "text-[#8e67e9] glow-text"
                  : "text-foreground hover:text-white"
              }`}
            >
              ACTIVITY
            </a>
            <a
              onClick={() => handleNavigation("airdrop")}
              className={`cursor-pointer ${
                pathname?.includes("airdrop")
                  ? "text-[#8e67e9] glow-text"
                  : "text-foreground hover:text-white"
              }`}
            >
              AIRDROP
            </a>
          </div>
        </div>

        {/* 桌面端右侧工具栏 */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="relative w-64">
            <Input
              type="search"
              placeholder="Collections, wallets, or ENS"
              className="bg-gray-900 border-gray-700 pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-foreground" />
          </div>
          <Globe className="h-5 w-5 text-foreground" />
          {
            // 避免服务器端渲染时的主题图标闪烁
            !mounted ? null : (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="text-foreground hover:text-white"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            )
          }

          <Bell className="h-5 w-5 text-foreground" />
          <ConnectButton />
          {/* <WalletConnect /> */}
        </div>

        {/* 移动端菜单按钮 */}
        <button 
          className="md:hidden text-foreground"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* 移动端菜单 */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[73px] bg-background z-50">
          <div className="flex flex-col p-4 space-y-4">
            <div className="flex flex-col space-y-4">
              <a
                onClick={() => {
                  handleNavigation("collections");
                  setIsMenuOpen(false);
                }}
                className={`cursor-pointer ${
                  pathname?.includes("collections")
                    ? "text-[#8e67e9] glow-text"
                    : "text-foreground hover:text-white"
                }`}
              >
                COLLECTIONS
              </a>
              <a
                onClick={() => {
                  handleNavigation("portfolio");
                  setIsMenuOpen(false);
                }}
                className={`cursor-pointer ${
                  pathname?.includes("portfolio")
                    ? "text-[#8e67e9] glow-text"
                    : "text-foreground hover:text-white"
                }`}
              >
                PORTFOLIO
              </a>
              <a
                onClick={() => {
                  handleNavigation("activity");
                  setIsMenuOpen(false);
                }}
                className={`cursor-pointer ${
                  pathname?.includes("activity")
                    ? "text-[#8e67e9] glow-text"
                    : "text-foreground hover:text-white"
                }`}
              >
                ACTIVITY
              </a>
              <a
                onClick={() => {
                  handleNavigation("airdrop");
                  setIsMenuOpen(false);
                }}
                className={`cursor-pointer ${
                  pathname?.includes("airdrop")
                    ? "text-[#8e67e9] glow-text"
                    : "text-foreground hover:text-white"
                }`}
              >
                AIRDROP
              </a>
            </div>
            
            <div className="space-y-4">
              <div className="relative w-full">
                <Input
                  type="search"
                  placeholder="Collections, wallets, or ENS"
                  className="bg-gray-900 border-gray-700 pl-10 w-full"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-foreground" />
              </div>
              
              <div className="flex items-center justify-between">
                <Globe className="h-5 w-5 text-foreground" />
                {!mounted ? null : (
                  <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="text-foreground hover:text-white"
                  >
                    {theme === "dark" ? (
                      <Sun className="h-5 w-5" />
                    ) : (
                      <Moon className="h-5 w-5" />
                    )}
                  </button>
                )}
                <Bell className="h-5 w-5 text-foreground" />
                {/* <ConnectButton /> */}
                <WalletConnect />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
