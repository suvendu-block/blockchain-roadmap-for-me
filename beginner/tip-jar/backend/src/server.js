import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { config } from "./config.js";
import { apiRouter } from "./routes/tips.js";
import { initChain, startIndexer } from "./services/chain.js";

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use("/api", apiRouter);

// Central error handler (Express 5 forwards async errors here automatically)
app.use((err, _req, res, _next) => {
  console.error("[api]", err);
  res.status(err.statusCode ?? 500).json({ error: err.message ?? "Internal server error" });
});

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log(`[mongo] connected to ${config.mongoUri}`);

  await initChain();
  startIndexer();

  app.listen(config.port, () => {
    console.log(`[api] listening on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
