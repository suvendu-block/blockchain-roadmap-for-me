import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { apiRouter } from "./routes/tips.js";

/**
 * Build the Express app without binding it to a port.
 * `server.js` starts it for real; the API tests listen on an ephemeral port.
 */
export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  app.use("/api", apiRouter);

  // Central error handler (Express 5 forwards async errors here automatically)
  app.use((err, _req, res, _next) => {
    console.error("[api]", err);
    res.status(err.statusCode ?? 500).json({ error: err.message ?? "Internal server error" });
  });

  return app;
}
