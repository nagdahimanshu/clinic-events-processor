import express from "express";
import uploadRoutes from "./routes/upload";
import { logger } from "./shared/logger";
import { config } from "./shared/config";
import { requestLogger } from "./middleware";

const app = express();

// Middleware
app.use(express.json());
app.use(express.static("public"));
app.use(requestLogger);

// Routes
app.use("/api", uploadRoutes);
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Start server
app.listen(config.port, () => {
  logger.info("Server started", {
    port: config.port,
    environment: config.nodeEnv,
  });
});

export { app };
