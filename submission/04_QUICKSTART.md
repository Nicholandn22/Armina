# Armina DeFi - Quick Start Guide

Panduan cepat untuk mulai testing Armina DeFi platform di Base Sepolia testnet.

---

## 🚀 Quick Setup (5 menit)

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

File `.env.local` sudah configured dengan contract addresses:

```env
NEXT_PUBLIC_IDRX_ADDRESS=0x7F197979D4046b2264De80D11359B6Cb5d1a8611
NEXT_PUBLIC_ARMINA_POOL_ADDRESS=0xDdBFEBA307151a1991b68D31D9e6041852302fB7
NEXT_PUBLIC_CHAIN_ID=84532
```

### 3. Get Testnet ETH

Kunjungi faucet untuk mendapatkan testnet ETH (untuk gas fees):
- https://www.alchemy.com/faucets/base-sepolia

Paste wallet address Anda dan claim 0.1 ETH.

### 4. Run Development Server

```bash
npm run dev
```

Buka http://localhost:3000

---

## 🧪 Testing Flow

### Step 1: Claim IDRX Tokens

Sebelum bisa create atau join pool, Anda perlu IDRX tokens.

**Via Frontend**:
1. Connect wallet (MetaMask)
2. Click "Claim IDRX" button
3. Confirm transaction
4. Anda akan menerima 10,000 IDRX

**Via Contract Direct**:
```typescript
// Call faucet() function on IDRX contract
// Address: 0x7F197979D4046b2264De80D11359B6Cb5d1a8611
```

### Step 2: Create a Pool

Pilihan pool size dan estimasi:

| Pool Size | Monthly | Collateral | Total Due at Join |
|-----------|---------|------------|-------------------|
| 5 members | 500K    | 2,500K     | 3,000K IDRX      |
| 10 members| 500K    | 5,000K     | 5,500K IDRX      |
| 15 members| 500K    | 7,500K     | 8,000K IDRX      |
| 20 members| 500K    | 10,000K    | 10,500K IDRX     |

**Steps**:
1. Go to "Create Pool" page
2. Select pool size (5, 10, 15, or 20)
3. Enter monthly amount (min 100K IDRX)
4. Approve IDRX spending
5. Create pool transaction
6. Wait for confirmation

### Step 3: Join a Pool

**Requirements**:
- Collateral: `poolSize × monthlyAmount`
- First payment: `monthlyAmount`
- Total: `collateral + monthlyAmount`

**Steps**:
1. Browse available pools
2. Click "Join Pool"
3. Approve IDRX spending
4. Confirm join transaction
5. You're now a participant!

### Step 4: Monthly Payments

Setiap bulan, participants harus bayar iuran bulanan:

```typescript
// Call processMonthlyPayment
await pool.processMonthlyPayment(poolId, currentMonth);
```

**Payment Priority**:
1. Deduct from wallet IDRX balance
2. If insufficient, deduct from collateral
3. If still insufficient, apply 10% penalty

### Step 5: Winner Selection (Need VRF Setup)

Setiap bulan, 1 winner dipilih secara random:

⚠️ **Requires Chainlink VRF subscription** - See setup guide below

```typescript
// Owner calls
await pool.requestWinnerDraw(poolId);
// Chainlink VRF returns random number
// Winner receives pot + yield
```

### Step 6: Final Settlement

Setelah semua bulan selesai:

```typescript
await pool.claimFinalSettlement(poolId);
```

**You receive**:
- Remaining collateral
- Accumulated yield
- Minus any penalties
- Minus used for payments

---

## ⚙️ Advanced Setup

### Setup Chainlink VRF (Required for Winner Selection)

**Without this, winner selection will NOT work**

1. **Get testnet LINK**:
   - https://faucets.chain.link/base-sepolia
   - Claim 2-5 LINK tokens

2. **Create VRF Subscription**:
   - Go to https://vrf.chain.link/base-sepolia
   - Connect same wallet as deployer
   - Click "Create Subscription"
   - Fund with 2+ LINK tokens

3. **Add Consumer**:
   - In subscription dashboard
   - Click "Add Consumer"
   - Enter ArminaPool address: `0xDdBFEBA307151a1991b68D31D9e6041852302fB7`
   - Confirm transaction

