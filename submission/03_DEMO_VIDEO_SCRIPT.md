# ARMINA — DEMO VIDEO SCRIPT
## Chainlink Track | Base Around the World Hackathon 2025

**Total Duration:** 4-5 minutes
**Format:** Screen recording with voiceover narration
**Language:** English (with Indonesian app shown in bilingual mode)
**Tools:** OBS Studio / Loom / QuickTime for recording, any TTS or real voice for narration

---

## PRE-RECORDING CHECKLIST

Before recording, prepare:
- [ ] Browser open at https://armina-finance.vercel.app
- [ ] Wallet connected with IDRX balance (claim from faucet first)
- [ ] At least 1 open pool and 1 active pool visible
- [ ] Reputation NFT minted
- [ ] Screen resolution: 1920×1080 or 1280×720
- [ ] Close all other browser tabs (clean recording)
- [ ] Disable notifications

---

## SCENE 1: INTRODUCTION (0:00 - 0:30)

**Screen:** Show the Armina homepage hero section with animated gradient background and glowing logo.

**VOICEOVER:**

> "Imagine a savings system used by over a hundred million Indonesians every single day — where friends contribute money monthly, and each month one person takes the full pot home. It's called Arisan, and it runs entirely on trust.
>
> But trust breaks. People default. Funds sit idle. Records are just WhatsApp screenshots.
>
> This is Armina — Arisan reimagined on-chain, powered by five Chainlink products working together as a unified Runtime Environment."

**ACTION:** Slowly scroll the homepage to show the hero text, stats bar (Total Prizes, TVL, Active Pools, Unique Savers), and the animated glow effect.

---

## SCENE 2: ONBOARDING — HOW IT WORKS (0:30 - 1:10)

**Screen:** Click "Learn More" button on the homepage to trigger the onboarding slides modal.

**VOICEOVER:**

> "Let me show you how Armina works. Click 'Learn More' and you'll see the full onboarding experience."

**ACTION:** Click through all 6 onboarding slides slowly.

**Slide 1 (Welcome):**
> "Armina brings Indonesia's traditional rotating savings on-chain — with smart contract enforcement, AI-powered yield, and Chainlink-secured randomness."

**Slide 2 (How It Works):**
> "The flow is simple. Choose a pool. Deposit one hundred and twenty-five percent collateral as commitment. Pay monthly contributions. On drawing day, Chainlink VRF selects a provably fair winner. When the pool completes, you get your collateral back — plus yield."

**Slide 3 (Collateral):**
> "The one-twenty-five percent collateral rule eliminates default risk entirely. If you miss a payment, it's auto-deducted from your collateral with a ten percent penalty. This is enforced by smart contracts — no social pressure needed."

**Slide 4 (Double Yield):**
> "Here's the magic — your collateral doesn't sit idle. Our AI Yield Optimizer deploys it to the highest-yielding DeFi protocol on Base. We're talking Morpho at fourteen percent, Moonwell at twelve-point-five percent, Aave, Compound, and Seamless. You earn yield while you save."

**Slide 5 (Reputation):**
> "And we have a Soulbound Reputation NFT. Pay on time, your score goes up. Complete pools, it goes up more. Reach Diamond level and you get a twenty-five percent discount on collateral for your next pool. It's an on-chain credit score that rewards responsible participation."

**Slide 6 (Ready):**
> "Let's see it in action."

**ACTION:** Close the modal.

---

## SCENE 3: CONNECT WALLET & FAUCET (1:10 - 1:40)

**Screen:** Click the Connect button in the header.

**VOICEOVER:**

> "First, let's connect. Armina uses Privy for authentication — you can log in with email, Google, or any wallet. No browser extensions required. This works on mobile too."

**ACTION:** Show the Privy login modal briefly. If already connected, show the wallet address and balance display in the header.

> "Once connected, you can see your ETH and IDRX balance right in the header. IDRX is our Indonesian Rupiah-pegged stablecoin with two decimal places."

