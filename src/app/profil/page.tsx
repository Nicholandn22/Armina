"use client";

import { useState, useEffect } from "react";
import { useBalance, useChainId, useSwitchChain } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { useAuth } from "@/hooks/useAuth";
import { formatUnits } from "viem";
import { Button } from "@/components/ui/Button";
import { formatAddress, formatIDRX } from "@/lib/constants";
import { CONTRACTS } from "@/contracts/abis";
import { useOnboarding, useLanguage } from "@/components/providers";
import { ReputationLevel } from "@/types";
import { useIDRXBalance, useClaimFaucet } from "@/hooks/useIDRX";
import { useReputationData, useHasReputation, useCollateralDiscount } from "@/hooks/useReputation";
import { useParticipantInfo, useAllPools } from "@/hooks/usePoolData";
import toast from "react-hot-toast";
import Link from "next/link";
import { debugError } from "@/lib/debug";

const LEVEL_COLORS: Record<ReputationLevel, { border: string; text: string; bg: string; dot: string }> = {
  bronze:  { border: "border-amber-300",  text: "text-amber-700",  bg: "bg-amber-50",  dot: "bg-amber-500" },
  silver:  { border: "border-slate-300",  text: "text-slate-600",  bg: "bg-slate-100", dot: "bg-slate-400" },
  gold:    { border: "border-yellow-400", text: "text-yellow-700", bg: "bg-yellow-50", dot: "bg-yellow-500" },
  diamond: { border: "border-cyan-400",   text: "text-cyan-700",   bg: "bg-cyan-50",   dot: "bg-cyan-500"  },
};

const LEVEL_LABELS: Record<ReputationLevel, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  diamond: "Diamond",
};

const LEVEL_MAX_SCORE: Record<ReputationLevel, number> = {
  bronze: 200,
  silver: 500,
  gold: 1000,
  diamond: 2000,
};

