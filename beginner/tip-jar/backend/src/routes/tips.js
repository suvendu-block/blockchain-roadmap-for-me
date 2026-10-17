import { Router } from "express";
import mongoose from "mongoose";
import { TIP_ABI } from "../abi.js";
import { Tip } from "../models/Tip.js";
import { Withdrawal } from "../models/Withdrawal.js";
import {
  fetchOnChainStats,
  getChainStatus,
  verifyTipTx,
} from "../services/chain.js";

export const apiRouter = Router();

const TX_HASH_RE = /^0x[0-9a-fA-F]{64}$/;

/** GET /api/health — liveness + Mongo connection state */
apiRouter.get("/health", (_req, res) => {
  res.json({
    ok: true,
    mongo: mongoose.connection.readyState === 1,
    ...getChainStatus(),
  });
});

/** GET /api/config — everything the frontend needs to talk to the contract */
apiRouter.get("/config", (_req, res) => {
  const status = getChainStatus();
  res.json({
    contractAddress: status.contractAddress,
    abi: TIP_ABI,
    chainId: status.chainId,
    rpcUrl: status.rpcUrl,
    ready: status.ready,
  });
});

/** GET /api/tips?limit=50&from=0x... — the tip feed (chain data + name/message) */
apiRouter.get("/tips", async (req, res) => {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 200);

  const filter = {};
  if (req.query.from) {
    filter.from = String(req.query.from).toLowerCase();
  }

  const tips = await Tip.find(filter)
    .sort({ timestamp: -1, _id: -1 })
    .limit(limit)
    .lean();

  res.json({ count: tips.length, tips });
});

/** GET /api/stats — on-chain totals + Mongo leaderboard */
apiRouter.get("/stats", async (_req, res) => {
  const [mongoStats, withdrawalAgg] = await Promise.all([
    Tip.aggregate([
      {
        $group: {
          _id: "$from",
          totalWei: { $sum: { $toDecimal: "$amount" } },
          tips: { $sum: 1 },
          lastTipAt: { $max: "$timestamp" },
        },
      },
      { $sort: { totalWei: -1 } },
      { $limit: 5 },
    ]),
    Withdrawal.aggregate([
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalWei: { $sum: { $toDecimal: "$amount" } },
        },
      },
    ]),
  ]);

  let onChain = null;
  let onChainError = null;
  try {
    onChain = await fetchOnChainStats();
  } catch (err) {
    onChainError = err.message;
  }

  const withdrawalTotals = withdrawalAgg[0];

  res.json({
    onChain,
    onChainError,
    withdrawals: {
      count: withdrawalTotals ? Number(withdrawalTotals.count) : 0,
      totalWei: withdrawalTotals ? withdrawalTotals.totalWei.toString() : "0",
    },
    topTippers: mongoStats.map((row) => ({
      address: row._id,
      totalWei: row.totalWei.toString(),
      tips: row.tips,
      lastTipAt: row.lastTipAt,
    })),
  });
});

/** GET /api/withdrawals?limit=20 — sweeps mirrored from Withdrawn events (owner dashboard) */
apiRouter.get("/withdrawals", async (req, res) => {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);

  const withdrawals = await Withdrawal.find()
    .sort({ timestamp: -1, _id: -1 })
    .limit(limit)
    .lean();

  res.json({ count: withdrawals.length, withdrawals });
});

/**
 * POST /api/tips — attach a name/message to a confirmed on-chain tip.
 * Body: { txHash, name?, message? }
 * The tx is re-verified against the chain before anything is stored.
 */
apiRouter.post("/tips", async (req, res) => {
  const { txHash } = req.body ?? {};

  if (typeof txHash !== "string" || !TX_HASH_RE.test(txHash)) {
    return res.status(400).json({ error: "A valid txHash is required" });
  }

  const name =
    typeof req.body.name === "string" && req.body.name.trim()
      ? req.body.name.trim().slice(0, 40)
      : "Anonymous";
  const message =
    typeof req.body.message === "string" ? req.body.message.trim().slice(0, 280) : "";

  let onChainTip;
  try {
    onChainTip = await verifyTipTx(txHash.toLowerCase());
  } catch (err) {
    return res.status(err.statusCode ?? 500).json({ error: err.message });
  }

  if (!onChainTip) {
    return res
      .status(400)
      .json({ error: "Transaction not found, failed, or not a tip to this jar" });
  }

  const tip = await Tip.findOneAndUpdate(
    { txHash: txHash.toLowerCase() },
    {
      $set: { ...onChainTip, verified: true, name, message },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({ tip });
});
