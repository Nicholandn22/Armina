# ARMINA — PITCH DECK
## Chainlink Track | Base Around the World Hackathon 2025

> **Tagline:** On-chain rotating savings with 5 Chainlink products orchestrated as a Runtime Environment — VRF, Automation, Data Feeds, Functions, and CCIP.

---

## SLIDE 1: COVER

### ARMINA | Arisan on Chain

**Rotate Your Savings. Earn Passive Yield. Powered by Chainlink.**

- 5 Chainlink Products (VRF · Automation · Data Feeds · Functions · CCIP)
- 7 Verified Smart Contracts on Base Sepolia
- 144 Tests Passing
- Live at armina-finance.vercel.app

Built on Base · Chainlink CRE · Coinbase Smart Wallet · Privy · OnchainKit

**Visual:** Armina logo centered, Chainlink + Base logos flanking, dark gradient background with animated glow.

---

## SLIDE 2: THE PROBLEM

### Traditional Rotating Savings is Broken — 278M Indonesians Deserve Better

**What is Arisan?**
A traditional Indonesian rotating savings circle where members contribute monthly and take turns receiving the full pot. Used by tens of millions daily — from rural villages to urban offices.

**4 Critical Failures:**

| Problem | Impact |
|---------|--------|
| **Trust Failure** | One member defaults → entire pool collapses. No enforcement mechanism. |
| **Zero Yield** | Funds sit idle for months while DeFi generates 10-14% APY continuously. |
| **No Transparency** | Records managed via WhatsApp screenshots. Disputes are common. |
| **Cannot Scale** | Works only in close-knit circles of 5-10 people. Expanding = more risk. |

**The Numbers:**
- 74-80% of Indonesians are unbanked or underbanked
- 22M+ crypto users in Indonesia (fastest growing in SEA)
- $0 in existing DeFi solutions for rotating savings

**Speaker Notes:** "Arisan is not niche — it's how Indonesia saves money. But it's built on social trust that breaks at scale. We fix that with Chainlink."

---

## SLIDE 3: THE SOLUTION

### Armina — Arisan Reimagined with Chainlink CRE

On-chain rotating savings with enforced collateral, AI-powered yield, and 5 Chainlink products working as a unified Runtime Environment.

**6 Pillars:**

1. **125% Collateral** — Smart contract enforced commitment eliminates default risk entirely
2. **Chainlink VRF V2.5** — Provably fair winner selection every round (no manipulation possible)
3. **Chainlink Automation** — Autonomous monthly cycles: harvest yield → refresh APY → draw winner
4. **Chainlink Data Feeds** — Dynamic collateral: 125% when fresh, 150% when oracle stale (risk protection)
5. **Chainlink Functions** — Live DeFi APY from DeFiLlama via DON → auto-rebalance yield strategy
6. **Chainlink CCIP** — Cross-chain pool joining from Ethereum Sepolia → Base Sepolia

**Result:** Every problem solved. Trust → code. Idle funds → yield. Opaqueness → on-chain. Scaling → permissionless.

**Speaker Notes:** "We don't use Chainlink as an add-on — it IS the backbone. Every monthly cycle is orchestrated by 5 Chainlink services working together."

---

## SLIDE 4: CHAINLINK CRE — 5 PRODUCTS, 1 UNIFIED CYCLE

### How All 5 Chainlink Products Work Together

This is the core technical innovation. Every month, Chainlink orchestrates the entire pool cycle:

