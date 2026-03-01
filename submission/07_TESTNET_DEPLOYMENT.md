# Armina DeFi - Base Sepolia Testnet Deployment

## 🎉 Deployment Status: SUCCESSFUL

**Network**: Base Sepolia Testnet
**Chain ID**: 84532
**Deployment Date**: January 20, 2026
**Deployer Address**: `0x5548faEE0cEe4373DcCb559ddE8da8B22001576c`

---

## 📝 Deployed Contracts

### 1. IDRX Token (Mock ERC20)

**Contract Address**: `0x7F197979D4046b2264De80D11359B6Cb5d1a8611`
**View on BaseScan**: https://sepolia.basescan.org/address/0x7F197979D4046b2264De80D11359B6Cb5d1a8611

**Features**:
- ✅ ERC20 standard token
- ✅ Name: "Indonesian Rupiah X"
- ✅ Symbol: "IDRX"
- ✅ Decimals: 18
- ✅ Initial Supply: 1,000,000,000 IDRX
- ✅ Faucet function: Anyone can claim 10,000 IDRX for testing

**How to get testnet IDRX**:
```typescript
// Using the faucet function
await idrxContract.faucet();
// Claims 10,000 IDRX to caller's address
```

---

### 2. ArminaPool Contract (Main Arisan Logic)

**Contract Address**: `0xDdBFEBA307151a1991b68D31D9e6041852302fB7`
**View on BaseScan**: https://sepolia.basescan.org/address/0xDdBFEBA307151a1991b68D31D9e6041852302fB7

**Features**:
- ✅ Create pools (5, 10, 15, 20 members)
- ✅ Join pools with collateral
- ✅ Monthly payment processing
- ✅ Collateral management with 125% requirement
- ✅ Winner selection via Chainlink VRF
- ✅ 10% penalty for missed payments
- ✅ 10% platform fee on yield
- ✅ Final settlement claims

**Configuration**:
- IDRX Token: `0x7F197979D4046b2264De80D11359B6Cb5d1a8611`
- VRF Coordinator: `0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE`
- VRF Key Hash: `0xc799bd1e3bd4d1a41cd4968997a4e03dfd2a3c7c04b695881138580163f42887`
- Platform Fee: 10%
- Penalty Rate: 10% per missed payment

---

## 🔧 Integration Guide

### Environment Variables

Add these to your `.env.local`:

```env
# Base Sepolia RPC
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org

# Contract Addresses
NEXT_PUBLIC_IDRX_ADDRESS=0x7F197979D4046b2264De80D11359B6Cb5d1a8611
NEXT_PUBLIC_ARMINA_POOL_ADDRESS=0xDdBFEBA307151a1991b68D31D9e6041852302fB7

# Chain ID
NEXT_PUBLIC_CHAIN_ID=84532
```

### Using the Contracts in Frontend

```typescript
import { useArminaPool } from '@/hooks/useArminaPool';
import { useIDRX } from '@/hooks/useIDRX';
import { ARMINA_POOL_ADDRESS } from '@/contracts/config';

// Create a pool
const { createPool } = useArminaPool();
await createPool(parseUnits("500000", 18), 10); // 500K IDRX, 10 members

// Claim IDRX from faucet
const { claimFaucet } = useIDRX();
await claimFaucet(); // Get 10,000 IDRX

// Approve ArminaPool to spend IDRX
const { approve } = useIDRX();
await approve(ARMINA_POOL_ADDRESS, parseUnits("5500000", 18));

// Join a pool
const { joinPool } = useArminaPool();
await joinPool(1n); // Join pool ID 1
```

---

## ⚠️ Next Steps Required

### 1. Setup Chainlink VRF (CRITICAL for winner selection)

**Why**: The random winner selection requires Chainlink VRF subscription.

**Steps**:
1. Go to https://vrf.chain.link/base-sepolia
2. Connect wallet (same deployer wallet)
3. Create new subscription
4. Fund subscription with LINK tokens
   - Get testnet LINK from: https://faucets.chain.link/base-sepolia
   - Minimum: 2 LINK
5. Add consumer contract: `0xDdBFEBA307151a1991b68D31D9e6041852302fB7`
6. Update `.env` with subscription ID:
   ```
   VRF_SUBSCRIPTION_ID=<your_subscription_id>
   ```
