# Frontend Testing Guide

Panduan lengkap untuk testing Armina DeFi frontend yang sudah terintegrasi dengan smart contracts di Base Sepolia testnet.

---

## 🚀 Quick Start

### 1. Start Development Server

```bash
npm run dev
```

Buka http://localhost:3000

### 2. Prepare Your Wallet

**Requirements**:
- MetaMask installed
- Base Sepolia network added
- Testnet ETH (for gas fees)

**Add Base Sepolia to MetaMask**:
- Network Name: Base Sepolia
- RPC URL: https://sepolia.base.org
- Chain ID: 84532
- Currency Symbol: ETH
- Block Explorer: https://sepolia.basescan.org

**Get Testnet ETH**:
- Visit: https://www.alchemy.com/faucets/base-sepolia
- Paste wallet address
- Claim 0.1 ETH

---

## 📱 Pages to Test

### 1. Homepage (/)

**What to check**:
- ✅ Wallet connection works
- ✅ IDRX balance displays correctly
- ✅ "Get Free IDRX" button visible
- ✅ "Start Arisan" button works
- ✅ Stats display (Active Pools, Completed)

**Test Flow**:
1. Connect wallet with Privy/WalletConnect
2. Check balance shows 0 IDRX initially
3. Click "Get Free IDRX" → should go to /faucet
4. Click "Start Arisan" → should go to /pool

---

### 2. Faucet Page (/faucet)

**What to check**:
- ✅ Balance displays correctly
- ✅ "Claim 10,000 IDRX" button works
- ✅ Transaction confirmation appears
- ✅ Balance updates after claim
- ✅ Success message shows
- ✅ Can claim multiple times

**Test Flow**:
1. Visit /faucet
2. Check "Your IDRX Balance" shows current balance
3. Click "Claim 10,000 IDRX"
4. Approve transaction in MetaMask
5. Wait for confirmation (~5-10 seconds)
6. Check balance increased by 10,000 IDRX
7. Click "Create Pool" quick action

**Expected Results**:
- Transaction hash appears in MetaMask
- Green success message: "Successfully claimed 10,000 IDRX"
- Balance updates from 0 → 10,000 IDRX
- Can claim again immediately (no rate limit)

---

### 3. Create Pool Page (/pools/create)

**What to check**:
- ✅ Pool size selection works (5, 10, 15, 20)
- ✅ Monthly amount presets work
- ✅ Custom amount input works
- ✅ Calculations correct
  - Collateral = 125% × (poolSize × monthlyAmount)
  - Total Due = collateral + monthlyAmount
- ✅ Approve IDRX transaction
- ✅ Create pool transaction
- ✅ Loading states show correctly

**Test Flow**:

**Scenario 1: Create 5-Member Pool (100K monthly)**
1. Select "5 People"
2. Select "100K" monthly amount
3. Check summary:
   - Pool Size: 5 Participants
   - Monthly Contribution: 100,000 IDRX
   - Collateral Required: 625,000 IDRX (125% × pot)
   - Total Due at Join: 725,000 IDRX
4. Click "Create Pool"
5. Approve IDRX spending (725K)
6. Confirm create transaction
7. Wait for success

**Scenario 2: Create 10-Member Pool (Custom Amount)**
1. Select "10 People"
2. Click "+ Enter custom amount"
3. Enter "100000" (100K)
4. Check summary updates:
   - Monthly Contribution: 100,000 IDRX
   - Collateral Required: 1,250,000 IDRX (125% × 10 × 100K)
   - Total Due: 1,350,000 IDRX
5. Note: Need more IDRX! Go to faucet
6. Claim faucet multiple times until have 1.4M+ IDRX
7. Return and create pool

**Expected Results**:
- Button shows different states:
  - "Connect Wallet to Continue" (not connected)
  - "Approving IDRX..." (during approval)
  - "Creating Pool..." (during creation)
  - "Confirming..." (waiting confirmation)
- Two MetaMask popups: Approve + Create
- Redirect to /pools after success

**Common Errors**:
- "Insufficient allowance" → Need to approve first
- "Insufficient balance" → Need more IDRX from faucet
- "Execution reverted" → Check gas limit, try again

---

### 4. Browse Pools Page (/pools)

**What to check**:
- ✅ List of pools displays
- ✅ Pool details correct
- ✅ Filter works (All, Open, Active, Completed)
- ✅ "Join Pool" button works
- ✅ Pool status indicator

**Test Flow**:
1. Visit /pools
2. See pool(s) created in previous step
3. Check pool shows:
   - Pool ID
   - Size (e.g., "5/5 members")
   - Monthly amount
   - Status (Open, Full, Active)
   - Collateral required
4. Click on a pool → go to /pools/[id]

---

### 5. Pool Details Page (/pools/[id])

**What to check**:
- ✅ Pool information complete
- ✅ Participant slots show correctly
- ✅ Progress bar accurate
- ✅ "Join Pool" functionality
- ✅ Payment calculator
- ✅ Collateral info

**Test Flow**:

**Join Pool (with different account)**:
1. Switch MetaMask to Account 2
2. Visit /pools/1
3. Check pool details
4. Note collateral required
5. Go to /faucet and claim enough IDRX
6. Return to pool
7. Click "Join Pool"
8. Approve IDRX (collateral + first payment)
9. Confirm join transaction
10. Check participant count updated

