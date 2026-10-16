# Tip Jar 🏺

A beginner-friendly **MERN + Solidity** dApp: drop ETH tips from your wallet on a local
Hardhat chain, leave a name & note in the ledger, and watch the jar fill up.

```
React (Vite) ──▶ Express API ──▶ MongoDB        (names, notes, leaderboard)
     │                 │
     │                 └──────▶ Hardhat node    (reads stats, indexes Tipped events)
     └────── MetaMask ────────▶ Tip.sol contract (holds the ETH)
```

## What's inside

| Path                  | Stack              | Job                                                            |
| --------------------- | ------------------ | -------------------------------------------------------------- |
| `backend/contract/`   | Solidity 0.8.34    | `Tip.sol` — tip(), owner-only withdraw(), Tipped/Withdrawn events |
| `backend/tests/`      | Mocha + ethers     | 11 unit tests for the contract                                 |
| `backend/scripts/`    | Hardhat + ethers   | deploy + a CLI script that sends a test tip                    |
| `backend/src/`        | Express + mongoose | REST API: verifies txs, stores notes, mirrors chain events     |
| `frontend/`           | React + Vite       | Wallet UI, tip form, jar balance, ledger feed                  |

## Prerequisites

- **Node.js 20+**
- **MongoDB** running locally on `mongodb://127.0.0.1:27017`
  (Windows: `winget install MongoDB.Server`)
- **MetaMask** in your browser

## Run it (4 steps)

Open four terminals in the project folders:

```bash
# 1. local chain (keeps running, prints 20 funded accounts)
cd backend
npm run chain

# 2. deploy the contract -> writes deployments/31337.json
cd backend
npm run deploy:local

# 3. API on http://localhost:5000 (auto-detects the deployment)
cd backend
npm run dev

# 4. React app on http://localhost:5173 (proxies /api to :5000)
cd frontend
npm run dev
```

Then open **http://localhost:5173**, hit **connect wallet**, and tip.

> Contract tests: `cd backend && npm test`
> Send a tip without MetaMask: `cd backend && node scripts/send-test-tip.js "0.05" "Ada" "hi"`

## MetaMask on the local chain

1. **Add the network** — the UI's *switch network* button does it for you:
   - RPC: `http://127.0.0.1:8545`, chain ID: `31337`, currency: `ETH`
2. **Import a funded account** — copy any private key printed by `npm run chain`
   (Hardhat account #0 is the contract *owner* and can withdraw).

⚠️ Never send real funds to these accounts — the keys are public test keys.

## API

| Method | Route             | Purpose                                                             |
| ------ | ----------------- | ------------------------------------------------------------------- |
| GET    | `/api/health`     | server + Mongo + chain status                                       |
| GET    | `/api/config`     | contract address, ABI, chain id — what the frontend needs           |
| GET    | `/api/tips`       | tip feed (`?limit=&from=`)                                          |
| GET    | `/api/stats`      | on-chain totals + top tippers (MongoDB aggregation)                 |
| POST   | `/api/tips`       | `{ txHash, name?, message? }` — **re-verifies the tx on-chain first** |

The server also polls `Tipped` events every 5s and mirrors them into MongoDB
(`src/services/chain.js`), so the feed fills even without the POST.

## How a tip flows

1. `TipForm` → `contract.tip({ value })` signed in MetaMask
2. Frontend waits for the receipt, then `POST /api/tips` with the `txHash`
3. Express fetches the receipt from the chain, confirms a `Tipped` event, stores
   `{ from, amount, timestamp }` + your `name`/`message`
4. `GET /api/stats` + `GET /api/tips` render the jar balance and the ledger

The owner can **sweep the jar** from the UI (`withdraw()` in the contract).

## Configuration

Copy `backend/.env.example` to `backend/.env` to override defaults:

```ini
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/tipjar
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337
CONTRACT_ADDRESS=        # empty = auto-detect deployments/<chainId>.json
```

## Notes & gotchas

- `hardhat.config.ts` points `paths.sources` at `contract/` (singular) since that's
  where `Tip.sol` lives.
- Amounts are stored in Mongo as **wei strings** — never `Number`, ETH can exceed 2^53.
- Restarting `npm run chain` resets the chain: re-run `npm run deploy:local` and
  restart the API (stale tips from an old chain stay in Mongo — clear the `tips`
  collection if you want a blank ledger).
