"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { IDRX_ABI, CONTRACTS } from "@/contracts/abis";

export function useIDRXDecimals() {
  return useReadContract({
    address: CONTRACTS.IDRX,
    abi: IDRX_ABI,
    functionName: "decimals",
    query: {
      enabled: !!CONTRACTS.IDRX,
      staleTime: Infinity,
    },
  });
}

export function useIDRXBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.IDRX,
    abi: IDRX_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACTS.IDRX,
      staleTime: 10_000,
    },
  });
}

export function useIDRXAllowance(
  owner: `0x${string}` | undefined,
  spender: `0x${string}` | undefined
) {
  return useReadContract({
    address: CONTRACTS.IDRX,
    abi: IDRX_ABI,
    functionName: "allowance",
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled: !!owner && !!spender && !!CONTRACTS.IDRX,
      staleTime: 10_000,
    },
  });
}

export function useCanClaimFaucet(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.IDRX,
    abi: IDRX_ABI,
    functionName: "canClaimFaucet",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACTS.IDRX,
      staleTime: 10_000,
    },
  });
}

export function useTimeUntilNextClaim(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.IDRX,
    abi: IDRX_ABI,
    functionName: "timeUntilNextClaim",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACTS.IDRX,
      staleTime: 10_000,
    },
  });
}

export function useClaimFaucet() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimFaucet = () => {
    if (!CONTRACTS.IDRX) return;
    writeContract({
      address: CONTRACTS.IDRX,
      abi: IDRX_ABI,
      functionName: "faucet",
      chainId: baseSepolia.id,
    });
  };

  return { claimFaucet, hash, isPending, isConfirming, isSuccess, error };
}

export function useApproveIDRX() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = async (spender: `0x${string}`, amount: bigint) => {
    if (!CONTRACTS.IDRX) return;
    return writeContractAsync({
      address: CONTRACTS.IDRX,
      abi: IDRX_ABI,
      functionName: "approve",
      args: [spender, amount],
      chainId: baseSepolia.id,
    });
  };

  return { approve, hash, isPending, isConfirming, isSuccess, error };
}