**View as Participant**:
1. After joining, page updates
2. See your participant info:
   - Collateral deposited
   - Payment status
   - Projected yield
3. Try monthly payment (if pool active)

---

### 6. Dashboard Page (/dashboard)

**What to check**:
- ✅ Lists all user's pools
- ✅ Collateral summary
- ✅ Payment history
- ✅ Yield tracking
- ✅ Penalties display
- ✅ Settlement info

**Test Flow**:
1. Visit /dashboard
2. See pools you've joined/created
3. Check each pool shows:
   - Pool ID & status
   - Collateral locked
   - Payments made
   - Current month
   - Next payment due
4. Click "View Details" → go to pool page

---

## 🧪 Complete Testing Scenarios

### Scenario A: First-Time User

```
1. Install MetaMask
2. Add Base Sepolia network
3. Get testnet ETH from faucet
4. Connect wallet on Armina homepage
5. Go to /faucet
6. Claim 10,000 IDRX
7. Claim 10 more times (100K total)
8. Go to /pools/create
9. Create 5-member pool, 100K monthly
10. Wait for approval + creation
11. Pool created successfully!
```

### Scenario B: Join Existing Pool

```
1. Browse /pools
2. Find open pool
3. Check collateral requirement
4. Go to /faucet if needed
5. Claim enough IDRX
6. Return to pool
7. Join pool
8. Approve + confirm
9. Now participant in pool!
```

### Scenario C: Multi-Account Pool Fill

```
Using 5 MetaMask accounts:

Account 1 (Creator):
- Create 5-member pool
- 100K monthly
- Need 5.1M IDRX total (5M collateral + 100K first payment)

Accounts 2-5 (Joiners):
- Each claims 5.1M IDRX from faucet (510 claims × 10K each)
- Each joins the pool
- After 5th join → pool becomes Full
- Pool status changes to Active
```

---

## 🐛 Common Issues & Solutions

### Issue: "Please connect your wallet first"
**Solution**: Click connect button, approve in MetaMask

### Issue: "Insufficient funds for gas"
**Solution**: Get more testnet ETH from faucet

### Issue: Transaction fails with "Insufficient allowance"
**Solution**: Approve IDRX spending first

### Issue: Balance doesn't update after claim
**Solution**: Wait 10-15 seconds, refresh if needed

### Issue: MetaMask popup doesn't appear
**Solution**: Click MetaMask extension icon, check for pending requests

### Issue: "Execution reverted"
**Solution**:
- Check you have enough IDRX
- Try increasing gas limit
- Wait a few seconds and retry

### Issue: Pool not showing in /pools list
**Solution**:
- Wait for block confirmation
- Refresh page
- Check network is Base Sepolia

---

## ✅ Functionality Checklist

### Core Features
- [ ] Wallet connection (Privy)
- [ ] Network detection (Base Sepolia)
- [ ] IDRX balance display
- [ ] Faucet claim (10K IDRX)
- [ ] Create pool (all sizes)
- [ ] Join pool
- [ ] View pool details
- [ ] Browse pools list
- [ ] Dashboard view

### Smart Contract Integration
- [ ] IDRX approve transaction
- [ ] createPool transaction
- [ ] joinPool transaction
- [ ] Read pool data
- [ ] Read participant data
- [ ] Balance queries

### UI/UX
- [ ] Loading states show
- [ ] Success messages display
- [ ] Error handling works
- [ ] Buttons disable during transactions
- [ ] Calculations are correct
- [ ] Responsive design

---

## 📊 Test Data Examples

### Small Pool (Testing)
- Size: 5 members
- Monthly: 100K IDRX
- Collateral: 625K IDRX (125% × 5 × 100K)
- Total: 725K IDRX
- Duration: 5 months

### Standard Pool
- Size: 10 members
- Monthly: 100K IDRX
- Collateral: 1.25M IDRX (125% × 10 × 100K)
- Total: 1.35M IDRX
- Duration: 10 months

### Large Pool
- Size: 20 members
- Monthly: 100K IDRX
- Collateral: 2.5M IDRX (125% × 20 × 100K)
- Total: 2.6M IDRX
- Duration: 20 months

---

## 🔧 Developer Tools

### Useful Browser Extensions
- **MetaMask**: Wallet
- **React DevTools**: Debug components
- **Redux DevTools**: State inspection

### Useful Commands

```bash
# Start dev server
npm run dev

# Check for TypeScript errors
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```

### View Transaction on BaseScan

After any transaction:
1. Copy transaction hash from MetaMask
2. Visit: https://sepolia.basescan.org/tx/[hash]
3. Check status, gas used, logs

---

## 📝 Reporting Issues

When reporting bugs, include:
1. Page URL
2. Connected wallet address
3. Transaction hash (if applicable)
4. Error message screenshot
5. Browser console logs
6. Steps to reproduce

---

## 🎯 Success Criteria

Frontend integration is successful if:
- ✅ All pages load without errors
- ✅ Wallet connects on Base Sepolia
- ✅ Can claim IDRX from faucet
- ✅ Can create pools with correct collateral
- ✅ Can join pools
- ✅ Transactions confirm on-chain
- ✅ UI updates after transactions
- ✅ No console errors
- ✅ Responsive on mobile

---

**Last Updated**: January 20, 2026
**Testnet**: Base Sepolia (Chain ID: 84532)
**Contracts**: See [TESTNET_DEPLOYMENT.md](TESTNET_DEPLOYMENT.md)