export default function ProfilPage() {
  const { address } = useAuth();
  const { showOnboarding } = useOnboarding();
  const { t } = useLanguage();

  const { data: ethBalance } = useBalance({ address, chainId: baseSepolia.id });
  const { data: idrxBalanceRaw } = useIDRXBalance(address);
  const idrxBalance = idrxBalanceRaw as bigint | undefined;

  const { data: reputation } = useReputationData(address);
  const { data: hasNFT } = useHasReputation(address);
  const { data: discountRaw } = useCollateralDiscount(address);
  const discount = discountRaw as number | undefined;

  const chainId = useChainId();
  const { switchChain, switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const isWrongNetwork = !!address && chainId !== baseSepolia.id;

  const { claimFaucet, isPending: isClaimingFaucet, isSuccess: claimSuccess, error: claimError } = useClaimFaucet();

  useEffect(() => {
    if (claimSuccess) {
      toast.dismiss("profil-claim");
      toast.success("Claimed 500,000 IDRX!");
    }
  }, [claimSuccess]);

  useEffect(() => {
    if (claimError) {
      toast.dismiss("profil-claim");
      const msg = (claimError as any)?.shortMessage || (claimError as any)?.message || "Failed to claim IDRX";
      if (msg.toLowerCase().includes("does not match the target chain") || msg.toLowerCase().includes("chain mismatch")) return;
      debugError("ProfilPage:claimFaucet", claimError);
      toast.error(msg, { duration: 8000 });
    }
  }, [claimError]);

  const handleClaimFaucet = async () => {
    if (chainId !== baseSepolia.id) {
      try {
        await switchChainAsync({ chainId: baseSepolia.id });
      } catch {
        toast.error("Switch to Base Sepolia first");
        return;
      }
    }
    toast.loading("Claiming IDRX...", { id: "profil-claim" });
    claimFaucet();
  };

  const displayAddress = address || ("0x0000000000000000000000000000000000000000" as `0x${string}`);

  const reputationLevel: ReputationLevel = reputation?.level || "bronze";
  const reputationScore = reputation?.score || 0;
  const collateralDiscount = discount || 0;
  const levelColor = LEVEL_COLORS[reputationLevel];
  const levelMax = LEVEL_MAX_SCORE[reputationLevel];
  const scoreProgress = Math.min((reputationScore / levelMax) * 100, 100);

  const { activePools, completedPools } = useAllPools();
  const poolsActive = activePools.length;
  const poolsCompleted = completedPools.length;

  const initials = displayAddress.slice(2, 4).toUpperCase();

  const ethFormatted = ethBalance
    ? parseFloat(formatUnits(ethBalance.value, ethBalance.decimals)).toFixed(4)
    : "0.0000";

  return (
    <div className="min-h-screen bg-[#f8f9fc]">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#1e2a4a] via-[#243156] to-[#1a2540] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8">

            {/* Avatar + identity */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold tracking-tight">{initials}</span>
                </div>
                {hasNFT && (
                  <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-green-500 rounded-full border-2 border-[#1e2a4a] flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 text-xs font-semibold">{t.connectedBaseSepolia}</span>
                </div>
                <p className="text-white font-mono font-bold text-xl">{formatAddress(displayAddress)}</p>
                <p className="text-white/40 text-xs mt-0.5 font-mono">{displayAddress}</p>
              </div>
            </div>

            {/* Reputation card */}
            <div className="lg:ml-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className={`bg-white/8 border ${levelColor.border} border-opacity-50 rounded-2xl px-6 py-4 min-w-[220px]`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${levelColor.dot}`} />
                    <span className="text-white font-bold text-sm">{LEVEL_LABELS[reputationLevel]}</span>
                  </div>
                  <span className="text-white/50 text-xs">{reputationScore} pts</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${levelColor.dot} transition-all`}
                    style={{ width: `${scoreProgress}%` }}
                  />
                </div>
                <p className="text-white/30 text-xs mt-1.5">
                  {reputationScore} / {levelMax} {t.ptsToNextLevel}
                </p>
              </div>

              {collateralDiscount > 0 && (
                <div className="bg-green-500/15 border border-green-400/30 rounded-2xl px-5 py-4 text-center">
                  <p className="text-green-400/70 text-xs mb-0.5">{t.collateralDiscount}</p>
                  <p className="text-green-400 text-3xl font-bold">-{collateralDiscount}%</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick stat chips */}
          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { label: t.activePoolsChip, value: poolsActive },
              { label: t.completedPoolsChip, value: poolsCompleted },
              { label: t.onTimePaymentsChip, value: reputation?.onTimePayments ?? "—" },
              { label: t.latePaymentsChip, value: reputation?.latePayments ?? "—" },
            ].map((s) => (
              <div key={s.label} className="bg-white/6 border border-white/8 rounded-xl px-4 py-2.5 flex items-center gap-3">
                <span className="text-white/40 text-xs">{s.label}</span>
                <span className="text-white font-bold">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── LEFT COLUMN (3/5) ── */}
          <div className="lg:col-span-3 space-y-6">

            {/* STATS GRID */}
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-3">{t.statistics}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">{t.activePools}</p>
                  <p className="text-4xl font-bold text-[#1e2a4a]">{poolsActive}</p>
                  <div className="mt-3 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span className="text-xs text-slate-400">{t.currentlyRunning}</span>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">{t.completedPools2}</p>
                  <p className="text-4xl font-bold text-[#1e2a4a]">{poolsCompleted}</p>
                  <div className="mt-3 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                    <span className="text-xs text-slate-400">{t.allTime}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PAYMENT HISTORY */}
            {reputation ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-slate-900">{t.paymentHistory}</h2>
                  {reputation.onTimePayments + reputation.latePayments > 0 && (
                    <span className="text-xs text-slate-400">
                      {Math.round((reputation.onTimePayments / (reputation.onTimePayments + reputation.latePayments)) * 100)}% {t.onTimeRateLabel}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                    <p className="text-xs text-green-600 font-medium mb-1">{t.onTime}</p>
                    <p className="text-3xl font-bold text-green-700">{reputation.onTimePayments}</p>
                    <p className="text-xs text-green-500 mt-1">{t.payments}</p>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <p className="text-xs text-amber-600 font-medium mb-1">{t.late}</p>
                    <p className="text-3xl font-bold text-amber-700">{reputation.latePayments}</p>
                    <p className="text-xs text-amber-500 mt-1">{t.payments}</p>
                  </div>
                </div>

                {/* Visual bar */}
                {reputation.onTimePayments + reputation.latePayments > 0 && (
                  <div>
                    <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100">
                      <div
                        className="bg-green-500 h-full transition-all"
                        style={{
                          width: `${(reputation.onTimePayments / (reputation.onTimePayments + reputation.latePayments)) * 100}%`,
                        }}
                      />
                      <div className="bg-amber-400 h-full flex-1" />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                      <span>{t.onTimeBar}</span>
                      <span>{t.lateBar}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center">
                <p className="text-slate-400 text-sm">{t.noPaymentHistory}</p>
                <p className="text-slate-300 text-xs mt-1">{t.joinPoolToBuildRep}</p>
              </div>
            )}

            {/* REPUTATION DETAIL */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-slate-900">{t.reputationStatus}</h2>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${levelColor.bg} ${levelColor.text} ${levelColor.border}`}>
                  {LEVEL_LABELS[reputationLevel]}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(["bronze", "silver", "gold", "diamond"] as ReputationLevel[]).map((lvl) => {
                  const lc = LEVEL_COLORS[lvl];
                  const isActive = lvl === reputationLevel;
                  return (
                    <div
                      key={lvl}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isActive
                          ? `${lc.bg} ${lc.border} border-2`
                          : "bg-slate-50 border-slate-100"
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${lc.dot} ${!isActive ? "opacity-30" : ""}`} />
                      <p className={`text-xs font-semibold ${isActive ? lc.text : "text-slate-400"}`}>
                        {LEVEL_LABELS[lvl]}
                      </p>
                      <p className={`text-xs mt-0.5 ${isActive ? lc.text : "text-slate-300"}`}>
                        {LEVEL_MAX_SCORE[lvl]} pts
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-500">{t.scoreProgress}</span>
                  <span className="font-semibold text-[#1e2a4a]">{reputationScore} / {levelMax}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${levelColor.dot} transition-all`}
                    style={{ width: `${scoreProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN (2/5) ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* BALANCES */}
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-3">{t.balance}</h2>
              <div className="space-y-3">
                {/* ETH */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1e2a4a]/8 border border-[#1e2a4a]/15 flex items-center justify-center">
                      <span className="text-[#1e2a4a] font-bold text-sm">E</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">ETH</p>
                      <p className="text-xs text-slate-400">{t.gasFeeToken}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-900">{ethFormatted}</p>
                    <p className="text-xs text-slate-400">Base Sepolia</p>
                  </div>
                </div>

                {/* IDRX */}
                <div className="bg-gradient-to-br from-[#1e2a4a] to-[#2a3a5c] rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">I</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">IDRX</p>
                      <p className="text-xs text-white/40">{t.arisanToken}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      {idrxBalance !== undefined ? formatIDRX(idrxBalance) : "—"}
                    </p>
                    <p className="text-xs text-white/40">IDRX</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAUCET */}
            <div id="faucet" className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900 text-sm">{t.idrxFaucet}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{t.faucetCooldown}</p>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-500">{t.amountPerClaim}</span>
                  <span className="text-sm font-bold text-[#1e2a4a]">{t.faucetClaimAmount}</span>
                </div>

                {isWrongNetwork ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                      {t.wrongNetworkMsg}
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => switchChain({ chainId: baseSepolia.id })}
                      isLoading={isSwitchingChain}
                    >
                      {t.switchToBaseSepolia}
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={handleClaimFaucet}
                    isLoading={isClaimingFaucet}
                  >
                    {t.claimIdrxAmount}
                  </Button>
                )}
              </div>
            </div>

            {/* QUICK LINKS */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900 text-sm">{t.links}</h2>
              </div>
              <div className="divide-y divide-slate-50">
                <button
                  onClick={showOnboarding}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
                >
                  <span className="text-sm text-slate-700">{t.howToPlay}</span>
                  <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <a
                  href={`https://sepolia.basescan.org/address/${displayAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm text-slate-700">{t.viewOnBaseScan}</span>
                  <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>

                {CONTRACTS.IDRX && (
                  <a
                    href={`https://sepolia.basescan.org/address/${CONTRACTS.IDRX}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm text-slate-700">{t.idrxContract}</span>
                    <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>

            {/* APP INFO */}
            <div className="bg-[#1e2a4a] rounded-2xl p-5 text-center">
              <img
                src="/logo.png"
                alt="Armina"
                className="w-14 h-14 mx-auto mb-3 object-contain rounded-xl"
              />
              <p className="text-white font-bold text-sm">{t.arminaProtocol}</p>
              <p className="text-white/30 text-xs mt-0.5">{t.version}</p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <div className="flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-lg px-3 py-1.5">
                  <div className="w-4 h-4 rounded-full bg-[#0052FF] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <span className="text-white/70 text-xs font-medium">Base</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-lg px-3 py-1.5">
                  <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-[9px] font-bold">X</span>
                  </div>
                  <span className="text-white/70 text-xs font-medium">IDRX</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
