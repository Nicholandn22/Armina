"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePoolDetails, useParticipantInfo } from "@/hooks/usePoolData";
import { useArminaPool } from "@/hooks/useArminaPool";
import { useApproveIDRX } from "@/hooks/useIDRX";
import { useCollateralDiscount } from "@/hooks/useReputation";
import { useYieldData } from "@/hooks/useYieldData";
import { ARMINA_POOL_ADDRESS } from "@/contracts/config";
import { formatIDRX, calculateCollateral, formatAddress } from "@/lib/constants";
import { waitForTransactionReceipt } from "@wagmi/core";
import { config } from "@/lib/wagmi";
import toast from "react-hot-toast";
import { useLanguage } from "@/components/providers";

export default function PoolDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const poolId = BigInt(id);
  const router = useRouter();
  const { address, isConnected } = useAuth();
  const { t } = useLanguage();

  // Real contract data
  const { data: pool, raw: rawPool, isLoading: isPoolLoading } = usePoolDetails(poolId);
  const { data: participant } = useParticipantInfo(poolId, address);
  const { joinPool, requestWinnerDraw, isPending: isActionPending, isConfirming: isActionConfirming, isSuccess: actionSuccess } = useArminaPool();
  const { approve, isPending: isApproving } = useApproveIDRX();

  // Reputation discount
  const { data: collateralDiscountRaw } = useCollateralDiscount(address);
  const collateralDiscount = Number(collateralDiscountRaw || 0);

  // Live yield data from DeFiLlama
  const { recommendation, protocols: yieldProtocols } = useYieldData();
  const liveAPY = recommendation?.apy || (yieldProtocols.length > 0 ? yieldProtocols[0].apy : 0);
  const displayAPY = liveAPY > 0 ? liveAPY : 12.5; // Fallback to 12.5%

  const isJoining = isActionPending || isActionConfirming || isApproving;

  useEffect(() => {
    if (actionSuccess) {
      toast.success(t.transactionSuccessful, { id: "pool-action" });
    }
  }, [actionSuccess, t]);


  if (isPoolLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#1e2a4a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">{t.loadingPoolData}</p>
        </div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1e2a4a] mb-4">{t.poolNotFound}</h1>
          <p className="text-slate-600 mb-6">Pool #{id} {t.poolDoesNotExist}</p>
          <button
            onClick={() => router.push("/pool")}
            className="py-3 px-6 bg-[#1e2a4a] text-white rounded-xl font-bold"
          >
            {t.browsePools}
          </button>
        </div>
      </div>
    );
  }

  const baseCollateral = calculateCollateral(pool.contribution, pool.maxParticipants);
  const discountedCollateral = collateralDiscount > 0
    ? baseCollateral - (baseCollateral * BigInt(collateralDiscount) / BigInt(100))
    : baseCollateral;
  const collateral = discountedCollateral;
  const totalDueAtJoin = collateral + pool.contribution;
  const spotsRemaining = pool.maxParticipants - pool.currentParticipants;
  const progressPercentage = (pool.currentParticipants / pool.maxParticipants) * 100;
  const isOpen = !pool.isActive && !pool.isCompleted && spotsRemaining > 0;
  const monthlyPot = pool.contribution * BigInt(pool.maxParticipants);

  // Live APY calculations
  const apy = displayAPY;
  const collateralYield = (Number(collateral) * apy * pool.maxParticipants) / (100 * 12);
  const potYield = (Number(monthlyPot) * apy * pool.maxParticipants) / (100 * 12);

  const handleJoin = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    try {
      toast.loading(t.approvingIdrx, { id: "pool-action" });
      const hash = await approve(ARMINA_POOL_ADDRESS, totalDueAtJoin);
      if (!hash) throw new Error("Approval failed");

      await waitForTransactionReceipt(config, { hash });

      toast.loading(t.joiningPool, { id: "pool-action" });
      await joinPool(poolId);
      toast.success(t.transactionSuccessful, { id: "pool-action" });
    } catch (error: any) {
      console.error("Error joining pool:", error);
      const msg = error?.shortMessage || error?.message || "Failed to join pool";
      toast.error(msg, { id: "pool-action" });
    }
  };

  const handleDrawWinner = async () => {
    try {
      toast.loading("Requesting VRF randomness...", { id: "pool-action" });
      await requestWinnerDraw(poolId);
      toast.success("Winner draw requested! Chainlink VRF will select winner shortly.", { id: "pool-action" });
    } catch (error) {
      console.error("Error requesting winner draw:", error);
      toast.error("Failed to request winner draw", { id: "pool-action" });
    }
  };

  const statusLabel = pool.isCompleted
    ? t.completedStatus
    : pool.isActive
    ? t.activeStatus
    : isOpen
    ? t.openForJoining
    : t.fullStatus;

  const statusColor = pool.isCompleted
    ? "bg-slate-200 text-slate-600"
    : pool.isActive
    ? "bg-green-100 text-green-700"
    : isOpen
    ? "bg-blue-100 text-blue-700"
    : "bg-amber-100 text-amber-700";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] px-5 py-8 text-white">
        <button
          onClick={() => router.back()}
          className="mb-4 text-white/80 hover:text-white flex items-center gap-2"
        >
          {t.backToPools}
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Pool #{id}</h1>
            <p className="text-white/70 text-sm">
              {formatIDRX(pool.contribution)} {t.perMonthLabel} &middot; {pool.maxParticipants} {t.participants}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{apy.toFixed(1)}%</div>
            <div className="text-xs text-white/70 flex items-center gap-1 justify-end">
              {liveAPY > 0 && (
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" />
              )}
              {liveAPY > 0 ? t.liveApy : t.estApy}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 max-w-2xl mx-auto">
        {/* Pool Status Banner */}
        <div className="mb-6 p-5 bg-white border-2 border-[#1e2a4a]/20 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[#1e2a4a]">{t.poolStatus}</h2>
            <span className={`px-3 py-1 ${statusColor} rounded-full text-xs font-semibold`}>
              {statusLabel}
            </span>
          </div>

          <div className="mb-3">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">
                {pool.currentParticipants} / {pool.maxParticipants} {t.participants}
              </span>
              <span className="text-[#1e2a4a] font-semibold">
                {spotsRemaining > 0 ? `${spotsRemaining} ${t.spotsLeft}` : t.poolFull}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {pool.isActive && (
            <p className="text-xs text-green-600 font-medium">
              {t.roundOf} {pool.currentRound} {t.ofRound} {pool.totalRounds}
            </p>
          )}

          {isOpen && (
            <p className="text-xs text-slate-500">
              {t.spotsFillDesc} {pool.maxParticipants} {t.spotsFillDesc2}
            </p>
          )}
        </div>

        {/* VRF Winner Draw Section - for active pools */}
        {pool.isActive && (
          <div className="mb-6 p-5 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-purple-900">{t.chainlinkVrfDraw}</h3>
                <p className="text-xs text-purple-700 mt-1">
                  {t.roundOf} {pool.currentRound} {t.ofRound} {pool.totalRounds} &middot; {t.provablyFair}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-lg">🎲</span>
              </div>
            </div>

            <button
              onClick={handleDrawWinner}
              disabled={isActionPending || isActionConfirming}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isActionPending || isActionConfirming
                ? t.requestingVrf
                : `${t.drawWinnerForRound} ${pool.currentRound}`}
            </button>

            <p className="text-xs text-purple-600 mt-2 text-center">{t.onlyCreatorCanDraw}</p>
          </div>
        )}

        {/* Payment Breakdown Card */}
        {isOpen && (
          <div className="mb-6 p-6 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] rounded-2xl text-white">
            <h2 className="font-bold text-lg mb-4">{t.requiredPaymentToJoin}</h2>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white/70 text-sm">{t.securityCollateral125}</p>
                  <p className="text-xs text-white/60">
                    = 125% x ({pool.maxParticipants} x {formatIDRX(pool.contribution)})
                  </p>
                </div>
                <div className="text-right">
                  {collateralDiscount > 0 ? (
                    <>
                      <p className="text-sm line-through text-white/40">{formatIDRX(baseCollateral)}</p>
                      <p className="text-xl font-bold text-green-400">{formatIDRX(collateral)}</p>
                    </>
                  ) : (
                    <p className="text-xl font-bold">{formatIDRX(baseCollateral)}</p>
                  )}
                </div>
              </div>

              {/* Reputation Discount Badge */}
              {collateralDiscount > 0 && (
                <div className="p-3 bg-green-400/20 border border-green-400/30 rounded-xl">
                  <p className="text-xs text-green-300 font-semibold">
                    {t.reputationDiscountLabel} -{collateralDiscount}% {t.collateralReduction}
                  </p>
                  <p className="text-xs text-green-200/80 mt-1">
                    {t.savedThanksReputation} {formatIDRX(baseCollateral - collateral)} {t.savedIdrxThanksReputation}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <p className="text-white/70 text-sm">{t.firstMonthPaymentLabel}</p>
                <p className="text-xl font-bold">+{formatIDRX(pool.contribution)}</p>
              </div>

              <div className="pt-3 border-t border-white/30 flex justify-between items-center">
                <p className="font-bold">{t.totalDueNow}</p>
                <p className="text-3xl font-bold">{formatIDRX(totalDueAtJoin)}</p>
              </div>
            </div>

            <div className="p-4 bg-white/10 rounded-xl border border-white/20">
              <p className="text-xs text-white/90">
                <strong>{t.collateralReturnedFull}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Projected Earnings */}
        <div className="mb-6 p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#1e2a4a]">{t.projectedEarnings}</h3>
            {liveAPY > 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                {t.liveRates}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">{t.yourCollateralYield}</p>
              <p className="text-2xl font-bold text-green-600">
                +{Math.round(collateralYield).toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-slate-400">{t.idrxOver} {pool.maxParticipants} {t.monthsSuffix}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">{t.ifYouWin}</p>
              <p className="text-2xl font-bold text-[#1e2a4a]">
                +{formatIDRX(monthlyPot)}
              </p>
              <p className="text-xs text-slate-400">{t.idrxPotPlusYield}</p>
            </div>
          </div>

          {/* Yield Source Info */}
          {recommendation && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>{t.aiOptimizerLabel}</strong> {t.bestYieldVia} {recommendation.protocol} {t.atLabel} {recommendation.apy.toFixed(1)}% APY
              </p>
            </div>
          )}
        </div>

        {/* Pool Details */}
        <div className="mb-6 p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl">
          <h3 className="font-bold text-[#1e2a4a] mb-4">{t.poolDetails}</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">{t.poolSizeLabel}</span>
              <span className="font-semibold text-[#1e2a4a]">{pool.maxParticipants} {t.participants}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">{t.durationLabel}</span>
              <span className="font-semibold text-[#1e2a4a]">{pool.maxParticipants} {t.months}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">{t.monthlyPotLabel}</span>
              <span className="font-semibold text-[#1e2a4a]">
                {formatIDRX(monthlyPot)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">{t.apyRateLabel}</span>
              <span className="font-semibold text-green-600 flex items-center gap-1">
                {apy.toFixed(1)}%
                {liveAPY > 0 && (
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">{t.winnerSelectionLabel}</span>
              <span className="font-semibold text-purple-600">Chainlink VRF</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">{t.contractLabel}</span>
              <a
                href={`https://sepolia.basescan.org/address/${ARMINA_POOL_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-blue-600 hover:underline"
              >
                {formatAddress(ARMINA_POOL_ADDRESS)}
              </a>
            </div>
          </div>
        </div>

        {/* Your Participation Status (if participating) */}
        {participant && (
          <div className="mb-6 p-5 bg-green-50 border border-green-200 rounded-2xl">
            <h3 className="font-bold text-green-800 mb-4">{t.yourParticipation}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">{t.collateralLocked}</span>
                <span className="font-semibold text-green-900">{formatIDRX(participant.collateralDeposited)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">{t.yieldEarned2}</span>
                <span className="font-semibold text-green-600">+{formatIDRX(participant.collateralYieldEarned)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">{t.missedPaymentsLabel}</span>
                <span className={`font-semibold ${participant.missedPayments > 0 ? "text-red-600" : "text-green-600"}`}>
                  {participant.missedPayments}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">{t.wonLabel2}</span>
                <span className="font-semibold">{participant.hasWon ? t.yesLabel : t.notYet}</span>
              </div>
              {participant.potReceived > BigInt(0) && (
                <div className="flex justify-between">
                  <span className="text-green-700">{t.potReceivedLabel}</span>
                  <span className="font-bold text-green-900">{formatIDRX(participant.potReceived)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Participants list */}
        <div className="mb-6 p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl">
          <h3 className="font-bold text-[#1e2a4a] mb-4">
            {t.participants} ({pool.currentParticipants}/{pool.maxParticipants})
          </h3>

          <div className="space-y-2">
            {/* Filled slots */}
            {Array.from({ length: pool.currentParticipants }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#1e2a4a] to-[#2a3a5c] rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <p className="text-sm text-slate-600">{t.participantSlot}{index + 1}</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                  {t.joinedBadge}
                </span>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: spotsRemaining }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg border-2 border-dashed border-slate-200"
              >
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 font-bold text-sm">
                  {pool.currentParticipants + index + 1}
                </div>
                <p className="text-sm text-slate-400">{t.waitingForParticipant}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How Monthly Payments Work */}
        <div className="mb-6 p-5 bg-slate-50 rounded-2xl">
          <h3 className="font-bold text-[#1e2a4a] mb-3">{t.howMonthlyPaymentsWork}</h3>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex gap-3">
              <span className="text-[#1e2a4a] font-bold">1.</span>
              <p>
                <strong>{t.automaticDeductionLabel}</strong> {formatIDRX(pool.contribution)} {t.automaticDeductionDesc}
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[#1e2a4a] font-bold">2.</span>
              <p>
                <strong>{t.ifWalletInsufficientLabel}</strong> {t.ifWalletInsufficientDesc}
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[#1e2a4a] font-bold">3.</span>
              <p>
                <strong>{t.keepWalletFundedLabel}</strong> {t.maintainAtLeast} {formatIDRX(pool.contribution)} {t.toAvoidPenalties}
              </p>
            </div>
          </div>
        </div>

        {/* Join Button - only show if pool is open and user hasn't joined */}
        {isOpen && !participant && (
          <>
            <button
              onClick={handleJoin}
              disabled={!isConnected || isJoining}
              className="w-full py-4 px-6 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] text-white rounded-xl font-bold hover:from-[#2a3a5c] hover:to-[#1e2a4a] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mb-4"
            >
              {!isConnected
                ? t.connectWalletToJoin2
                : isApproving
                ? t.approvingIdrx
                : isActionPending
                ? t.joiningPool
                : isActionConfirming
                ? t.confirming
                : `${t.joinPoolWithAmount} (${formatIDRX(totalDueAtJoin)})`}
            </button>

            <p className="text-xs text-center text-slate-500 mb-6">
              {t.byJoiningPool}{" "}
              <a href="#" className="text-[#1e2a4a] hover:underline">
                {t.termsOfService}
              </a>
              . {t.ensureYouHave} {formatIDRX(totalDueAtJoin)} {t.inYourWallet}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