```
┌─────────────────────────────────────────────────────────────┐
│                 CHAINLINK RUNTIME ENVIRONMENT                │
│                                                              │
│  ┌──────────────┐                                            │
│  │  AUTOMATION   │──► Step 1: Trigger monthly cycle          │
│  │  (Keeper)     │         when interval elapses             │
│  └──────┬───────┘                                            │
│         │                                                    │
│         ├──► ┌──────────────┐                                │
│         │    │  FUNCTIONS    │──► Step 2: Fetch live APY      │
│         │    │  (DON)        │    from DeFiLlama API          │
│         │    └──────┬───────┘    via decentralized execution  │
│         │           │                                         │
│         │           └──► updateAPY() on YieldOptimizer        │
│         │           └──► auto-rebalance if delta >= 100 bps   │
│         │                                                     │
│         ├──► harvestYield() on YieldOptimizer                 │
│         │    (collect accrued DeFi yield)                     │
│         │                                                     │
│         └──► ┌──────────────┐                                │
│              │  VRF V2.5    │──► Step 3: Request random       │
│              │  (Randomness) │    number for winner selection  │
│              └──────┬───────┘                                 │
│                     │                                         │
│                     └──► fulfillRandomWords() callback        │
│                          → select winner from eligible list   │
│                          → distribute pot + yield             │
│                          → advance round / complete pool      │
│                                                               │
│  ┌──────────────┐                                            │
│  │  DATA FEEDS  │──► Always-on: getDynamicCollateralMultiplier│
│  │  (ETH/USD)   │    125% if fresh (<1hr) / 150% if stale    │
│  └──────────────┘    Called on EVERY joinPool() transaction   │
│                                                               │
│  ┌──────────────┐                                            │
│  │  CCIP        │──► Cross-chain: Ethereum Sepolia users     │
│  │  (Bridge)    │    send message → ArminaCCIP receives      │
│  └──────────────┘    → calls joinPoolFor() on ArminaPool     │
│                       with allowlist security validation      │
└─────────────────────────────────────────────────────────────┘
```

**Key Insight:** This is not 5 separate integrations — it's a CRE where each product triggers or depends on another in a single automated monthly cycle.

**Speaker Notes:** "Automation triggers Functions which updates the optimizer, then harvests yield, then calls VRF for the draw — all in one atomic monthly cycle. Data Feeds protects every join, and CCIP enables cross-chain access. This is a true Chainlink Runtime Environment."

---

## SLIDE 5: DEEP DIVE — EACH CHAINLINK PRODUCT

### Product-by-Product Technical Integration

#### 1. VRF V2.5 — Provably Fair Winner Selection
```solidity
// ArminaPool.sol — requestWinnerDraw()
function requestWinnerDraw(uint256 poolId) external {
    uint256 requestId = s_vrfCoordinator.requestRandomWords(
        VRFV2PlusClient.RandomWordsRequest({
            keyHash: keyHash,
            subId: subscriptionId,
            requestConfirmations: 3,
            callbackGasLimit: callbackGasLimit,
            numWords: 1,
            extraArgs: VRFV2PlusClient._argsToBytes(
                VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
            )
        })
    );
}

// VRF callback — winner = randomWords[0] % eligibleCount
function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
    uint256 winnerIndex = randomWords[0] % eligibleParticipants.length;
    // → distribute pot + yield to winner
}
```
- **Coordinator:** `0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE`
- **Subscription:** Funded with LINK, ArminaPool as consumer
- **Why V2.5:** Native `uint256` subscription IDs, LINK or native payment

#### 2. Automation — Autonomous Monthly Cycles
```solidity
// ArminaAutomation.sol
function checkUpkeep(bytes calldata) external view returns (bool, bytes memory) {
    // Scans all active pools for elapsed interval
}
function performUpkeep(bytes calldata performData) external {
    // Step 1: Functions.requestAPYUpdate() — refresh APY via DON
    // Step 2: YieldOptimizer.harvestYield() — collect DeFi yield
    // Step 3: ArminaPool.requestWinnerDraw() — trigger VRF draw
}
```
- **Contract:** `0x2f4298770BbAa71624154d29126BB863014Dbf41`
- **Trigger:** Custom logic, 30-day default interval
- **Orchestration:** Coordinates Functions + Optimizer + VRF in one upkeep

#### 3. Data Feeds — Dynamic Collateral Risk Management
```solidity
// ArminaPool.sol
function getDynamicCollateralMultiplier() public view returns (uint256) {
    (, , , uint256 updatedAt, ) = priceFeed.latestRoundData();
    if (block.timestamp - updatedAt > STALE_THRESHOLD) return 150; // +25% safety buffer
    return 125; // standard collateral
}
```
- **Feed:** ETH/USD `0x4aDC67D2Ff1e548cE5eBb4B89AA5B3e76509A6b5`
- **Innovation:** Automatic collateral increase when oracle is stale — protecting pools during network issues

