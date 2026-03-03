"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { useChainId, useSwitchChain } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { formatUnits } from "viem";
import { useClaimFaucet, useIDRXBalance, useIDRXDecimals } from "@/hooks/useIDRX";
import { useLanguage } from "@/components/providers";

export default function FaucetPage() {
  const router = useRouter();
  const { address, isConnected } = useAuth();
  const { claimFaucet, isPending, isConfirming, isSuccess, error } = useClaimFaucet();
  const { data: balance, refetch } = useIDRXBalance(address);
  const { data: idrxDecimals } = useIDRXDecimals();
  const [lastClaimed, setLastClaimed] = useState<Date | null>(null);
  const [claimCount, setClaimCount] = useState(0);
  const { t } = useLanguage();
  const chainId = useChainId();
  const { switchChain, switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const isWrongNetwork = isConnected && chainId !== baseSepolia.id;

  useEffect(() => {
    if (isSuccess) {
      toast.dismiss("claim");
      toast.success(t.claimSuccess);
      refetch();
      setLastClaimed(new Date());
      setClaimCount((prev) => prev + 1);
    }
  }, [isSuccess, refetch, t.claimSuccess]);

  useEffect(() => {
    if (error) {
      toast.dismiss("claim");
      const msg = (error as any)?.shortMessage || (error as any)?.message || "Failed to claim IDRX";
      // Skip chain mismatch errors — UI already shows the Switch Network banner
      if (msg.toLowerCase().includes("chain") || msg.toLowerCase().includes("network")) return;
      toast.error(msg);
    }
  }, [error]);

  const handleClaim = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (chainId !== baseSepolia.id) {
      try {
        await switchChainAsync({ chainId: baseSepolia.id });
      } catch {
        toast.error("Switch to Base Sepolia first");
        return;
      }
    }
    toast.loading("Claiming 500K IDRX...", { id: "claim" });
    claimFaucet();
  };

  const formatBalance = (bal: bigint | undefined) => {
    if (!bal) return "0";
    const decimals = Number(idrxDecimals ?? 18);
    const idrxFloat = parseFloat(formatUnits(bal, decimals));
    return new Intl.NumberFormat("id-ID").format(Math.floor(idrxFloat));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] px-5 py-8 text-white">
        <button
          onClick={() => router.back()}
          className="mb-4 text-white/80 hover:text-white flex items-center gap-2"
        >
          ← {t.back}
        </button>
        <h1 className="text-3xl font-bold mb-2">{t.faucetTitle}</h1>
        <p className="text-white/70 text-sm">
          {t.faucetDesc}
        </p>
      </div>

      <div className="px-5 py-6 max-w-2xl mx-auto">
        {/* Balance Card */}
        <div className="mb-6 p-6 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] rounded-2xl text-white">
          <p className="text-white/70 text-sm mb-2">{t.yourBalance}</p>
          <p className="text-4xl font-bold">
            {isConnected ? formatBalance(balance) : "0"} IDRX
          </p>
          {address && (
            <p className="text-xs text-white/60 mt-2">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          )}
        </div>

        {/* Faucet Info */}
        <div className="mb-6 p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl">
          <h3 className="font-semibold text-[#1e2a4a] mb-3">{t.faucetDetails}</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">{t.amountPerClaim}</span>
              <span className="font-semibold text-[#1e2a4a]">{t.faucetClaimAmount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">{t.network}</span>
              <span className="font-semibold text-[#1e2a4a]">
                Base Sepolia Testnet
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">{t.rateLimit}</span>
              <span className="font-semibold text-green-600">
                Unlimited (Testnet)
              </span>
            </div>
          </div>
        </div>

        {/* Last Claimed */}
        {lastClaimed && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-sm text-green-800">
              ✓ Claimed {claimCount}x (total {(claimCount * 500000).toLocaleString("id-ID")} IDRX) — Last: {lastClaimed.toLocaleTimeString()}
            </p>
          </div>
        )}

        {/* Wrong Network Warning */}
        {isWrongNetwork && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-red-800">{t.wrongNetwork}</p>
              <p className="text-xs text-red-600">{t.wrongNetworkMsg}</p>
            </div>
            <button
              onClick={() => switchChain({ chainId: baseSepolia.id })}
              disabled={isSwitching}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
            >
              {isSwitching ? t.switching : t.switchToBaseSepolia}
            </button>
          </div>
        )}

        {/* Claim Button */}
        <button
          onClick={handleClaim}
          disabled={!isConnected || isSwitching || isPending || isConfirming}
          className="w-full py-4 px-6 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] text-white rounded-xl font-bold hover:from-[#2a3a5c] hover:to-[#1e2a4a] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mb-2"
        >
          {!isConnected
            ? t.connectToClaim
            : isSwitching
            ? t.switching
            : isPending
            ? t.claiming
            : isConfirming
            ? t.confirming
            : t.claimIdrx}
        </button>
        <p className="text-xs text-center text-slate-500 mb-4">No limit, no cooldown — click multiple times to get more!</p>

        {/* Info Cards */}
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">
              {t.whatIsIdrx}
            </h4>
            <p className="text-xs text-blue-800">
              {t.whatIsIdrxDesc}
            </p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <h4 className="font-semibold text-amber-900 mb-2 text-sm">
              {t.howToUseIdrx}
            </h4>
            <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
              <li>{t.howToUseIdrx1}</li>
              <li>{t.howToUseIdrx2}</li>
              <li>{t.howToUseIdrx3}</li>
              <li>{t.howToUseIdrx4}</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="font-semibold text-slate-900 mb-2 text-sm">
              {t.needMoreTokens}
            </h4>
            <p className="text-xs text-slate-700 mb-2">
              {t.needMoreTokensDesc}
            </p>
            <p className="text-xs text-slate-600">
              {t.forCreatingPools}
            </p>
            <ul className="text-xs text-slate-600 mt-1 space-y-1">
              <li>• 5-member pool: ~3,000K IDRX</li>
              <li>• 10-member pool: ~5,500K IDRX</li>
              <li>• 15-member pool: ~8,000K IDRX</li>
              <li>• 20-member pool: ~10,500K IDRX</li>
            </ul>
          </div>
        </div>

        {/* Quick Actions */}
        {isConnected && balance && Number(balance) > 0 && (
          <div className="mt-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl">
            <h3 className="font-semibold text-green-900 mb-3">
              {t.readyToStart}
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/pools/create")}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold"
              >
                {t.createPool}
              </button>
              <button
                onClick={() => router.push("/pool")}
                className="flex-1 py-3 bg-white hover:bg-slate-50 text-green-600 border-2 border-green-600 rounded-xl font-semibold"
              >
                {t.browsePools}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
