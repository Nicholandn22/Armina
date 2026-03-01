# Armina Deployment Guide

Complete step-by-step guide untuk deploy Armina ke Base Sepolia Testnet dan Base Mainnet.

---

## 📋 Prerequisites

### 1. Install Dependencies
```bash
npm install
```

### 2. Required Accounts & Keys

#### A. Wallet Setup
- Buat wallet baru atau gunakan existing wallet
- **PENTING:** Simpan private key dengan aman
- **JANGAN** commit private key ke git

#### B. Get Testnet ETH (Base Sepolia)
1. Visit Base Sepolia Faucet: https://www.alchemy.com/faucets/base-sepolia
2. Atau bridge dari Ethereum Sepolia: https://bridge.base.org/deposit

#### C. Get API Keys
1. **Basescan API Key:**
   - Register di https://basescan.org/register
   - Create API key di dashboard
   - Needed untuk contract verification

2. **Chainlink VRF Subscription:**
   - Visit https://vrf.chain.link/
   - Connect wallet
   - Create new subscription
   - Fund subscription dengan LINK tokens
   - Save subscription ID

3. **Privy App ID** (untuk frontend):
   - Register di https://privy.io
   - Create new app
   - Save App ID

4. **WalletConnect Project ID:**
   - Register di https://cloud.walletconnect.com/
   - Create new project
   - Save Project ID

---

## ⚙️ Configuration

### 1. Setup Environment Variables
```bash
cp .env.example .env
```

### 2. Edit `.env` file:
```env
# Your wallet private key (KEEP SECRET!)
PRIVATE_KEY=your_private_key_here

# RPC URLs (default sudah OK)
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_MAINNET_RPC_URL=https://mainnet.base.org

# Basescan API Key
BASESCAN_API_KEY=your_basescan_api_key

# Chainlink VRF Configuration (Base Sepolia)
VRF_COORDINATOR_SEPOLIA=0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE
VRF_KEY_HASH_SEPOLIA=0xc799bd1e3bd4d1a41cd4968997a4e03dfd2a3c7c04b695881138580163f42887
VRF_SUBSCRIPTION_ID=your_subscription_id

# Frontend
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
```

---

## 🚀 Deployment Steps

### Phase 1: Deploy IDRX Token

#### Step 1: Compile Contracts
```bash
npm run compile
```

Expected output:
```
Compiled 2 Solidity files successfully
```

#### Step 2: Deploy IDRX Token
```bash
npm run deploy:idrx
```

Expected output:
```
Deploying IDRX Mock Token...

Deploying with account: 0x...
Account balance: 1000000000000000000

✅ IDRX Token deployed to: 0x...
Initial supply: 1000000000 IDRX
Deployer balance: 1000000000 IDRX

📌 Next Steps:
==============
1. Update .env file:
   IDRX_TOKEN_ADDRESS=0x...
   NEXT_PUBLIC_IDRX_TOKEN_ADDRESS=0x...
```

#### Step 3: Update `.env`
Copy alamat IDRX token yang baru di-deploy ke `.env`:
```env
IDRX_TOKEN_ADDRESS=0x... # paste address dari step 2
NEXT_PUBLIC_IDRX_TOKEN_ADDRESS=0x... # same address
```

#### Step 4: Verify IDRX on Basescan
```bash
npx hardhat verify --network baseSepolia <IDRX_ADDRESS> "1000000000000000000000000000"
```

---

### Phase 2: Setup Chainlink VRF

#### Step 1: Create VRF Subscription
1. Visit https://vrf.chain.link/base-sepolia
2. Click "Create Subscription"
3. Sign transaction
4. Copy Subscription ID
5. Update `.env`:
   ```env
   VRF_SUBSCRIPTION_ID=your_subscription_id_here
   ```

#### Step 2: Fund Subscription
1. Click "Actions" → "Fund subscription"
2. Enter amount (minimum 2 LINK recommended)
3. Approve & fund
4. Wait for confirmation

