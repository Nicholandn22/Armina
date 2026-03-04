"use client";

import { useEffect, useState } from "react";
import { useChainId, useAccount } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { CONTRACTS } from "@/contracts/abis";

interface ErrorEntry {
  context: string;
  short: string;
  ts: string;
}

/**
 * Floating debug panel — always accessible via the 🔧 button in bottom-right corner.
 * Shows: chain, wallet, contract addresses, recent errors.
 */
export function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [copyDone, setCopyDone] = useState(false);
  const chainId = useChainId();
  const { address, isConnected, connector } = useAccount();

  // Listen for errors dispatched from anywhere in the app
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ErrorEntry>).detail;
      setErrors((prev) => [detail, ...prev].slice(0, 20));
      // Auto-open panel when an error arrives so it's not missed
      setOpen(true);
    };
    window.addEventListener("armina:error", handler);
    return () => window.removeEventListener("armina:error", handler);
  }, []);

  const isCorrectChain = chainId === baseSepolia.id;
  const errorCount = errors.length;

  const copyReport = () => {
    const lines = [
      "=== Armina Debug Report ===",
      `Time: ${new Date().toISOString()}`,
      `Chain ID: ${chainId} (expected: ${baseSepolia.id})`,
      `Chain OK: ${isCorrectChain}`,
      `Wallet: ${address ?? "not connected"}`,
      `Connector: ${connector?.name ?? "none"}`,
      "",
      "--- Contract Addresses ---",
      ...Object.entries(CONTRACTS).map(([k, v]) => `${k}: ${v ?? "NOT SET"}`),
      "",
      "--- ENV ---",
      `NEXT_PUBLIC_BASE_SEPOLIA_RPC: ${process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ?? "NOT SET (using default)"}`,
      `NEXT_PUBLIC_URL: ${process.env.NEXT_PUBLIC_URL ?? "NOT SET"}`,
      `NEXT_PUBLIC_CDP_PROJECT_ID: ${process.env.NEXT_PUBLIC_CDP_PROJECT_ID ? "SET" : "NOT SET"}`,
      "",
      "--- Recent Errors ---",
      ...(errors.length === 0
        ? ["No errors"]
        : errors.map((e) => `[${e.ts}] [${e.context}] ${e.short}`)),
    ];
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    });
  };

  return (
    <>
      {/* Floating toggle button — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-24 right-3 z-[9999] w-10 h-10 rounded-full bg-slate-800 border border-slate-600 text-white text-lg shadow-lg flex items-center justify-center hover:bg-slate-700 transition-colors"
        title="Debug Panel"
      >
        {errorCount > 0 && !open ? (
          <span className="relative flex">
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-bold">
              {errorCount}
            </span>
            🔧
          </span>
        ) : (
          "🔧"
        )}
      </button>

      {/* Debug Panel */}
      {open && (
        <div className="fixed bottom-36 right-3 z-[9999] w-80 max-h-[65vh] overflow-y-auto rounded-xl border border-slate-600 bg-slate-900 text-xs font-mono shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700 sticky top-0 bg-slate-900">
            <span className="text-slate-200 font-bold tracking-wide">🔧 Armina Debug</span>
            <div className="flex gap-2">
              <button
                onClick={copyReport}
                className="text-slate-400 hover:text-blue-400 transition-colors"
                title="Copy full report to clipboard"
              >
                {copyDone ? "✓ copied" : "copy"}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-3 space-y-3">
            {/* Chain */}
            <section>
              <p className="text-yellow-400 font-bold mb-1">Chain</p>
              <div className={`rounded px-2 py-1 ${isCorrectChain ? "bg-green-950 text-green-400" : "bg-red-950 text-red-400 font-bold"}`}>
                {isCorrectChain ? "✓" : "✗"} ID: {chainId}{" "}
                {isCorrectChain ? "(Base Sepolia — OK)" : "— WRONG CHAIN!"}
              </div>
            </section>

            {/* Wallet */}
            <section>
              <p className="text-yellow-400 font-bold mb-1">Wallet</p>
              <div className={`rounded px-2 py-1 ${isConnected ? "bg-green-950 text-green-400" : "bg-red-950 text-red-400"}`}>
                {isConnected ? "✓ Connected" : "✗ Not connected"}
              </div>
              {address && (
                <p className="text-slate-400 break-all mt-1">{address}</p>
              )}
              {connector && (
                <p className="text-slate-500 mt-0.5">via {connector.name}</p>
              )}
            </section>

            {/* Contract Addresses */}
            <section>
              <p className="text-yellow-400 font-bold mb-1">Contract Addresses</p>
              <div className="space-y-1 bg-slate-800 rounded p-2">
                {Object.entries(CONTRACTS).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 shrink-0">{key}</span>
                    {val ? (
                      <span className="text-green-400 truncate text-right" title={val}>
                        {val.slice(0, 8)}…{val.slice(-6)}
                      </span>
                    ) : (
                      <span className="text-red-400 font-bold">❌ NOT SET</span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* ENV */}
            <section>
              <p className="text-yellow-400 font-bold mb-1">ENV Variables</p>
              <div className="space-y-1 bg-slate-800 rounded p-2">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">RPC</span>
                  {process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ? (
                    <span className="text-green-400">✓ custom</span>
                  ) : (
                    <span className="text-orange-400">⚠ default (sepolia.base.org)</span>
                  )}
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">URL</span>
                  <span className="text-slate-300 truncate text-right max-w-[160px]" title={process.env.NEXT_PUBLIC_URL}>
                    {process.env.NEXT_PUBLIC_URL ?? <span className="text-red-400">❌ NOT SET</span>}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">CDP</span>
                  <span className={process.env.NEXT_PUBLIC_CDP_PROJECT_ID ? "text-green-400" : "text-red-400"}>
                    {process.env.NEXT_PUBLIC_CDP_PROJECT_ID ? "✓ set" : "❌ NOT SET"}
                  </span>
                </div>
              </div>
            </section>

            {/* Recent Errors */}
            <section>
              <div className="flex justify-between items-center mb-1">
                <p className="text-yellow-400 font-bold">
                  Recent Errors {errorCount > 0 && <span className="text-red-400">({errorCount})</span>}
                </p>
                {errorCount > 0 && (
                  <button
                    onClick={() => setErrors([])}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    clear
                  </button>
                )}
              </div>
              {errorCount === 0 ? (
                <p className="text-slate-600 italic">No errors yet — try the action that fails</p>
              ) : (
                <div className="space-y-2">
                  {errors.map((e, i) => (
                    <div key={i} className="bg-red-950/50 rounded p-2 border border-red-900/50">
                      <p className="text-red-400 font-bold">[{e.context}]</p>
                      <p className="text-red-300 break-all leading-relaxed">{e.short}</p>
                      <p className="text-slate-600 mt-0.5">{e.ts}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}
