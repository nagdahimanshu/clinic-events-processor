import { Readable } from "stream";

import { getS3Storage } from "./storage";
import { logger } from "../shared/logger";
import { config } from "../shared/config";
import { sendSlackMessage, formatStartMessage } from "./slack";

export interface UploadResult {
  jobId: string;
  s3Key?: string;
  filename: string;
  stream?: Readable;
}

/**
 * Handles file upload (either via S3 or return stream for direct processing)
 */
export async function uploadFile(
  stream: Readable,
  filename: string,
  jobId: string,
  s3Key: string,
): Promise<UploadResult> {
  logger.info("File uploading started...", {
    jobId,
    filename,
    useS3: config.useS3,
    streaming: true,
  });

  await sendSlackMessage(formatStartMessage(jobId, filename));

  if (config.useS3) {
    const storage = getS3Storage();
    try {
      // Store directly to S3
      await storage.save(stream, s3Key);
      logger.info("File has been successfully stored to S3", {
        filename,
        jobId,
        s3Key,
      });
    } catch (error: any) {
      logger.error("Error while uploading to s3", error, { jobId, filename });
      throw new Error(
        `Error while uploading to S3: ${error.message}. Please check AWS credentials and bucket configuration.`,
      );
    }

    return {
      jobId,
      s3Key,
      filename,
    };
  } else {
    logger.info("Skipping uploading file to S3", {
      jobId,
      filename,
      reason: config.s3Bucket ? "SKIP_S3=true" : "S3_BUCKET not set",
    });

    return {
      jobId,
      filename,
      stream,
    };
  }
}