---

### Phase 3: Deploy ArminaPool Contract

#### Step 1: Verify Configuration
Check `.env` has all required values:
```bash
cat .env | grep -E '(IDRX_TOKEN_ADDRESS|VRF_SUBSCRIPTION_ID|BASESCAN_API_KEY)'
```

#### Step 2: Deploy ArminaPool
```bash
npm run deploy:pool
```

Expected output:
```
Starting Armina Pool deployment...

Deploying contracts with account: 0x...
Account balance: 800000000000000000

Deployment Configuration:
------------------------
IDRX Token Address: 0x...
VRF Coordinator: 0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE
VRF Subscription ID: 123
VRF Key Hash: 0xc799...

📝 Deploying ArminaPool contract...

✅ ArminaPool deployed to: 0x...

📋 Deployment Summary:
======================
{
  "network": "baseSepolia",
  "chainId": 84532,
  "deployer": "0x...",
  "contracts": {
    "arminaPool": "0x...",
    "idrxToken": "0x...",
    "vrfCoordinator": "0x..."
  }
}

📌 Next Steps:
==============
1. Add ArminaPool contract as VRF consumer
2. Update .env file
3. Verify contract on Basescan
4. Test the deployment
```

#### Step 3: Add VRF Consumer
1. Go back to https://vrf.chain.link/base-sepolia
2. Select your subscription
3. Click "Add consumer"
4. Paste ArminaPool contract address
5. Sign transaction
6. Wait for confirmation

#### Step 4: Update `.env`
```env
NEXT_PUBLIC_ARMINA_POOL_ADDRESS=0x... # ArminaPool address
```

#### Step 5: Verify Contract
```bash
npx hardhat verify --network baseSepolia \
  <ARMINA_POOL_ADDRESS> \
  "<IDRX_TOKEN_ADDRESS>" \
  "0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE" \
  "<VRF_SUBSCRIPTION_ID>" \
  "0xc799bd1e3bd4d1a41cd4968997a4e03dfd2a3c7c04b695881138580163f42887"
```

Expected output:
```
Successfully verified contract ArminaPool on Basescan.
https://sepolia.basescan.org/address/0x...#code
```

---

### Phase 4: Test Deployment

#### Create test script:
```bash
cat > scripts/test-pool.ts << 'EOF'
import { ethers } from "hardhat";

async function main() {
  const poolAddress = process.env.NEXT_PUBLIC_ARMINA_POOL_ADDRESS || "";
  const pool = await ethers.getContractAt("ArminaPool", poolAddress);

  console.log("Testing ArminaPool at:", poolAddress);

  // Get pool counter
  const counter = await pool.poolCounter();
  console.log("Current pool count:", counter.toString());

  // Create test pool
  console.log("\nCreating test pool...");
  const monthlyAmount = ethers.parseUnits("500000", 2); // 500K IDRX in cents
  const poolSize = 10;

  const tx = await pool.createPool(monthlyAmount, poolSize);
  const receipt = await tx.wait();

  console.log("✅ Pool created! TX:", receipt?.hash);
  console.log("New pool count:", (await pool.poolCounter()).toString());
}

main().catch(console.error);
EOF

npx hardhat run scripts/test-pool.ts --network baseSepolia
```

---

## 🌐 Frontend Deployment

### 1. Update Contract ABIs
```bash
# Copy ABIs to frontend
cp artifacts/contracts/ArminaPool.sol/ArminaPool.json src/abis/
cp artifacts/contracts/IDRX.sol/IDRX.json src/abis/
```

### 2. Verify `.env` for Frontend
```env
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_ARMINA_POOL_ADDRESS=0x...
NEXT_PUBLIC_IDRX_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_PRIVY_APP_ID=...
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
```

### 3. Build & Test Locally
```bash
npm run build
npm run dev
```