**ACTION:** Navigate to `/faucet`.

> "For testnet, we have an unlimited faucet. Five hundred thousand IDRX per claim, no cooldown, no limits. Let me claim some tokens."

**ACTION:** Click "Claim 500,000 IDRX" button. Show the transaction confirming and balance updating.

> "Transaction confirmed. Balance updated instantly. Notice the 'No limit, no cooldown' messaging — judges and testers can claim as many times as needed."

---

## SCENE 4: BROWSE & JOIN POOLS (1:40 - 2:30)

**Screen:** Navigate to `/pool`.

**VOICEOVER:**

> "Now let's browse the arisan pools. This page shows three tabs — Open pools accepting members, Active pools currently running, and Completed pools."

**ACTION:** Show the Open tab with pool cards.

> "Each pool card shows the tier, monthly contribution, how many participants have joined, and the total cost to join. See the green badge? That means my wallet has enough IDRX to join. If not, it shows a red badge with the shortfall amount."

**ACTION:** Click on a pool card to open the join modal.

> "The join modal gives a complete cost breakdown — first month's contribution plus the one-twenty-five percent collateral deposit. The collateral amount is dynamically calculated using Chainlink Data Feeds. If the ETH/USD price feed is fresh, it's one-twenty-five percent. If the oracle goes stale — meaning it hasn't updated in over an hour — the collateral automatically increases to one-fifty percent as a safety buffer. This is real-time risk management powered by Chainlink."

**ACTION:** Click on a pool to navigate to `/pools/[id]` for the detail view.

> "On the pool detail page, you can see projected earnings. Your collateral yield is calculated from live APY data — currently showing rates from the AI Yield Optimizer. The 'If You Win' card shows the full pot you'd receive."

**ACTION:** Scroll to show the VRF Winner Draw section (if active pool) and the participant list.

> "Notice the Chainlink VRF section — this is where the pool creator triggers the monthly winner draw. The draw uses VRF V two-point-five for provably fair randomness. No one — not even us — can predict or manipulate who wins."

---

## SCENE 5: AI YIELD OPTIMIZER (2:30 - 3:15)

**Screen:** Navigate to `/optimizer`.

**VOICEOVER:**

> "This is the AI Yield Optimizer — the brain behind Armina's yield generation."

**ACTION:** Show the hero section with "AI Agent Active" indicator and the recommended protocol.

> "At the top, you see the AI Agent is active, showing the currently recommended protocol and its live APY. This data comes from DeFiLlama via Chainlink Functions — fetched by the decentralized oracle network and delivered on-chain."

**ACTION:** Scroll to the Live Protocol Rankings panel on the right.

> "The Live Protocol Rankings pull data directly from DeFiLlama's API, showing real-time APY across all Base stablecoin pools. The number one pick gets the 'AI Pick' badge — this is where your collateral is deployed."

**ACTION:** Point to the On-Chain Optimizer section showing 5 protocols.

> "Below that, the on-chain optimizer shows all five supported protocols — Moonwell, Aave V three, Compound V three, Morpho, and Seamless — with their deposited amounts and APY rates. These are read directly from the ArminaYieldOptimizer smart contract on Base Sepolia."

**ACTION:** Scroll to the "How It Works" section.

> "The monthly timeline shows the flow. Days one through ten: participants pay contributions. Days eleven through nineteen: funds are deployed earning yield. Day twenty: Chainlink Automation triggers the monthly cycle — Functions refreshes APY, optimizer harvests yield, and VRF draws the winner. All automated. All on-chain."

**ACTION:** Show the fee structure briefly.

> "And the fee structure is transparent: zero management fee, zero withdrawal fee, only a ten percent performance fee on yield — never on principal."

---

## SCENE 6: CHAINLINK CRE DASHBOARD (3:15 - 4:00)

**Screen:** Navigate to `/chainlink`.

**VOICEOVER:**

