import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

import { logger } from "../shared/logger";
import { fileUploadTotal, activeJobs } from "../services/metrics";
import { processFile } from "../services/process";
import { uploadFile } from "../services/upload";
import { RequestWithStreamingFile } from "../types";

export class UploadController {
  async upload(req: Request, res: Response): Promise<void> {
    const streamingFile = (req as RequestWithStreamingFile).streamingFile;

    if (!streamingFile) {
      logger.warn("Missing file in request");
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    try {
      const jobId = uuidv4();
      const s3Key = `uploads/${jobId}/${streamingFile.filename}`;

      activeJobs.inc();

      const uploadResult = await uploadFile(
        streamingFile.stream,
        streamingFile.filename,
        jobId,
        s3Key,
      );

      fileUploadTotal.inc({ status: "success" });

      processFile({
        jobId: uploadResult.jobId,
        s3Key: uploadResult.s3Key,
        filename: uploadResult.filename,
        stream: uploadResult.stream,
      })
        .then(() => {
          activeJobs.dec();
        })
        .catch((error: unknown) => {
          activeJobs.dec();
          logger.error("Error occured while processing file", error, {
            jobId: uploadResult.jobId,
            filename: uploadResult.filename,
          });
        });

      res.json({
        jobId: uploadResult.jobId,
        status: "queued",
        message:
          "File has been uploaded successfully. Check Slack for progress.",
      });
    } catch (error: unknown) {
      fileUploadTotal.inc({ status: "error" });
      activeJobs.dec();
      logger.error(
        `Error occured while uploading file: ${streamingFile.filename} with error`,
        error,
      );
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: errorMessage });
    }
  }
}
