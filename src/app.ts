import express from "express";

import { requestLogger, errorHandler } from "./middleware";
import uploadRoutes from "./routes/upload";
import metricsRoutes from "./routes/metrics";
import { logger } from "./shared/logger";
import { config } from "./shared/config";

const app = express();

// Middleware
app.use(express.json());
app.use(express.static("public"));
app.use(requestLogger);

// Routes
app.use("/api", uploadRoutes);
app.use("/", metricsRoutes); // Prometheus metrics endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  logger.info("Server started", {
    port: config.port,
    environment: config.nodeEnv,
  });
});

export { app };