#### 4. Functions — DeFiLlama APY Oracle via DON
```javascript
// Executed by Chainlink DON (decentralized off-chain)
const r = await Functions.makeHttpRequest({url:'https://yields.llama.fi/pools'});
const pools = r.data.data
  .filter(p => p.chain === 'Base' && p.stablecoin && p.tvlUsd > 1e5)
  .sort((a, b) => b.apy - a.apy);
// Encodes best protocol ID + APY, delivers on-chain
// Auto-triggers rebalance if APY delta >= 100 bps (1%)
```
- **Router:** `0xf9B8fc078197181C841c296C876945aaa425B278`
- **Subscription:** #577, funded with LINK
- **Auto-rebalance:** When APY changes significantly, optimizer moves funds automatically

#### 5. CCIP — Cross-Chain Pool Joining
```solidity
// ArminaCCIP.sol — receives cross-chain message
function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
    (uint256 poolId, address participant, uint256 amount) =
        abi.decode(message.data, (uint256, address, uint256));
    arminaPool.joinPoolFor(poolId, participant); // Cross-chain join!
}
```
- **Router:** `0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93`
- **Source:** Ethereum Sepolia (selector: `16015286601757825753`)
- **Security:** Allowlisted source chains + senders

**Speaker Notes:** "Each product serves a specific, critical role. VRF ensures fairness. Automation ensures reliability. Data Feeds ensure safety. Functions ensure optimal yield. CCIP ensures accessibility. Together they form a complete Runtime Environment."

---

## SLIDE 6: HOW IT WORKS — USER JOURNEY

### 5 Simple Steps, Fully Automated by Chainlink

```
Step 1: CHOOSE POOL
├── Select size (5/10/15/20 members)
├── Choose contribution (100K - 2.5M IDRX)
└── See collateral requirement (dynamic via Data Feeds)

Step 2: LOCK COLLATERAL + JOIN
├── Deposit 125% collateral (or 150% if oracle stale)
├── Reputation discount applied (up to 25% off for Diamond)
├── First monthly payment included
└── Collateral auto-deployed to best DeFi protocol by YieldOptimizer

Step 3: MONTHLY CONTRIBUTIONS
├── Pay by the 10th each month
├── Auto-deducted from collateral if wallet insufficient
├── AI Optimizer moves funds to highest APY protocol
└── Chainlink Functions refreshes live rates from DeFiLlama

Step 4: WINNER SELECTION (Automated)
├── Chainlink Automation triggers on Day 20
├── Functions refreshes APY → Optimizer harvests yield
├── VRF V2.5 generates provably random winner
└── Winner receives pot + yield (minus 10% platform fee on yield)

Step 5: COMPLETE & SETTLE
├── After all rounds complete, claim final settlement
├── Get back: collateral + yield earned - penalties
├── Reputation NFT score updated (+50 for completion)
└── Diamond members get 25% collateral discount next pool
```

**Penalty System:** 10% deducted per missed payment. Chronic defaulters get liquidated. Reputation score drops -20 per late, -100 per default.

---

## SLIDE 7: SOULBOUND REPUTATION NFT

### On-Chain Credit Score — Rewarding Responsible Participation

Non-transferable ERC721 (Soulbound) — your on-chain financial reputation.

**How Scoring Works:**

| Action | Score Change |
|--------|-------------|
| On-time payment | **+10** |
| Pool completed | **+50** |
| Late payment (1-3 days) | **-20** |
| Default | **-100** |

**Level System & Economic Benefits:**

| Level | Score Required | Collateral Discount | Color |
|-------|---------------|---------------------|-------|
| Bronze | 0 - 99 | 0% | Amber |
| Silver | 100 - 299 | 10% off | Slate |
| Gold | 300 - 499 | 20% off | Yellow |
| Diamond | 500+ | **25% off** | Cyan |

**Real Economic Impact:**
- A Diamond member joining a 10-person, 500K IDRX pool saves **1,562,500 IDRX** on collateral
- This creates a powerful incentive loop: participate responsibly → earn reputation → save money → participate more

**Contract:** `0x6a7ff47bA8633F252d28F9D6F080fd8cf50ddF6B` (Verified on BaseScan)