> "Now for the technical centerpiece — the Chainlink Integration Dashboard. This page showcases all five Chainlink products working together as a Chainlink Runtime Environment."

**ACTION:** Show the hero with "5 Products" and total automated draws counter.

> "Five Chainlink products. All active. All orchestrated in a single monthly cycle."

**ACTION:** Scroll through each product card, pausing on each one.

> "**VRF V two-point-five** — provably fair random winner selection. You can see the coordinator address, subscription ID, and callback gas limit. Every draw request goes through Chainlink's verifiable random function.
>
> **Chainlink Automation** — the keeper network monitors all active pools and triggers the monthly cycle when the interval elapses. Check upkeep, perform upkeep — fully autonomous.
>
> **Data Feeds** — the ETH/USD price oracle. This enforces dynamic collateral. When the price feed is fresh, collateral is one-twenty-five percent. When it's stale, it automatically increases to one-fifty percent. Real-time risk management.
>
> **Chainlink Functions** — this is where DeFiLlama APY data enters the blockchain. The DON executes JavaScript off-chain, fetches live yield data, and delivers the best protocol and APY on-chain. When rates change by more than one percent, it auto-triggers a rebalance.
>
> **CCIP** — Cross-Chain Interoperability Protocol. Users on Ethereum Sepolia can join pools on Base Sepolia via cross-chain messages. The contract validates source chains and senders through an allowlist."

**ACTION:** Scroll to the CRE Monthly Cycle workflow diagram.

> "And here's how it all comes together. Automation triggers the cycle. Functions refreshes APY. Data Feeds enforces collateral. VRF selects the winner. CCIP enables cross-chain access. Five products. One unified flow. This is what a Chainlink Runtime Environment looks like in production."

---

## SCENE 7: REPUTATION & PROFILE (4:00 - 4:25)

**Screen:** Navigate to `/peringkat` (Ranking page).

**VOICEOVER:**

> "The reputation system is built on Soulbound NFTs — non-transferable ERC-seven-twenty-one tokens that represent your on-chain credit score."

**ACTION:** Show the score system tab with levels and benefits.

> "Four levels: Bronze, Silver, Gold, Diamond. Each level unlocks collateral discounts — up to twenty-five percent for Diamond members. You earn points for on-time payments and completing pools. You lose points for late payments and defaults. The score is permanent and non-transferable — you can't buy a good reputation."

**ACTION:** Navigate to `/profil` briefly.

> "The profile page shows your complete financial history — balances, active pools, payment history with on-time percentage, and your reputation level with progress to the next tier."

---

## SCENE 8: CLOSING (4:25 - 4:50)

**Screen:** Return to the homepage hero section.

**VOICEOVER:**

> "Armina is not just a hackathon project. It's a production-quality protocol with seven verified smart contracts, one-forty-four passing tests, a full-stack DApp with mobile support, and the deepest Chainlink integration you'll see — all five products working as a true Runtime Environment.
>
> We're solving a real problem for two hundred seventy-eight million Indonesians who use arisan every day. With Chainlink providing the trust layer, the randomness, the automation, the data, and the cross-chain access — we're bringing tradition on-chain.
>
> Armina. Rotate your savings. Earn passive yield. Powered by Chainlink."

**ACTION:** Show the live demo URL: armina-finance.vercel.app and the GitHub URL.

---

## POST-RECORDING: EDITING NOTES

### Title Card (add at beginning, 3 seconds):
```
ARMINA — Arisan on Chain
Chainlink Track Demo
Base Around the World Hackathon 2025
```

### End Card (add at end, 5 seconds):
```
ARMINA
armina-finance.vercel.app
github.com/yt2025id-lab/Armina

5 Chainlink Products · 7 Smart Contracts · 144 Tests
Built on Base · Powered by Chainlink CRE
```

### Background Music:
- Use royalty-free ambient/tech music at low volume (20-30%)
- Suggested: YouTube Audio Library → search "technology ambient"
- Keep it subtle — voiceover should be clearly audible

