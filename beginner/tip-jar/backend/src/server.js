import mongoose from "mongoose";
import { config } from "./config.js";
import { createApp } from "./app.js";
import { initChain, startIndexer } from "./services/chain.js";

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log(`[mongo] connected to ${config.mongoUri}`);

  await initChain();
  startIndexer();

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[api] listening on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