7. Redeploy contract with updated subscription ID (optional - current setup uses ID 0 which will fail on winner draw)

**Note**: Without VRF setup, all pool features work EXCEPT winner selection.

---

### 2. Contract Verification (Optional - for transparency)

**Why**: Verified contracts show source code on BaseScan for transparency.

**Steps**:
1. Get BaseScan API key: https://basescan.org/register
2. Add to `.env`:
   ```
   BASESCAN_API_KEY=<your_api_key>
   ```
3. Verify IDRX:
   ```bash
   npx hardhat verify --network baseSepolia \
     0x7F197979D4046b2264De80D11359B6Cb5d1a8611 \
     "1000000000000000000000000000"
   ```
4. Verify ArminaPool:
   ```bash
   npx hardhat verify --network baseSepolia \
     0xDdBFEBA307151a1991b68D31D9e6041852302fB7 \
     "0x7F197979D4046b2264De80D11359B6Cb5d1a8611" \
     "0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE" \
     "0" \
     "0xc799bd1e3bd4d1a41cd4968997a4e03dfd2a3c7c04b695881138580163f42887"
   ```

---

## 🧪 Testing Guide

### Get Testnet Assets

1. **Get testnet ETH** (for gas):
   - https://www.alchemy.com/faucets/base-sepolia
   - Or bridge from Ethereum Sepolia: https://bridge.base.org/deposit

2. **Get IDRX tokens**:
   ```typescript
   // Call faucet function on IDRX contract
   // Gives 10,000 IDRX per call
   ```

### Test Scenarios

#### Scenario 1: Create and Join a Pool

```typescript
// 1. Claim IDRX
await idrx.faucet(); // Get 10,000 IDRX

// 2. Create pool (500K monthly, 10 members)
await pool.createPool(parseUnits("500000", 18), 10);
// Requires: 5,500K IDRX (5M collateral + 500K first payment)

// 3. Approve spending
await idrx.approve(poolAddress, parseUnits("5500000", 18));

// 4. Join the pool
await pool.joinPool(1n);
```

#### Scenario 2: Process Monthly Payment

```typescript
// Each month, participants pay
await pool.processMonthlyPayment(poolId, month);
// Deducts from wallet first, then collateral if insufficient
```

#### Scenario 3: Claim Settlement

```typescript
// After all months complete
await pool.claimFinalSettlement(poolId);
// Returns remaining collateral + yield - penalties
```

---

## 📊 Contract Capabilities Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Create Pool | ✅ Working | Supports 5, 10, 15, 20 members |
| Join Pool | ✅ Working | Requires collateral approval |
| Monthly Payments | ✅ Working | Auto-deducts from wallet/collateral |
| Winner Selection | ⚠️ Needs VRF | Requires Chainlink VRF setup |
| Collateral Yield | ✅ Working | Tracked per participant |
| Penalties | ✅ Working | 10% per missed payment |
| Final Settlement | ✅ Working | Claims remaining balance |

---

## 🔐 Security Notes

1. **Private Key**: Never commit `.env` file to git
2. **Testnet Only**: These contracts are for testing only
3. **IDRX has no value**: Mock token for testing purposes
4. **Audit**: Contracts not audited - use at your own risk

---

## 📁 Deployment Artifacts

- [IDRX Deployment Info](../deployments/idrx-deployment-1768870665483.json)
- [ArminaPool Deployment Info](../deployments/arminapool-deployment-1768870789383.json)
- [Contract ABIs](../src/contracts/abis/)

---

## 🆘 Troubleshooting

### Issue: Transaction fails with "insufficient funds"
**Solution**: Get more testnet ETH from faucet

### Issue: "Insufficient allowance" error
**Solution**: Call `approve()` on IDRX contract first

### Issue: Cannot draw winner
**Solution**: Setup Chainlink VRF subscription (see section above)

### Issue: "Pool not full" error
**Solution**: Wait for all members to join before starting

---

## 📞 Support

For issues or questions:
- Check BaseScan for transaction details
- Review contract source code (after verification)
- Test on smaller amounts first

---

**Last Updated**: January 20, 2026
**Deployment Version**: v1.0.0-testnet