**Speaker Notes:** "The Soulbound NFT creates a flywheel. Good behavior reduces your cost. Lower cost attracts more participants. More participation builds a stronger protocol. And the reputation is non-transferable — you can't buy a good credit score."

---

## SLIDE 8: AI YIELD OPTIMIZER

### Idle Collateral Earns 10-14% APY Across 5 DeFi Protocols

Your collateral doesn't sit idle — it's deployed to the highest-yielding DeFi protocol on Base, automatically.

**Supported Protocols (Base Sepolia):**

| Protocol | Default APY | Status |
|----------|------------|--------|
| Morpho | 14.00% | Active (Best) |
| Moonwell | 12.50% | Active |
| Seamless | 12.00% | Active |
| Aave V3 | 11.00% | Active |
| Compound V3 | 10.50% | Active |

**How the AI Agent Works:**
1. **Chainlink Functions** fetches live APY from DeFiLlama via DON every month
2. If APY delta >= 1% (100 bps), **auto-rebalance** triggers
3. Funds move from current protocol to the new best protocol
4. Yield harvested and distributed to pool participants

**Double Yield:**
- **Collateral Yield:** Your 125% deposit earns yield the entire pool duration
- **Pot Yield:** The monthly pot contributions also earn before distribution

**Fee Structure:**
- 0% management fee
- 10% performance fee (only on yield, not principal)
- 0% withdrawal fee

**Contract:** `0x1b0007d0aACDDf08F9b32eAa431D141c33891031` (Verified on BaseScan)

**Speaker Notes:** "Traditional arisan: your money sits doing nothing. Armina: your collateral is earning 14% APY on Morpho while you wait for your turn. And Chainlink Functions ensures we're always on the best protocol."

---

## SLIDE 9: TECH STACK & ARCHITECTURE

### 7 Verified Smart Contracts, 144 Tests, Full-Stack DApp

**Smart Contracts (All Verified on Base Sepolia):**

| Contract | Address | Role |
|----------|---------|------|
| ArminaPool | `0x5DD3...30AC` | Core pool + VRF + Data Feeds |
| ArminaYieldOptimizer | `0xA29B...BC9a` | DeFi yield routing (5 protocols) |
| ArminaReputation | `0xb4D2...16de` | Soulbound ERC721 NFT |
| ArminaAutomation | `0x2f43...Db41` | Chainlink Keeper upkeep |
| ArminaFunctions | `0x3502...8193` | DeFiLlama DON oracle |
| ArminaCCIP | `0x269f...6E83` | Cross-chain receiver |
| IDRX Token | `0xd771...9eeD` | IDR-pegged stablecoin |

**Frontend:**
- Next.js 16 + TypeScript + Tailwind CSS
- Privy Auth (Email/Google/Wallet) — no browser extensions needed
- Coinbase Smart Wallet + OnchainKit
- Bilingual (English + Bahasa Indonesia)
- Mobile-first PWA with responsive design

**Testing:** 144 tests across 35 describe blocks
- ArminaPool: 60 tests (pool lifecycle, VRF, reputation, yield optimizer, E2E)
- ArminaChainlink: 39 tests (all 5 products, CRE integration)
- ArminaCCIP: 17 tests (cross-chain join, security, recovery)
- ArminaReputation: 28 tests (soulbound, scoring, levels, authorization)

**Security:**
- SafeERC20 for all token transfers
- ReentrancyGuard on all state-changing functions
- Double-claim and double-draw protection
- Dynamic collateral increase when oracle stale
- Access control: owner-only admin, contract-only cross-contract calls
- Allowlisted source chains + senders for CCIP

---

## SLIDE 10: MARKET OPPORTUNITY

### Why Indonesia? Why Arisan? Why Now?

**The Market:**
- **278M+ population** — 4th largest in the world
- **74-80% unbanked** — millions rely on informal savings systems
- **22M+ crypto users** — fastest growing in Southeast Asia
- **Arisan penetration:** Estimated 50-60% of Indonesian households participate

