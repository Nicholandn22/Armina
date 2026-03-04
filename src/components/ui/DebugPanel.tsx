"use client";

import { useEffect } from "react";
import { useChainId, useAccount } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { CONTRACTS } from "@/contracts/abis";

/**
 * Debug logger — outputs to browser console (F12) only, no UI on screen.
 * Listen for "armina:error" events to log errors.
 */
export function DebugPanel() {
  const chainId = useChainId();
  const { address, isConnected, connector } = useAccount();

  useEffect(() => {
    const isCorrectChain = chainId === baseSepolia.id;

    console.group("%c🔧 Armina Debug", "color: #60a5fa; font-weight: bold");
    console.log("Chain ID :", chainId, isCorrectChain ? "✓ OK" : "✗ WRONG CHAIN");
    console.log("Wallet   :", isConnected ? address : "not connected");
    console.log("Connector:", connector?.name ?? "none");
    console.group("Contracts");
    Object.entries(CONTRACTS).forEach(([k, v]) =>
      console.log(k.padEnd(20), v ?? "❌ NOT SET")
    );
    console.groupEnd();
    console.group("ENV");
    console.log("RPC :", process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ?? "default (sepolia.base.org)");
    console.log("URL :", process.env.NEXT_PUBLIC_URL ?? "❌ NOT SET");
    console.log("CDP :", process.env.NEXT_PUBLIC_CDP_PROJECT_ID ? "✓ set" : "❌ NOT SET");
    console.groupEnd();
    console.groupEnd();
  }, [chainId, address, isConnected, connector]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { context, short, ts } = (e as CustomEvent).detail;
      console.error(`[Armina Error] [${context}] ${short} (${ts})`);
    };
    window.addEventListener("armina:error", handler);
    return () => window.removeEventListener("armina:error", handler);
  }, []);

  return null;
}
