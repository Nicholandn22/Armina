"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Pool } from "@/types";
import { POOL_TIERS, calculateCollateral, formatIDRX } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { ListSkeleton } from "@/components/ui/LoadingSkeleton";
import { useLanguage } from "@/components/providers";
import { useAllPools, useParticipantInfo } from "@/hooks/usePoolData";
import { useArminaPool, useCollateralMultiplier } from "@/hooks/useArminaPool";
import { useApproveIDRX, useIDRXBalance } from "@/hooks/useIDRX";
import { ARMINA_POOL_ADDRESS } from "@/contracts/config";
import { ARMINA_POOL_ABI } from "@/contracts/abis";
import { waitForTransactionReceipt, readContract, simulateContract } from "wagmi/actions";
import { useConfig, useReadContracts } from "wagmi";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { debugError } from "@/lib/debug";

type TabType = "open" | "active" | "completed";

export default function PoolPage() {
  const { address, isConnected } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const wagmiConfig = useConfig();
  const [activeTab, setActiveTab] = useState<TabType>("open");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [isJoiningPool, setIsJoiningPool] = useState(false);

  // Real contract data
  const { openPools, activePools, completedPools, isLoading: isLoadingPools, refetch } = useAllPools();
  const { joinPool } = useArminaPool();
  const { approve } = useApproveIDRX();
  const { data: userBalance } = useIDRXBalance(address);
  const { multiplier: collateralMultiplier } = useCollateralMultiplier();

  // Batch check: apakah user sudah join di setiap open pool (satu multicall)
  const participationContracts = useMemo(
    () =>
      address && openPools.length > 0
        ? openPools.map((pool) => ({
            address: ARMINA_POOL_ADDRESS as `0x${string}`,
            abi: ARMINA_POOL_ABI as any,
            functionName: "getParticipantDetails" as const,
            args: [pool.id, address],
          }))
        : [],
    [openPools, address]
  );
  const { data: participationData } = useReadContracts({
    contracts: participationContracts.length > 0 ? participationContracts : undefined,
    query: { enabled: !!address && openPools.length > 0 },
  });
  // Set berisi pool ID (string) yang sudah diikuti user
  const joinedPoolIds = useMemo(() => {
    const set = new Set<string>();
    if (!participationData || !address) return set;
    openPools.forEach((pool, i) => {
      const result = participationData[i];
      if (result?.status === "success" && result.result) {
        const collateral = (result.result as any)[0] as bigint;
        if (collateral > 0n) set.add(pool.id.toString());
      }
    });
    return set;
  }, [participationData, openPools, address]);

  const isLoading = isJoiningPool;


  const tabs: { id: TabType; label: string }[] = [
    { id: "open", label: t.openPools },
    { id: "active", label: t.activePools2 },
    { id: "completed", label: t.completedPools },
  ];

  const handleJoinPool = (pool: Pool) => {
    setSelectedPool(pool);
    setShowJoinModal(true);
  };

  const confirmJoinPool = async () => {
    if (!selectedPool) return;
    setIsJoiningPool(true);
    const poolId = selectedPool.id;
    try {
      // Early check: cegah approve yang sia-sia jika user sudah bergabung
      if (address && joinedPoolIds.has(poolId.toString())) {
        toast.dismiss("join");
        setShowJoinModal(false);
        setSelectedPool(null);
        toast.success("Kamu sudah ada di pool ini!", { duration: 4000 });
        router.push(`/pools/${poolId.toString()}`);
        return;
      }

      // Hitung collateral dengan multiplier dari contract (2 desimal IDRX)
      const multiplier = BigInt(collateralMultiplier);
      const collateral =
        (selectedPool.contribution * BigInt(selectedPool.maxParticipants) * multiplier) / BigInt(100);
      // Amount yang BENAR-BENAR dibutuhkan contract (tanpa buffer)
      const totalRequired = collateral + selectedPool.contribution;
      // Amount yang di-approve (dengan buffer 1% agar tidak kurang karena rounding)
      const collateralWithBuffer = (collateral * BigInt(101)) / BigInt(100);
      const totalDue = collateralWithBuffer + selectedPool.contribution;

      console.log(`[JoinPool] Pool ID: ${poolId.toString()}`);
      console.log(`[JoinPool] Contribution: ${selectedPool.contribution.toString()} raw = ${Number(selectedPool.contribution) / 100} IDRX`);
      console.log(`[JoinPool] Multiplier: ${collateralMultiplier}%`);
      console.log(`[JoinPool] Total dibutuhkan contract: ${totalRequired.toString()} raw = ${Number(totalRequired) / 100} IDRX`);
      console.log(`[JoinPool] Approve amount (+ 1% buffer): ${totalDue.toString()} raw`);
      console.log(`[JoinPool] User balance: ${userBalance?.toString()} raw = ${userBalance ? Number(userBalance) / 100 : '?'} IDRX`);

      // Preflight check: beri error jelas sebelum kirim tx ke wallet
      if (userBalance !== undefined && userBalance < totalRequired) {
        const shortfall = totalRequired - userBalance;
        throw new Error(
          `Saldo IDRX tidak cukup. Dibutuhkan: ${Number(totalRequired) / 100} IDRX, ` +
          `saldo kamu: ${Number(userBalance) / 100} IDRX. ` +
          `Kurang: ${Number(shortfall) / 100} IDRX. Klaim di faucet dulu.`
        );
      }

      // Baca alamat IDRX token yang digunakan pool (immutable, bisa berbeda dari env config)
      const poolIdrxToken = await readContract(wagmiConfig, {
        address: ARMINA_POOL_ADDRESS,
        abi: ARMINA_POOL_ABI as any,
        functionName: "idrxToken",
      }) as `0x${string}`;
      console.log(`[JoinPool] Pool idrxToken on-chain: ${poolIdrxToken}`);

      // Step 1: Approve IDRX ke ArminaPool.
      // Approve langsung ke poolIdrxToken (bukan env IDRX_ADDRESS) untuk memastikan
      // address-nya sama persis dengan yang digunakan contract saat safeTransferFrom.
      const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
      toast.loading("(1/3) Approve IDRX di wallet kamu...", { id: "join" });
      const approveHash = await approve(ARMINA_POOL_ADDRESS, MAX_UINT256, poolIdrxToken);
      if (!approveHash) throw new Error("Approval dibatalkan atau gagal");

      // Step 2: Tunggu konfirmasi approval on-chain + verifikasi allowance
      toast.loading("(2/3) Menunggu konfirmasi approval...", { id: "join" });
      await waitForTransactionReceipt(wagmiConfig, { hash: approveHash, confirmations: 2 });

      // RACE CONDITION FIX: Setelah receipt, tunggu 2 detik agar state
      // fully committed di semua nodes sebelum submit joinPool.
      toast.loading("(2.5/3) Memverifikasi approval on-chain...", { id: "join" });
      await new Promise(r => setTimeout(r, 2000));

      // Verifikasi allowance pada kontrak IDRX yang sama dengan yang digunakan pool
      const { IDRX_ABI } = await import("@/contracts/abis");
      let currentAllowance = await readContract(wagmiConfig, {
        address: poolIdrxToken,
        abi: IDRX_ABI,
        functionName: "allowance",
        args: [address as `0x${string}`, ARMINA_POOL_ADDRESS],
      }) as bigint;

      console.log("[JoinPool] Allowance after approve:", currentAllowance.toString());

      // Jika allowance belum terlihat, retry setelah 3 detik lagi
      if (currentAllowance === 0n) {
        console.warn("[JoinPool] Allowance masih 0, tunggu 3 detik lagi...");
        toast.loading("(2.5/3) Menunggu propagasi blockchain...", { id: "join" });
        await new Promise(r => setTimeout(r, 3000));
        currentAllowance = await readContract(wagmiConfig, {
          address: poolIdrxToken,
          abi: IDRX_ABI,
          functionName: "allowance",
          args: [address as `0x${string}`, ARMINA_POOL_ADDRESS],
        }) as bigint;
        console.log("[JoinPool] Allowance setelah retry:", currentAllowance.toString());
      }

      if (currentAllowance === 0n) {
        throw new Error("Approve gagal atau belum on-chain. Coba refresh dan join ulang.");
      }

      // Step 3: Pre-flight simulate untuk deteksi revert sebelum kirim tx
      // Ini menangkap error seperti PoolNotOpen, AlreadyJoined, atau broken priceFeed/reputationContract
      toast.loading("(3/3) Memverifikasi pool...", { id: "join" });
      try {
        await simulateContract(wagmiConfig, {
          address: ARMINA_POOL_ADDRESS,
          abi: ARMINA_POOL_ABI as any,
          functionName: "joinPool",
          args: [poolId],
          account: address as `0x${string}`,
        });
      } catch (simErr: any) {
        const errorName =
          simErr?.cause?.data?.errorName ||
          simErr?.data?.errorName ||
          simErr?.cause?.reason ||
          simErr?.shortMessage ||
          simErr?.message ||
          "";
        console.error("[JoinPool] Simulate failed:", simErr);
        if (errorName.includes("AlreadyJoined")) {
          // Jangan throw — langsung redirect ke detail pool
          toast.dismiss("join");
          setShowJoinModal(false);
          setSelectedPool(null);
          toast.success("Kamu sudah ada di pool ini!", { duration: 4000 });
          router.push(`/pools/${poolId.toString()}`);
          return;
        } else if (errorName.includes("PoolNotOpen")) {
          throw new Error("Pool sudah tidak Open. Refresh halaman dan pilih pool lain.");
        } else if (errorName.includes("AlreadyClaimed")) {
          throw new Error("Kamu sudah klaim dari pool ini.");
        } else if (
          errorName.includes("InsufficientAllowance") ||
          simErr?.message?.includes("0xfb8f41b2") ||
          simErr?.cause?.message?.includes("0xfb8f41b2")
        ) {
          throw new Error(
            "Allowance IDRX tidak cukup di contract pool. " +
            "Coba refresh halaman dan join ulang — approval akan diulang otomatis."
          );
        } else {
          // Penyebab paling umum: priceFeed atau reputationContract di contract bermasalah.
          // Jalankan: npx hardhat run scripts/fix-pool-config.ts --network baseSepolia
          throw new Error(
            `Join pool akan gagal on-chain. ` +
            `Kemungkinan konfigurasi kontrak bermasalah (price feed atau reputation contract). ` +
            `Hubungi admin untuk menjalankan fix script. Detail: ${errorName || "unknown revert"}`
          );
        }
      }

      // Step 3b: Kirim joinPool tx (sudah diverifikasi bisa sukses)
      toast.loading("(3/3) Konfirmasi join pool di wallet kamu...", { id: "join" });
      const joinHash = await joinPool(poolId);

      toast.loading("Menunggu transaksi selesai...", { id: "join" });
      await waitForTransactionReceipt(wagmiConfig, {
        hash: joinHash as `0x${string}`,
        confirmations: 2,
      });

      toast.success("Berhasil join pool! Kamu sudah terdaftar.", { id: "join", duration: 6000 });
      setShowJoinModal(false);
      setSelectedPool(null);
      refetch();
      // Redirect ke detail pool agar user bisa lihat partisipasinya
      router.push(`/pools/${poolId.toString()}`);
    } catch (error: any) {
      debugError("PoolPage:joinPool", error);
      const msg = error?.shortMessage || error?.message || "Gagal join pool";
      toast.error(msg, { id: "join", duration: 8000 });
    } finally {
      setIsJoiningPool(false);
    }
  };

  return (
    <div className="px-5 py-8 space-y-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">{t.poolsTitle}</h1>
          <p className="text-slate-500 text-sm">{t.startArisanDesc}</p>
        </div>
        <Button
          size="sm"
          onClick={() => router.push("/pools/create")}
          disabled={!isConnected}
        >
          {t.createPool}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Pool Grid */}
      {isLoadingPools ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <ListSkeleton count={8} />
        </div>
      ) : (
        <>
          {activeTab === "open" && (
            openPools.length === 0 ? (
              <EmptyState message={t.noOpenPoolsCreate} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {openPools.map((pool) => (
                  <PoolCard
                    key={pool.id.toString()}
                    pool={pool}
                    onJoin={() => handleJoinPool(pool)}
                    onView={() => router.push(`/pools/${pool.id.toString()}`)}
                    isConnected={isConnected}
                    userBalance={userBalance}
                    isUserJoined={joinedPoolIds.has(pool.id.toString())}
                  />
                ))}
              </div>
            )
          )}

          {activeTab === "active" && (
            activePools.length === 0 ? (
              <EmptyState message={t.noActivePools2} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {activePools.map((pool) => (
                  <ActivePoolCard
                    key={pool.id.toString()}
                    pool={pool}
                    userAddress={address}
                  />
                ))}
              </div>
            )
          )}

          {activeTab === "completed" && (
            completedPools.length === 0 ? (
              <EmptyState message={t.noCompletedPools} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {completedPools.map((pool) => (
                  <CompletedPoolCard
                    key={pool.id.toString()}
                    pool={pool}
                    userAddress={address}
                  />
                ))}
              </div>
            )
          )}
        </>
      )}

      {/* Join Pool Modal */}
      {showJoinModal && selectedPool && (() => {
        // Kalkulasi menggunakan multiplier dari contract (bukan hardcode 125%)
        const multiplier = BigInt(collateralMultiplier);
        const collateral =
          (selectedPool.contribution * BigInt(selectedPool.maxParticipants) * multiplier) / BigInt(100);
        const collateralWithBuffer = (collateral * BigInt(101)) / BigInt(100);
        const totalNeeded = collateralWithBuffer + selectedPool.contribution;
        const canAfford = userBalance !== undefined && userBalance >= totalNeeded;
        const shortfall = userBalance !== undefined && userBalance < totalNeeded
          ? totalNeeded - userBalance
          : BigInt(0);

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => {
                setShowJoinModal(false);
                setSelectedPool(null);
              }}
            />
            <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                {t.joinPool}
              </h2>
              <p className="text-slate-500 text-sm mb-4">
                {t.reviewPoolDetails}
              </p>

              <div className="space-y-3 mb-4">
                {/* Pool details */}
                <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{t.poolTier}</span>
                    <span className="font-semibold text-slate-900">
                      {POOL_TIERS[selectedPool.tier].nameId}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{t.participants}</span>
                    <span className="font-semibold text-slate-900">
                      {selectedPool.currentParticipants}/{selectedPool.maxParticipants}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{t.duration}</span>
                    <span className="font-semibold text-slate-900">
                      {selectedPool.maxParticipants} {t.months}
                    </span>
                  </div>
                </div>

                {/* Payment breakdown */}
                <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    {t.joinCostBreakdown}
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{t.firstMonthContributionLabel}</span>
                    <span className="font-semibold text-slate-900">
                      {formatIDRX(selectedPool.contribution)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{t.securityDepositLabel}</span>
                    <span className="font-semibold text-amber-600">
                      {formatIDRX(collateral)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2 mt-1">
                    <span className="text-slate-900">{t.totalNeededLabel}</span>
                    <span className="text-[#1e2a4a] text-base">
                      {formatIDRX(totalNeeded)}
                    </span>
                  </div>
                </div>

                {/* Balance status */}
                <div className={`p-4 rounded-xl border ${canAfford ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-slate-700">{t.yourBalanceLbl}</span>
                    <span className={`text-sm font-bold ${canAfford ? "text-green-700" : "text-red-700"}`}>
                      {userBalance !== undefined ? formatIDRX(userBalance) : "—"}
                    </span>
                  </div>
                  {userBalance !== undefined && (
                    <div className="flex items-center gap-1.5 mt-1">
                      {canAfford ? (
                        <>
                          <span className="text-green-600 text-base">✓</span>
                          <span className="text-green-700 text-xs font-medium">
                            {t.balanceSufficient}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-red-600 text-base">✗</span>
                          <span className="text-red-700 text-xs font-medium">
                            {t.shortBy} {formatIDRX(shortfall as bigint)} {t.claimFaucetFirst}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Coinbase Wallet warning */}
                {canAfford && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2">
                    <span className="text-amber-500 text-lg flex-shrink-0">⚠️</span>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      <strong>Perhatian saat konfirmasi di wallet:</strong> Coinbase Wallet mungkin menampilkan
                      {" "}<em>"Unable to estimate network fee"</em>. Ini{" "}
                      <strong>BUKAN error</strong> — itu hanya peringatan UI karena contract belum terdaftar
                      di Coinbase. Klik <strong>"Confirm"</strong>, bukan Cancel.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowJoinModal(false);
                    setSelectedPool(null);
                  }}
                >
                  {t.cancel}
                </Button>
                <Button
                  className="flex-1"
                  onClick={confirmJoinPool}
                  isLoading={isLoading}
                  disabled={isLoading || (userBalance !== undefined && !canAfford)}
                >
                  {userBalance !== undefined && !canAfford ? t.insufficientBalance : t.confirmJoin}
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// Pool Card Component
function PoolCard({
  pool,
  onJoin,
  isConnected,
  userBalance,
  isUserJoined = false,
  onView,
}: {
  pool: Pool;
  onJoin: () => void;
  isConnected: boolean;
  userBalance?: bigint;
  isUserJoined?: boolean;
  onView?: () => void;
}) {
  const { t } = useLanguage();
  const tierConfig = POOL_TIERS[pool.tier];
  const collateral = calculateCollateral(pool.contribution, pool.maxParticipants);
  const totalNeeded = collateral + pool.contribution;
  const progress = (pool.currentParticipants / pool.maxParticipants) * 100;
  const canAfford = isConnected && userBalance !== undefined && userBalance >= totalNeeded;
  const cannotAfford = isConnected && userBalance !== undefined && userBalance < totalNeeded;

  return (
    <div className={`flex flex-col p-4 border rounded-2xl hover:shadow-md transition-all ${cannotAfford
      ? "border-red-200 bg-red-50/30"
      : canAfford
        ? "border-green-200 hover:border-green-300"
        : "border-slate-200 hover:border-[#1e2a4a]/40"
      }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-slate-900 text-sm">{tierConfig.nameId}</p>
        <div className="flex items-center gap-1.5">
          {canAfford && (
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
              {t.canJoinBadge}
            </span>
          )}
          {cannotAfford && (
            <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
              {t.cannotAffordBadge}
            </span>
          )}
          <span className="px-2 py-0.5 bg-[#1e2a4a]/5 text-[#1e2a4a] text-xs font-medium rounded-full">
            {t.openPools}
          </span>
        </div>
      </div>

      {/* Contribution */}
      <p className="text-xs text-slate-400 mb-0.5">{t.contributionPerMonth}</p>
      <p className="text-lg font-bold text-slate-900 mb-3">
        {formatIDRX(pool.contribution)}
      </p>

      {/* Progress bar */}
      <div className="mb-1">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{t.participants}</span>
          <span className="font-medium text-slate-700">
            {pool.currentParticipants}/{pool.maxParticipants}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div
            className="bg-[#1e2a4a] h-1.5 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Total needed to join */}
      <div className="mt-3 mb-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
        <p className="text-xs text-slate-400 mb-0.5">{t.totalToJoin}</p>
        <p className="text-sm font-bold text-[#1e2a4a]">
          {formatIDRX(totalNeeded)}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {t.securityDepositShort} {formatIDRX(collateral)} + {t.contribution} {formatIDRX(pool.contribution)}
        </p>
      </div>

      {/* Pool ID */}
      <p className="text-xs text-slate-400 mb-3">#{pool.id.toString()} · {tierConfig.cycleDays}{t.daysCycle}</p>

      {isUserJoined ? (
        <Button
          variant="secondary"
          className="w-full mt-auto text-sm py-2 border-green-300 text-green-700 bg-green-50 hover:bg-green-100"
          onClick={onView}
        >
          ✓ Sudah Bergabung → Lihat Detail
        </Button>
      ) : (
        <Button
          className="w-full mt-auto text-sm py-2"
          onClick={onJoin}
          disabled={!isConnected}
        >
          {!isConnected ? t.connectWalletToJoin : t.joinPool}
        </Button>
      )}
    </div>
  );
}

// Active Pool Card Component - reads real participant data
function ActivePoolCard({
  pool,
  userAddress,
}: {
  pool: Pool;
  userAddress: `0x${string}` | undefined;
}) {
  const { t } = useLanguage();
  const tierConfig = POOL_TIERS[pool.tier];
  const progress = (pool.currentRound / pool.totalRounds) * 100;
  const { data: participant } = useParticipantInfo(pool.id, userAddress);

  return (
    <div className="flex flex-col p-4 border-2 border-[#1e2a4a] rounded-2xl bg-[#1e2a4a]/5 hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-slate-900 text-sm">{tierConfig.nameId}</p>
        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
          {t.activeStatus}
        </span>
      </div>

      {/* Contribution */}
      <p className="text-xs text-slate-400 mb-0.5">{t.contributionPerMonth}</p>
      <p className="text-lg font-bold text-slate-900 mb-3">
        {formatIDRX(pool.contribution)}
      </p>

      {/* Round progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{t.roundLabel}</span>
          <span className="font-medium text-slate-700">
            {pool.currentRound}/{pool.totalRounds}
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-1.5">
          <div
            className="bg-green-500 h-1.5 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-between text-xs text-slate-500 mb-2">
        <span>{pool.currentParticipants} {t.participants}</span>
        {participant?.hasWon ? (
          <span className="text-green-600 font-semibold">{t.wonBadge}</span>
        ) : (
          <span className="text-slate-400">{t.notWonYet}</span>
        )}
      </div>

      {participant && participant.missedPayments > 0 && (
        <p className="text-xs text-red-500 mb-2">
          {participant.missedPayments} {participant.missedPayments > 1 ? t.missedPaymentText + "s" : t.missedPaymentText}
        </p>
      )}

      <div className="mt-auto pt-2 border-t border-[#1e2a4a]/10">
        <p className="text-xs text-slate-400">#{pool.id.toString()}</p>
      </div>
    </div>
  );
}

// Completed Pool Card Component - reads real participant data
function CompletedPoolCard({
  pool,
  userAddress,
}: {
  pool: Pool;
  userAddress: `0x${string}` | undefined;
}) {
  const { t } = useLanguage();
  const tierConfig = POOL_TIERS[pool.tier];
  const { data: participant } = useParticipantInfo(pool.id, userAddress);

  return (
    <div className="flex flex-col p-4 border border-slate-200 rounded-2xl bg-slate-50 hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-slate-900 text-sm">{tierConfig.nameId}</p>
        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs font-medium rounded-full">
          {t.completedStatus}
        </span>
      </div>

      {/* Contribution */}
      <p className="text-xs text-slate-400 mb-0.5">{t.contributionPerMonth}</p>
      <p className="text-lg font-bold text-slate-900 mb-3">
        {formatIDRX(pool.contribution)}
      </p>

      {/* Stats */}
      <div className="flex justify-between text-xs text-slate-500 mb-3">
        <span>{pool.totalRounds} {t.months}</span>
        <span>{pool.currentParticipants} {t.participants}</span>
      </div>

      {/* Participant results */}
      {participant && (
        <div className="space-y-1.5 pt-2 border-t border-slate-200">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">{t.wonResult}</span>
            <span className={`font-semibold ${participant.hasWon ? "text-green-600" : "text-slate-400"}`}>
              {participant.hasWon ? t.yesLabel : t.noLabel}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">{t.potReceived}</span>
            <span className="font-semibold text-slate-900">
              {formatIDRX(participant.potReceived)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">{t.yieldEarned}</span>
            <span className="font-semibold text-green-600">
              +{formatIDRX(participant.collateralYieldEarned)}
            </span>
          </div>
        </div>
      )}

      <div className="mt-auto pt-2">
        <p className="text-xs text-slate-400">#{pool.id.toString()}</p>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-8 border border-slate-200 rounded-2xl text-center">
      <p className="text-slate-500">{message}</p>
    </div>
  );
}