**Why On-Chain Arisan Wins:**
- Cultural familiarity → low education barrier (people already understand the concept)
- IDRX stablecoin → no exchange rate anxiety (1 IDRX = 1 IDR)
- Base L2 → fees under $0.01, making micro-contributions viable
- Coinbase Paymaster → gasless transactions, zero onboarding friction
- Privy → Email/Google login, no MetaMask needed

**TAM:** Indonesian informal savings market > $50B annually
**SAM:** Urban crypto-savvy users willing to try DeFi → $500M+
**SOM:** First 10,000 users × avg pool value → $1M+ TVL in year 1

---

## SLIDE 11: COMPETITIVE ADVANTAGE

### Armina vs Every Alternative

| Feature | Traditional Arisan | PoolTogether | Aave/Compound | **Armina** |
|---------|-------------------|--------------|---------------|------------|
| Cultural fit (rotating savings) | ✅ | ❌ | ❌ | ✅ |
| Yield on deposits | ❌ | ✅ | ✅ | ✅ |
| Rotating payout | ✅ | ❌ | ❌ | ✅ |
| Default protection | ❌ | N/A | N/A | ✅ (125%) |
| Fair randomness | ❌ | ✅ | N/A | ✅ (VRF) |
| Automated cycles | ❌ | ✅ | N/A | ✅ (Automation) |
| Dynamic risk management | ❌ | ❌ | ❌ | ✅ (Data Feeds) |
| Live yield optimization | ❌ | ❌ | Manual | ✅ (Functions) |
| Cross-chain access | ❌ | ❌ | ❌ | ✅ (CCIP) |
| On-chain reputation | ❌ | ❌ | ❌ | ✅ (Soulbound) |
| Mobile/email login | ❌ | ❌ | ❌ | ✅ (Privy) |

**No other project combines rotating savings + collateral + yield + 5 Chainlink products.**

---

## SLIDE 12: ROADMAP

### From Hackathon to Production

**Q1 2026 — NOW (Hackathon):**
- ✅ 7 smart contracts deployed & verified on Base Sepolia
- ✅ 5 Chainlink products integrated as CRE
- ✅ 144 tests passing across all contracts
- ✅ Full-stack DApp live at armina-finance.vercel.app
- ✅ AI Yield Optimizer with 5 DeFi protocols
- ✅ Soulbound Reputation NFT system
- ✅ Cross-chain joining via CCIP
- ✅ Bilingual UI (English + Bahasa Indonesia)

**Q2 2026 — Security & Mainnet:**
- Security audit (OpenZeppelin / Trail of Bits)
- Base Mainnet deployment
- Real DeFi protocol integrations (Moonwell, Aave V3, Morpho)
- Farcaster Frame for social pool creation

**Q3 2026 — Growth:**
- Mobile PWA with push notifications
- Multi-chain expansion (Arbitrum, Optimism via CCIP)
- Governance token launch
- Partnership with IDRX/IDR stablecoin issuers

**Q4 2026 — Scale:**
- DAO governance for protocol parameters
- 10,000+ users target
- Enterprise API for fintech integrations
- Southeast Asia expansion (Philippines, Vietnam — similar ROSCA cultures)

---

## SLIDE 13: WHY WE WIN THE CHAINLINK TRACK

### 5 Reasons Armina Deserves 1st Place

**1. Deepest Chainlink Integration**
Not 1 or 2 — ALL 5 Chainlink products working as a true CRE. Each product serves a distinct, critical function. No feature is bolt-on or cosmetic.

**2. Real-World Problem, Real Users**
278M Indonesians use arisan daily. This isn't a theoretical DeFi primitive — it's solving a real problem for real people with a cultural tradition that predates blockchain.

**3. Production Quality**
7 verified contracts, 144 tests, full-stack DApp with mobile support, bilingual UI, Coinbase Smart Wallet login. This is not a prototype — it's a deployable product.

**4. Technical Innovation**
- Dynamic collateral via Data Feeds (125%/150% based on oracle freshness)
- Functions → auto-rebalance yield across 5 DeFi protocols
- Automation orchestrates the entire monthly cycle atomically
- CCIP enables cross-chain participation
- Soulbound NFT creates economic incentives for good behavior

