import dotenv from "dotenv";
dotenv.config();

export const config = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  // Storage
  s3Bucket: process.env.S3_BUCKET,
  useS3: process.env.SKIP_S3 !== "true" && !!process.env.S3_BUCKET,
  storageType:
    process.env.SKIP_S3 === "true" || !process.env.S3_BUCKET ? "direct" : "s3",

  // Slack
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || "",

  // Logging
  logLevel: process.env.LOG_LEVEL || "debug",

  // Processing
  progressIntervalMs: parseInt(process.env.PROGRESS_INTERVAL_MS || "10000", 10),
  maxFileSize: 100 * 1024 * 1024, // 100MB
} as const;
