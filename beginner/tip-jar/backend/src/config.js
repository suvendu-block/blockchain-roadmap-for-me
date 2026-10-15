import "dotenv/config";

function toInt(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export const config = {
  port: toInt(process.env.PORT, 5000),
  mongoUri: process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/tipjar",
  rpcUrl: process.env.RPC_URL ?? "http://127.0.0.1:8545",
  chainId: toInt(process.env.CHAIN_ID, 31337),
  contractAddress: process.env.CONTRACT_ADDRESS ?? null,
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  indexIntervalMs: toInt(process.env.INDEX_INTERVAL_MS, 5_000),
};
