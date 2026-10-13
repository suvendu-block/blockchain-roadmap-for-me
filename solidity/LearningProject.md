# Solidity Full-Stack Learning Projects

Build 15 full-stack projects, 5 per level. Use this stack across all projects:

- Solidity 0.8.36 + Foundry
- Next.js + TypeScript
- `wagmi` + `viem`
- Sepolia testnet
- Vercel for frontend deployment

Each project should include tests, a README, and a live deployment link.

## Beginner

### 1. Crowdfunding dApp

- Contract: campaigns, contributions, withdraw if the goal is met, refund if not, deadlines
- Frontend: campaign list and detail pages, progress bar, contribute and refund buttons

### 2. Voting dApp

- Contract: admin creates a proposal, one vote per address, enum states (`open` or `closed`), winner calculation
- Frontend: proposal page, live vote counts, admin panel

### 3. Tip Jar (“Buy Me a Coffee”)

- Contract: accept ETH with a message, store tips in a struct array, owner withdrawal, events
- Frontend: tip form, recent tips feed, owner dashboard

### 4. Time-Locked Savings Vault

- Contract: deposit ETH with a lock period, early-withdrawal penalty, per-user balances
- Frontend: create-vault form, countdown timer, withdraw button

### 5. On-Chain To-Do / Guestbook

- Contract: add, complete, and delete entries per user using structs and mappings, with events
- Frontend: task list UI that updates from emitted events

## Intermediate

### 6. NFT Marketplace

- Contract: ERC-721 mint with a Merkle allowlist, list, buy, and cancel, ERC-2981 royalties, protocol fee
- Frontend: mint page, gallery with IPFS images, “My NFTs,” approve-then-list flow

### 7. Token + Vesting + Staking Dashboard

- Contract: ERC-20, vesting schedules, staking with a reward-per-token model
- Frontend: stake and unstake, claimable rewards display, vesting timeline

### 8. Freelance Escrow

- Contract: client funds a job, freelancer submits work, milestone release, arbiter handles disputes, pull payments
- Frontend: job board, job status tracker, role-based actions for client, freelancer, and arbiter

### 9. Multisig Wallet

- Contract: N-of-M owners, submit, confirm, and execute transactions, safe call handling
- Frontend: pending transactions list, approval buttons, owner management

### 10. Raffle with Chainlink VRF

- Contract: ticket purchase, automated draw using Chainlink VRF and Automation, prize payout
- Frontend: current pot, ticket purchase, past winners list

## Advanced

### 11. Mini AMM DEX (Uniswap V2-style)

- Contract: factory, pair, router, constant-product swaps, LP tokens, fees, slippage protection
- Frontend: swap page, add and remove liquidity, pool stats and price chart via a subgraph
- Tests: invariant `x * y >= k`, fuzz the swap math

### 12. Lending Protocol

- Contract: supply and borrow, collateral ratio, interest accrual, liquidations, Chainlink feeds with stale-price checks, UUPS upgrades
- Frontend: dashboard with health factor and APY, liquidation page
- Tests: invariant tests, fork tests, oracle manipulation scenarios

### 13. Overcollateralized Stablecoin

- Contract: mint and burn against collateral, health factor, liquidation, oracle integration, pause switch
- Frontend: mint and redeem flows, collateral position view, liquidation alerts
- Tests: invariant that the system is always overcollateralized

### 14. ERC-4626 Yield Vault

- Contract: deposit into vault shares, a strategy that earns yield, fee on profit, rounding handled in the vault’s favor
- Frontend: deposit and withdraw, share price chart, APY display
- Tests: inflation attack test, fuzz share math

### 15. ERC-4337 Smart Wallet

- Contract: account contract, signature validation, paymaster for gas sponsorship, social recovery
- Frontend: wallet creation, send a transaction without the user paying gas, recovery flow
- Tests: signature replay, validation edge cases