### Transitions:
- Use simple fade transitions between scenes (0.3s)
- No flashy animations — keep it professional
- Zoom into specific UI elements when discussing them

### Text Overlays (optional but impactful):
Add small text annotations at key moments:
- When showing VRF: `"Chainlink VRF V2.5 — Provably Fair"`
- When showing Data Feeds: `"Dynamic Collateral: 125% fresh / 150% stale"`
- When showing Functions: `"Live APY from DeFiLlama via DON"`
- When showing Automation: `"Autonomous Monthly Cycles"`
- When showing CCIP: `"Cross-Chain Pool Joining"`

---

## ALTERNATIVE: SHORT VERSION (2 minutes)

If the hackathon requires a shorter video, use this condensed script:

### Scene 1: Intro (0:00 - 0:15)
> "Armina brings Indonesia's traditional rotating savings on-chain, powered by all five Chainlink products as a Runtime Environment."

**Show:** Homepage hero + stats.

### Scene 2: The Flow (0:15 - 0:45)
> "Users join pools, lock one-twenty-five percent collateral, pay monthly, and a provably fair winner is selected via Chainlink VRF. Collateral earns yield via the AI Optimizer, which uses Chainlink Functions to fetch live DeFi rates from DeFiLlama."

**Show:** Pool list → join modal → pool detail with VRF section.

### Scene 3: Chainlink CRE (0:45 - 1:30)
> "All five Chainlink products work together. Automation triggers the monthly cycle. Functions refreshes APY data via the DON. Data Feeds enforces dynamic collateral — one-twenty-five percent when fresh, one-fifty when stale. VRF generates provably random winners. And CCIP enables cross-chain pool joining from Ethereum."

**Show:** Chainlink dashboard page, scroll through all 5 product cards + CRE workflow.

### Scene 4: Close (1:30 - 2:00)
> "Seven verified contracts. One-forty-four tests. Full-stack DApp live on Base Sepolia. The deepest Chainlink integration at this hackathon. Armina — rotate your savings, earn passive yield, powered by Chainlink CRE."

**Show:** Homepage → end card with URLs.

---

## VOICEOVER RECORDING TIPS

1. **Pace:** Speak at a natural pace, slightly slower than conversation. Aim for 130-150 words per minute.

2. **Tone:** Confident but not aggressive. You're a builder explaining your creation, not a salesperson.

3. **Emphasis:** Stress these keywords every time:
   - "Chainlink" — say it with conviction
   - "five products" — emphasize the number
   - "Runtime Environment" — technical credibility
   - "provably fair" — for VRF mentions
   - "automated" — for Automation mentions
   - "one-twenty-five / one-fifty percent" — dynamic collateral

4. **Pauses:** Add 0.5s pauses between sections and after key statements.

5. **AI Voice Option:** If you prefer AI-generated voiceover:
   - Use ElevenLabs (elevenlabs.io) — free tier gives enough minutes
   - Voice: "Adam" or "Antoni" (professional male) or "Rachel" (professional female)
   - Settings: Stability 0.5, Clarity 0.75, Style 0.3
   - Generate scene by scene, not all at once

6. **Recording Setup:**
   - Quiet room, no echo
   - Use headset mic or phone mic close to mouth
   - Record in segments matching each scene
   - Edit together in any video editor (CapCut, DaVinci Resolve, iMovie)

---

## SCREEN RECORDING TIPS

1. **Resolution:** Record at 1920×1080 (1080p) minimum
2. **Browser:** Use Chrome in clean profile (no extensions visible)
3. **Zoom:** Set browser zoom to 100% or 110% for readability
4. **Mouse:** Move mouse smoothly, don't click rapidly
5. **Loading:** Pre-load all pages before recording (cache warm-up)
6. **Wallet:** Have wallet connected and funded before starting
7. **Network:** Ensure stable internet — blockchain reads should be instant from cache

---

*Good luck with the hackathon! This demo should showcase Armina's comprehensive Chainlink integration and production quality.*
