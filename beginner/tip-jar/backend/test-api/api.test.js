// API integration tests — run with: npm run test:api
//
// The app is started on an ephemeral port and pointed at a separate Mongo
// database (tipjar_test) so the real ledger in `tipjar` stays untouched.
// Chain-dependent assertions degrade gracefully when no Hardhat node is up.
process.env.MONGO_URI =
  process.env.TEST_MONGO_URI ?? "mongodb://127.0.0.1:27017/tipjar_test";

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

const mongoose = (await import("mongoose")).default;
const { config } = await import("../src/config.js");
const { createApp } = await import("../src/app.js");
const { TIP_ABI } = await import("../src/abi.js");
const { initChain, getChainStatus } = await import("../src/services/chain.js");
const { Tip } = await import("../src/models/Tip.js");

const HARDHAT_ACCOUNT_1 = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const TX_HASH_RE = /^0x[0-9a-fA-F]{64}$/;

let server = null;
let base = null;

async function get(path) {
  const res = await fetch(`${base}${path}`);
  return { status: res.status, body: await res.json() };
}

async function post(path, payload) {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

describe("Tip Jar API", () => {
  before(async () => {
    await mongoose.connect(config.mongoUri);
    await initChain();

    const app = createApp();
    await new Promise((resolve) => {
      server = app.listen(0, resolve);
    });
    base = `http://127.0.0.1:${server.address().port}/api`;
  });

  after(async () => {
    // Leave the test database as we found it.
    await Tip.deleteMany({ message: { $regex: /^api-test:/ } });
    await new Promise((resolve) => (server ? server.close(resolve) : resolve()));
    await mongoose.disconnect();
  });

  it("GET /health reports Mongo and chain status", async () => {
    const { status, body } = await get("/health");
    assert.equal(status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.mongo, mongoose.connection.readyState === 1);
    assert.equal(typeof body.ready, "boolean");
    assert.equal(body.chainId, config.chainId);
  });

  it("GET /config hands the frontend the ABI and chain settings", async () => {
    const { status, body } = await get("/config");
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.abi));
    assert.ok(body.abi.includes("function tip() payable"));
    assert.ok(body.abi.includes("event Tipped(address indexed from, uint256 amount, uint256 timestamp)"));
    assert.equal(body.chainId, config.chainId);
    assert.equal(typeof body.ready, "boolean");
    // null until `npm run deploy:local` has produced a deployment file
    if (body.contractAddress !== null) {
      assert.match(body.contractAddress, /^0x[0-9a-fA-F]{40}$/);
    }
  });

  it("GET /tips returns a feed capped by ?limit", async () => {
    const { status, body } = await get("/tips?limit=5");
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.tips));
    assert.ok(body.count <= 5);
    for (const tip of body.tips) {
      assert.match(tip.txHash, TX_HASH_RE);
      assert.match(tip.from, /^0x[0-9a-f]{40}$/);
      assert.equal(typeof tip.amount, "string"); // wei stays a string
    }
  });

  it("GET /tips ignores a nonsense filter instead of failing", async () => {
    const { status, body } = await get("/tips?limit=abc&from=0xnotanaddress");
    assert.equal(status, 200);
    assert.equal(body.count, 0);
  });

  it("GET /withdrawals returns the mirrored sweep history", async () => {
    const { status, body } = await get("/withdrawals?limit=10");
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.withdrawals));
    assert.ok(body.count <= 10);
    for (const w of body.withdrawals) {
      assert.match(w.txHash, TX_HASH_RE);
      assert.equal(typeof w.amount, "string");
    }
  });

  it("GET /stats returns on-chain totals, withdrawal totals and a leaderboard", async () => {
    const { status, body } = await get("/stats");
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.topTippers));
    assert.equal(typeof body.withdrawals.count, "number");
    assert.equal(typeof body.withdrawals.totalWei, "string");
    // chain offline => onChainError explains why instead of a 500
    if (body.onChain) {
      assert.equal(typeof body.onChain.tipCount, "number");
      assert.match(body.onChain.owner, /^0x[0-9a-f]{40}$/);
      assert.equal(typeof body.onChain.lifetimeWei, "string");
    } else {
      assert.equal(typeof body.onChainError, "string");
    }
  });

  it("POST /tips rejects a malformed txHash", async () => {
    const { status, body } = await post("/tips", { txHash: "0xnope", name: "Eve" });
    assert.equal(status, 400);
    assert.match(body.error, /txHash/i);
  });

  it("POST /tips rejects a well-formed tx that is not a tip", async () => {
    const fakeTx = `0x${"ab".repeat(32)}`;
    const { status } = await post("/tips", {
      txHash: fakeTx,
      name: "api-test: eve",
      message: "api-test: should never be stored",
    });
    // 400 = chain answered and knows no such tip, 503 = chain unavailable
    assert.ok([400, 503].includes(status), `unexpected status ${status}`);
    assert.equal(await Tip.countDocuments({ txHash: fakeTx }), 0);
  });

  it("round-trips a real tip: chain tx -> POST -> feed", async (t) => {
    const status = getChainStatus();
    if (!status.ready) return t.skip("contract not deployed (run npm run deploy:local)");

    const { Contract, JsonRpcProvider, Wallet, parseEther } = await import("ethers");
    const provider = new JsonRpcProvider(config.rpcUrl);

    let tipper;
    try {
      await provider.getBlockNumber(); // node reachable?
      tipper = new Wallet(HARDHAT_ACCOUNT_1, provider);
    } catch {
      return t.skip("no Hardhat node on " + config.rpcUrl);
    }

    const contract = new Contract(status.contractAddress, TIP_ABI, tipper);
    const tx = await contract.tip({ value: parseEther("0.01") });
    const receipt = await tx.wait();
    assert.equal(receipt.status, 1);

    const name = "api-test: Ada";
    const message = "api-test: round trip";
    const posted = await post("/tips", { txHash: receipt.hash, name, message });
    assert.equal(posted.status, 201);
    assert.equal(posted.body.tip.txHash, receipt.hash.toLowerCase());
    assert.equal(posted.body.tip.name, name);
    assert.equal(posted.body.tip.verified, true);
    assert.equal(posted.body.tip.amount, parseEther("0.01").toString());

    const feed = await get(`/tips?from=${(await tipper.address).toLowerCase()}`);
    assert.ok(feed.body.tips.some((tip) => tip.txHash === receipt.hash.toLowerCase()));

    // an idempotent second POST keeps the same document
    const again = await post("/tips", { txHash: receipt.hash, name, message });
    assert.equal(again.status, 201);
    assert.equal(again.body.tip._id, posted.body.tip._id);
  });
});