4. **Update Configuration**:
   - Copy subscription ID
   - Update `.env`:
     ```
     VRF_SUBSCRIPTION_ID=<your_subscription_id>
     ```
   - Redeploy contract (optional) or keep using current

### Verify Contracts on BaseScan

Makes source code public for transparency:

```bash
# Get API key from https://basescan.org/register
export BASESCAN_API_KEY=your_api_key

# Verify IDRX
npm run verify:idrx

# Verify ArminaPool
npm run verify:pool
```

---

## 📊 Contract Addresses

Copy these for manual interactions:

```
IDRX Token:      0x7F197979D4046b2264De80D11359B6Cb5d1a8611
ArminaPool:      0xDdBFEBA307151a1991b68D31D9e6041852302fB7
Network:         Base Sepolia (Chain ID: 84532)
Block Explorer:  https://sepolia.basescan.org
```

---

## 🔍 Monitoring & Debugging

### View on BaseScan

**IDRX Token**:
https://sepolia.basescan.org/address/0x7F197979D4046b2264De80D11359B6Cb5d1a8611

**ArminaPool**:
https://sepolia.basescan.org/address/0xDdBFEBA307151a1991b68D31D9e6041852302fB7

### Check Your Transactions

1. Go to BaseScan
2. Enter your wallet address
3. View all transactions
4. Click transaction hash for details

### Debug Failed Transactions

1. Find transaction on BaseScan
2. Check "State" tab for error message
3. Common errors:
   - "Insufficient allowance" → Need to approve IDRX
   - "Insufficient collateral" → Need more IDRX
   - "Pool not full" → Wait for all members
   - "Already joined" → You're already in this pool

---

## 💡 Tips & Best Practices

### Testing Strategy

1. **Start Small**:
   - Create 5-member pool first
   - Use minimum amounts (100K-500K IDRX)

2. **Multiple Accounts**:
   - Use different MetaMask accounts
   - Test full pool lifecycle
   - Simulate different scenarios

3. **Check Balances**:
   - Always check IDRX balance before actions
   - Monitor collateral status
   - Track payment history

### Common Workflows

**Scenario 1: Quick Pool Test**
```
1. Claim IDRX (10K) x 5 accounts
2. Create 5-member pool (100K monthly)
3. Each account joins
4. Process month 1 payments
5. Check pool status
```

**Scenario 2: Penalty Test**
```
1. Join pool
2. Skip month 2 payment
3. Check penalty applied (10%)
4. Pay month 3 with penalty
```

**Scenario 3: Early Exit Test**
```
1. Join pool
2. Win in month 2
3. Stop paying remaining months
4. Claim settlement
5. Verify loss > gain (anti-kabur)
```

---

## 🆘 Troubleshooting

### "Cannot read properties of undefined"
- Wallet not connected
- Wrong network (must be Base Sepolia)
- Contract not loaded

### "Transaction reverted"
- Check allowance
- Check balance
- Check pool status
- View error on BaseScan

### "Insufficient funds"
- Need more testnet ETH for gas
- Get from faucet: https://www.alchemy.com/faucets/base-sepolia

### "MetaMask not showing network"
- Add Base Sepolia manually:
  - Network Name: Base Sepolia
  - RPC URL: https://sepolia.base.org
  - Chain ID: 84532
  - Symbol: ETH
  - Explorer: https://sepolia.basescan.org

---

## 📚 Additional Resources

- [Full Deployment Guide](docs/TESTNET_DEPLOYMENT.md)
- [User Flow Documentation](docs/USER_FLOW.md)
- [Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md)
- [BaseScan Explorer](https://sepolia.basescan.org)

---

## ✅ Checklist

Before testing, make sure:

- [ ] Wallet has testnet ETH (>0.01 ETH)
- [ ] Claimed IDRX from faucet (10,000 IDRX)
- [ ] Connected to Base Sepolia network
- [ ] Approved IDRX spending for pool
- [ ] Understand collateral requirements

---

**Happy Testing!** 🚀

Last Updated: January 20, 2026