**5. Ecosystem Showcase**
Armina demonstrates Chainlink's power to the crypto-curious Indonesian market (22M+ users). Every pool cycle shows users what VRF, Automation, Data Feeds, Functions, and CCIP can do — turning a hackathon project into a Chainlink education tool.

---

## SLIDE 14: THANK YOU

### Let's Bring Tradition On-Chain with Chainlink

**Live Demo:** https://armina-finance.vercel.app

**GitHub:** https://github.com/yt2025id-lab/Armina

**Network:** Base Sepolia Testnet

**Chainlink Dashboard:**
- VRF: Subscription funded, ArminaPool as consumer
- Automation: "Armina Monthly Cycle" upkeep active
- Functions: Subscription #577, DeFiLlama DON
- Data Feeds: ETH/USD live on Base Sepolia
- CCIP: Ethereum Sepolia → Base Sepolia active

**The Team:**
- Building at the intersection of Indonesian culture and blockchain technology
- Passionate about financial inclusion through DeFi

---

*Armina — Rotate Your Savings. Earn Passive Yield. Powered by Chainlink CRE.*

---

## APPENDIX: GAMMA AI PROMPT

Use this prompt in https://gamma.app to auto-generate slides from this pitch deck:

```
Create a professional pitch deck for "Armina — Arisan on Chain", a decentralized rotating savings protocol on Base blockchain that uses ALL 5 Chainlink products (VRF V2.5, Automation, Data Feeds, Functions, CCIP) as a Chainlink Runtime Environment.

Design style: Dark gradient backgrounds (#0f172a to #1e2a4a), accent colors — Chainlink blue (#375BD2), Base blue (#0052FF), gold (#F59E0B). Modern, clean, crypto-native aesthetic.

14 slides:
1. Cover — "Armina | Arisan on Chain" with Chainlink + Base logos, tagline "Rotate Your Savings. Earn Passive Yield. Powered by Chainlink."
2. The Problem — Traditional rotating savings broken (trust failure, zero yield, no transparency, cannot scale). 278M Indonesians, 74-80% unbanked.
3. The Solution — 6 pillars: 125% collateral, VRF V2.5, Automation, Data Feeds, Functions, CCIP. "Every problem solved by Chainlink."
4. Chainlink CRE Architecture — Flow diagram showing all 5 products in one monthly cycle: Automation triggers Functions (APY refresh) → harvest yield → VRF (winner draw). Data Feeds on every join. CCIP for cross-chain.
5. Deep Dive 5 Products — Code snippets and details for each: VRF (fulfillRandomWords), Automation (performUpkeep), Data Feeds (getDynamicCollateralMultiplier 125%/150%), Functions (DeFiLlama DON), CCIP (ccipReceive cross-chain join).
6. User Journey — 5 steps: Choose Pool → Lock Collateral → Monthly Payments → Automated Winner Draw → Complete & Settle.
7. Soulbound Reputation NFT — Score system (+10 on-time, +50 complete, -20 late, -100 default), 4 levels (Bronze/Silver/Gold/Diamond), collateral discounts up to 25%.
8. AI Yield Optimizer — 5 DeFi protocols (Morpho 14%, Moonwell 12.5%, Seamless 12%, Aave 11%, Compound 10.5%), auto-rebalance via Chainlink Functions, double yield.
9. Tech Stack — 7 verified contracts, Next.js 16, Privy auth, Coinbase Smart Wallet, 144 tests, security features.
10. Market Opportunity — Indonesia 278M population, 74-80% unbanked, 22M crypto users, $50B+ informal savings market.
11. Competitive Advantage — Comparison table vs Traditional Arisan, PoolTogether, Aave. Armina wins on all dimensions.
12. Roadmap — Q1 (hackathon, 7 contracts, 5 Chainlink), Q2 (audit, mainnet), Q3 (mobile PWA, multi-chain via CCIP), Q4 (DAO, 10K users).
13. Why We Win Chainlink Track — 5 reasons: deepest integration (all 5 products), real-world problem, production quality, technical innovation, ecosystem showcase.
14. Thank You — Live demo link, GitHub, Chainlink dashboard links, team.

Emphasize the Chainlink CRE architecture throughout. Show that ALL 5 products work together in a unified cycle, not as separate features. Include the contract addresses and test counts to show production readiness.
```
