import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { Contract, JsonRpcProvider } from "ethers";
import { config } from "../config.js";
import { TIP_ABI } from "../abi.js";
import { Tip } from "../models/Tip.js";
import { Withdrawal } from "../models/Withdrawal.js";

let provider = null;
let contract = null;
let contractAddress = null;
let lastIndexedBlock = -1;

function deploymentsDir() {
  return path.join(process.cwd(), "deployments");
}

/**
 * Find the deployed contract address:
 * 1. CONTRACT_ADDRESS env var, if set
 * 2. otherwise the newest deployments/<chainId>.json produced by `npm run deploy:local`
 */
export async function resolveContractAddress() {
  if (config.contractAddress) {
    return config.contractAddress;
  }

  let files = [];
  try {
    files = (await readdir(deploymentsDir())).filter((f) => f.endsWith(".json"));
  } catch {
    // deployments folder does not exist yet
  }

  const preferred = `${config.chainId}.json`;
  const file = files.includes(preferred)
    ? preferred
    : files.sort().at(-1);

  if (!file) {
    return null;
  }

  const deployment = JSON.parse(await readFile(path.join(deploymentsDir(), file), "utf8"));
  return deployment.address ?? null;
}

/**
 * Initialise the RPC provider and contract handle.
 * Fails soft: if the node or a deployment is missing the server still starts,
 * and chain-dependent endpoints answer with a clear error instead.
 */
export async function initChain() {
  provider = new JsonRpcProvider(config.rpcUrl);
  contractAddress = await resolveContractAddress();

  if (!contractAddress) {
    console.warn(
      "[chain] No contract address found. Run `npm run deploy:local` or set CONTRACT_ADDRESS in .env"
    );
    return;
  }

  contract = new Contract(contractAddress, TIP_ABI, provider);
  console.log(`[chain] Tip contract at ${contractAddress} (RPC ${config.rpcUrl})`);
}

export function getChain() {
  if (!provider || !contract || !contractAddress) {
    const err = new Error(
      "Chain is not available. Is the Hardhat node running and the contract deployed?"
    );
    err.statusCode = 503;
    throw err;
  }
  return { provider, contract, contractAddress };
}

export function getChainStatus() {
  return {
    ready: Boolean(contract),
    rpcUrl: config.rpcUrl,
    chainId: config.chainId,
    contractAddress,
  };
}

/**
 * Check that a transaction is a successful tip() call to our contract.
 * Returns the on-chain data (or null when the tx is missing/invalid).
 */
export async function verifyTipTx(txHash) {
  const { provider, contract, contractAddress } = getChain();

  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt || receipt.status !== 1) {
    return null;
  }

  let tipped = null;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== contractAddress.toLowerCase()) continue;
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === "Tipped") {
        tipped = parsed;
        break;
      }
    } catch {
      // log from our contract but not a known event, ignore
    }
  }

  if (!tipped) {
    return null;
  }

  return {
    from: tipped.args.from.toLowerCase(),
    amount: tipped.args.amount.toString(),
    timestamp: new Date(Number(tipped.args.timestamp) * 1000),
    blockNumber: receipt.blockNumber,
  };
}

/** Live numbers straight from the contract. */
export async function fetchOnChainStats() {
  const { provider, contract, contractAddress } = getChain();

  const [tipCount, totalWei, owner] = await Promise.all([
    contract.getTipCount(),
    contract.getTotalTips(),
    contract.owner(),
  ]);

  // Lifetime received = sum of every tip ever (the jar balance drops after a sweep).
  let lifetimeWei = null;
  if (tipCount <= 2_000n) {
    const [, amounts] = await contract.getTips();
    lifetimeWei = amounts.reduce((sum, value) => sum + value, 0n).toString();
  }

  return {
    contractAddress,
    owner: owner.toLowerCase(),
    tipCount: Number(tipCount),
    totalWei: totalWei.toString(),
    lifetimeWei,
    balanceWei: (await provider.getBalance(contractAddress)).toString(),
    blockNumber: await provider.getBlockNumber(),
  };
}

/**
 * Poll the chain for Tipped and Withdrawn events and mirror them into MongoDB.
 * Docs created by the API keep their name/message thanks to $setOnInsert.
 */
export async function indexEvents() {
  const { provider, contract } = getChain();

  const latest = await provider.getBlockNumber();
  if (latest <= lastIndexedBlock) {
    return { indexed: 0, withdrawn: 0, latest };
  }

  const fromBlock = lastIndexedBlock + 1;
  const [tipEvents, withdrawEvents] = await Promise.all([
    contract.queryFilter(contract.filters.Tipped(), fromBlock, latest),
    contract.queryFilter(contract.filters.Withdrawn(), fromBlock, latest),
  ]);

  for (const ev of tipEvents) {
    await Tip.updateOne(
      { txHash: ev.transactionHash.toLowerCase() },
      {
        $setOnInsert: {
          from: ev.args.from.toLowerCase(),
          amount: ev.args.amount.toString(),
          timestamp: new Date(Number(ev.args.timestamp) * 1000),
          blockNumber: ev.blockNumber,
        },
        $set: { verified: true },
      },
      { upsert: true }
    );
  }

  for (const ev of withdrawEvents) {
    // Withdrawn carries no timestamp — take it from the block.
    const block = await ev.getBlock();
    await Withdrawal.updateOne(
      { txHash: ev.transactionHash.toLowerCase() },
      {
        $setOnInsert: {
          to: ev.args.to.toLowerCase(),
          amount: ev.args.amount.toString(),
          timestamp: new Date(Number(block.timestamp) * 1000),
          blockNumber: ev.blockNumber,
        },
      },
      { upsert: true }
    );
  }

  lastIndexedBlock = latest;
  return { indexed: tipEvents.length, withdrawn: withdrawEvents.length, latest };
}

/** Start polling for on-chain tips in the background. */
export function startIndexer() {
  const tick = async () => {
    if (!contract) return;
    try {
      const { indexed, withdrawn } = await indexEvents();
      if (indexed > 0 || withdrawn > 0) {
        console.log(`[indexer] mirrored ${indexed} tip(s) and ${withdrawn} withdrawal(s) into MongoDB`);
      }
    } catch (err) {
      console.warn(`[indexer] ${err.message}`);
    }
  };

  tick();
  const timer = setInterval(tick, config.indexIntervalMs);
  timer.unref?.();
  return timer;
}
