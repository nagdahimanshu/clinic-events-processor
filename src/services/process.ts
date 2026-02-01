import { Readable } from "stream";

import { getS3Storage } from "./storage";
import { processCSV } from "../domain/csvProcessor";
import { logger } from "../shared/logger";
import { config } from "../shared/config";

export interface ProcessJob {
  jobId: string;
  s3Key?: string;
  filename: string;
  stream?: Readable;
}

/**
 * Handles CSV processing logic
 */
export async function processFile(job: ProcessJob): Promise<void> {
  const { jobId, s3Key, filename, stream: inputStream } = job;
  try {
    logger.info("CSV processing started", {
      jobId,
      s3Key: s3Key || "direct",
      filename,
      source: inputStream ? "stream" : "s3",
    });

    // Get file stream either from provided stream or from S3
    let stream: Readable;
    if (inputStream) {
      stream = inputStream;
      logger.debug("Processing from the input stream", { jobId });
    } else if (s3Key) {
      const storage = getS3Storage();
      stream = await storage.getStream(s3Key);
      logger.debug("Processing from S3", { jobId, s3Key });
    } else {
      throw new Error("Either s3Key or stream must be provided");
    }

    const { currProgress: currProgress, analytics } = await processCSV(
      stream,
      (progressMetrics) => {
        logger.debug("Processing progress", {
          jobId,
          rowsProcessed: progressMetrics.totalRows,
          errors: progressMetrics.errors,
        });
      },
      config.progressIntervalMs,
    );

    logger.info("CSV processing completed", {
      jobId,
      totalRows: currProgress.totalRows,
      errors: currProgress.errors,
      revenue: currProgress.revenue,
      duration: currProgress.endTime! - currProgress.startTime,
    });

    logger.debug("Week per week metrics has been calculated successfully", {
      jobId,
      filename,
      analytics,
    });

    // Clean up file from S3 if it was uploaded
    if (s3Key && config.useS3) {
      const storage = getS3Storage();
      await storage.delete(s3Key);
      logger.info("File has been deleted from S3 after processing", {
        jobId,
        s3Key,
      });
    }
  } catch (error: any) {
    logger.error("CSV processing failed", error, { jobId, s3Key, filename });
    throw error;
  }
}
