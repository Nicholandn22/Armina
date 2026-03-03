"use client";

import { useState, useEffect } from "react";
import { formatUnits } from "viem";
import { useIDRXBalance, useIDRXDecimals } from "@/hooks/useIDRX";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ConnectButton } from "./ConnectButton";
import { useAuth } from "@/hooks/useAuth";
import { useBalance, useChainId, useSwitchChain } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { useLanguage } from "@/components/providers";

export function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const { address, isConnected: isUserConnected, disconnect } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const { data: balance, isLoading } = useIDRXBalance(address);
  const { data: idrxDecimals } = useIDRXDecimals();
  const { data: ethBalance } = useBalance({
    address: address,
    chainId: baseSepolia.id,
  });
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const isWrongNetwork = isUserConnected && !!address && chainId !== baseSepolia.id;
  const { language, setLanguage, t } = useLanguage();

  // Auto-switch to Base Sepolia when on wrong network
  useEffect(() => {
    if (isWrongNetwork && !isSwitching) {
      switchChain({ chainId: baseSepolia.id });
    }
  }, [isWrongNetwork]);

  const navItems = [
    {
      id: "home",
      label: t.navHome,
      href: "/",
    },
    {
      id: "features",
      label: t.navFeatures,
      href: "#",
      children: [
        {
          id: "optimizer",
          label: t.navAiYield,
          href: "/optimizer",
          description: t.navAiYieldDesc,
          icon: (
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          )
        },
        {
          id: "pool",
          label: t.navPool,
          href: "/pool",
          description: t.navPoolDesc,
          icon: (
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        {
          id: "leaderboard",
          label: t.navRank,
          href: "/peringkat",
          description: t.navRankDesc,
          icon: (
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2v-6a2 2 0 00-2-2h-2a2 2 0 00-2 2v6" />
            </svg>
          )
        },
        {
          id: "profile",
          label: t.navProfile,
          href: "/profil",
          description: t.navProfileDesc,
          icon: (
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )
        },
        {
          id: "faucet",
          label: t.navFaucet,
          href: "/profil#faucet",
          description: t.navFaucetDesc,
          icon: (
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          )
        },
      ]
    },
    {
      id: "about",
      label: t.navAboutUs,
      href: "/about",
    },
    {
      id: "contact",
      label: t.navContact,
      href: "/contact",
    },
  ];

  const formatBalance = (bal: bigint | undefined) => {
    if (!bal) return "0";
    const decimals = Number(idrxDecimals ?? 18);
    const idrxInt = Math.floor(parseFloat(formatUnits(bal, decimals)));
    if (idrxInt >= 1_000_000_000_000) return `${Math.floor(idrxInt / 1_000_000_000_000)}T`;
    if (idrxInt >= 1_000_000_000) return `${Math.floor(idrxInt / 1_000_000_000)}B`;
    if (idrxInt >= 1_000_000) return `${Math.floor(idrxInt / 1_000_000)}M`;
    if (idrxInt >= 1_000) return `${Math.floor(idrxInt / 1_000)}K`;
    return idrxInt.toString();
  };

  const formatETHBalance = (bal: bigint | undefined) => {
    if (!bal) return "0";
    const value = Number(formatUnits(bal, 18));
    if (value >= 1) {
      return value.toFixed(4);
    }
    if (value >= 0.0001) {
      return value.toFixed(6);
    }
    return value.toFixed(8);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#1e2a4a] text-white shadow-lg pt-safe">
      <div className="w-full mx-auto px-4 md:px-8 h-18 py-2 flex items-center justify-between relative">


        {/* Center - Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            // Check if item has children (Dropdown)
            if (item.children) {
              const isChildActive = item.children.some(child => pathname.startsWith(child.href));

              return (
                <div key={item.id} className="relative group">
                  <button
                    className={`flex items-center gap-1 px-5 py-2 rounded-lg text-base font-medium transition-colors ${isChildActive
                      ? "bg-white/80 text-[#1e2a4a] shadow-sm backdrop-blur-sm"
                      : "text-white/90 hover:text-white hover:bg-white/10"
                      }`}
                  >
                    {item.label}
                    <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top translate-y-2 group-hover:translate-y-0 z-50">
                    <div className="p-2 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.id}
                          href={child.href}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group/item"
                        >
                          <div className="mt-1 p-2 bg-slate-50 rounded-lg group-hover/item:bg-white group-hover/item:shadow-sm transition-all">
                            {child.icon}
                          </div>
                          <div>
                            <p className="text-base font-bold text-slate-800">{child.label}</p>
                            <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{child.description}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`px-5 py-2 rounded-lg text-base font-medium transition-colors ${isActive
                  ? "bg-white/80 text-[#1e2a4a] shadow-sm backdrop-blur-sm"
                  : "text-white/90 hover:text-white hover:bg-white/10"
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Side - Balance & Wallet */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-white/10 rounded-full p-1">
            {(["en", "id", "zh"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  language === lang
                    ? "bg-white text-[#1e2a4a]"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Wrong Network Badge */}
          {isWrongNetwork && (
            <button
              onClick={() => switchChain({ chainId: baseSepolia.id })}
              disabled={isSwitching}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {isSwitching ? t.switching : t.wrongNetwork}
            </button>
          )}

          {/* ETH & IDRX Balance - 2 Columns */}
          {isUserConnected && address && !isWrongNetwork && (
            <div className="flex items-center bg-white/10 rounded-lg overflow-hidden divide-x divide-white/20">
              {/* ETH Balance Column */}
              <div className="flex items-center gap-2 px-4 py-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">Ξ</span>
                </div>
                <span className="text-base font-semibold">
                  {formatETHBalance(ethBalance?.value)}
                </span>
                <span className="text-sm text-white/60">ETH</span>
              </div>

              {/* IDRX Balance Column */}
              <div className="flex items-center gap-2 px-4 py-2">
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
                <span className="text-base font-semibold">
                  {isLoading ? "..." : formatBalance(balance)}
                </span>
                <span className="text-sm text-white/60">IDRX</span>
              </div>
            </div>
          )}

          {/* Wallet: always show address+disconnect when connected, only show Connect on non-homepage */}
          {isUserConnected && address ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                  {address.slice(2, 4).toUpperCase()}
                </div>
                <span className="text-sm font-mono text-white/90 hidden sm:block">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
                <svg className="w-3.5 h-3.5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                    <div className="p-3 border-b border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">Connected</p>
                      <p className="text-sm font-mono text-slate-800 font-semibold truncate">{address}</p>
                    </div>
                    <button
                      onClick={() => { disconnect(); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Disconnect Wallet
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            !isHomePage && (
              <ConnectButton variant="header">
                Connect
              </ConnectButton>
            )
          )}
        </div>
      </div>
    </header>
  );
}