Visit http://localhost:3000 and test:
- Connect wallet
- Create pool
- Join pool (need IDRX tokens)

### 4. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
vercel env add NEXT_PUBLIC_ARMINA_POOL_ADDRESS
vercel env add NEXT_PUBLIC_IDRX_TOKEN_ADDRESS
# ... add all NEXT_PUBLIC_ variables

# Deploy to production
vercel --prod
```

---

## 🧪 Testing Guide

### 1. Get Test IDRX Tokens
```bash
# Call faucet function
cast send <IDRX_ADDRESS> \
  "faucet()" \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY
```

Or via web interface in your app.

### 2. Test User Flow

#### A. Create Pool
1. Connect wallet
2. Go to "Create Pool"
3. Select pool size (10)
4. Set monthly amount (500K IDRX)
5. Click "Create Pool"
6. Approve transaction

#### B. Join Pool
1. Go to pool details page
2. Click "Join Pool"
3. Approve IDRX spending
4. Approve join transaction
5. Wait for confirmation

#### C. Test Monthly Payment
*Wait for pool to fill and start*

```bash
# Simulate monthly payment (call from contract owner)
cast send <ARMINA_POOL_ADDRESS> \
  "processMonthlyPayment(uint256,uint8)" \
  1 2 \ # poolId, month
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY
```

#### D. Test Winner Drawing
```bash
# Request random number
cast send <ARMINA_POOL_ADDRESS> \
  "requestWinnerDraw(uint256)" \
  1 \ # poolId
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY

# Wait for Chainlink VRF to fulfill
# Check winner in pool details
```

---

## 📊 Monitoring

### Check Contract on Basescan
https://sepolia.basescan.org/address/<ARMINA_POOL_ADDRESS>

### Monitor VRF Requests
https://vrf.chain.link/base-sepolia

### Check Logs
```bash
# Get pool details
cast call <ARMINA_POOL_ADDRESS> \
  "getPoolDetails(uint256)" \
  1 \
  --rpc-url https://sepolia.base.org

# Get participant details
cast call <ARMINA_POOL_ADDRESS> \
  "getParticipantDetails(uint256,address)" \
  1 <USER_ADDRESS> \
  --rpc-url https://sepolia.base.org
```

---

## 🔒 Security Checklist

Before Mainnet Deployment:

- [ ] Smart contract security audit completed
- [ ] All tests passing
- [ ] Testnet testing completed (minimum 1 full pool cycle)
- [ ] Emergency pause mechanism tested
- [ ] Admin keys secured (use multisig)
- [ ] VRF subscription adequately funded
- [ ] Platform fee wallet configured
- [ ] Rate limiting implemented on frontend
- [ ] CSRF protection enabled
- [ ] Bug bounty program launched

---

## 🚨 Troubleshooting

### Issue: "Insufficient funds"
**Solution:** Get more testnet ETH from faucet

### Issue: "VRF subscription not found"
**Solution:** Create subscription dan fund dengan LINK

### Issue: "Consumer not added"
**Solution:** Add ArminaPool sebagai consumer di VRF dashboard

### Issue: "Transaction underpriced"
**Solution:** Increase gas price in transaction

### Issue: "Contract verification failed"
**Solution:**
- Check constructor arguments match deployment
- Use flattened contract if needed: `npx hardhat flatten`

---

## 📞 Support

Jika ada masalah during deployment:
1. Check deployment logs di `deployments/` folder
2. Verify all environment variables
3. Check Basescan untuk transaction status
4. Review Chainlink VRF dashboard

---

## 🎉 Deployment Complete!

Setelah semua steps selesai, Anda akan punya:
- ✅ IDRX token deployed & verified
- ✅ ArminaPool contract deployed & verified
- ✅ VRF integration configured
- ✅ Frontend deployed to Vercel
- ✅ Fully functional testnet deployment

**Next:** Test dengan real users dan prepare untuk mainnet launch! 🚀
