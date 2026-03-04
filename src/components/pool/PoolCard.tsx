"use client";

import { Pool } from "@/types";
import {
  formatIDRX,
  getPoolStatus,
  POOL_TIERS,
  calculateCollateral,
} from "@/lib/constants";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { PoolStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { UsersIcon, ClockIcon, ShieldIcon } from "@/components/ui/Icons";

interface PoolCardProps {
  pool: Pool;
  onJoin?: () => void;
  onView?: () => void;
  showJoinButton?: boolean;
  isUserJoined?: boolean;
}

export function PoolCard({
  pool,
  onJoin,
  onView,
  showJoinButton = true,
  isUserJoined = false,
}: PoolCardProps) {
  const tierConfig = POOL_TIERS[pool.tier];
  const status = getPoolStatus(pool);
  const collateral = calculateCollateral(pool.contribution, pool.maxParticipants);

  return (
    <Card hover onClick={onView} className="animate-fade-in">
      <CardHeader>
        <CardTitle>{tierConfig.nameId}</CardTitle>
        <PoolStatusBadge status={status} />
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Contribution */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Contribution/Month</span>
          <span className="font-semibold">{formatIDRX(pool.contribution)}</span>
        </div>

        {/* Participants */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted flex items-center gap-1">
            <UsersIcon className="w-4 h-4" />
            Participants
          </span>
          <span className="font-semibold">
            {pool.currentParticipants}/{pool.maxParticipants}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-armina-primary h-2 rounded-full transition-all"
            style={{
              width: `${(pool.currentParticipants / pool.maxParticipants) * 100}%`,
            }}
          />
        </div>

        {/* Cycle */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted flex items-center gap-1">
            <ClockIcon className="w-4 h-4" />
            Cycle
          </span>
          <span className="font-semibold">{tierConfig.cycleDays} days</span>
        </div>

        {/* Collateral */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted flex items-center gap-1">
            <ShieldIcon className="w-4 h-4" />
            Collateral
          </span>
          <span className="font-semibold">{formatIDRX(collateral)}</span>
        </div>

        {/* Round info for active pools */}
        {pool.isActive && (
          <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
            <span className="text-muted">Round</span>
            <span className="font-semibold text-armina-primary">
              {pool.currentRound}/{pool.totalRounds}
            </span>
          </div>
        )}

        {/* Join button */}
        {showJoinButton && status === "open" && !isUserJoined && (
          <Button
            className="w-full mt-2"
            onClick={(e) => {
              e.stopPropagation();
              onJoin?.();
            }}
          >
            Join Pool
          </Button>
        )}

        {/* Already joined indicator */}
        {showJoinButton && status === "open" && isUserJoined && (
          <Button
            variant="secondary"
            className="w-full mt-2"
            onClick={(e) => {
              e.stopPropagation();
              onView?.();
            }}
          >
            ✓ Sudah Bergabung → Lihat
          </Button>
        )}

        {status === "active" && (
          <Button
            variant="secondary"
            className="w-full mt-2"
            onClick={(e) => {
              e.stopPropagation();
              onView?.();
            }}
          >
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
