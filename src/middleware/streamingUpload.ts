import { Request, Response, NextFunction } from "express";
import busboy from "busboy";

import { config } from "../shared/config";
import { logger } from "../shared/logger";
import { RequestWithStreamingFile, StreamingFile } from "../types";

/**
 * Streaming file
 */
export function streamingUpload(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const bb = busboy({
    headers: req.headers,
    limits: { fileSize: config.maxFileSize },
  });

  let fileFound = false;
  let streamingFile: StreamingFile | null = null;

  bb.on("file", (name, file, info) => {
    const { filename, encoding, mimeType } = info;

    if (name !== "file") {
      file.resume();
      return;
    }

    if (!filename.endsWith(".csv")) {
      file.resume();
      if (!res.headersSent) {
        res.status(400).json({ error: "Only CSV files allowed" });
      }
      return;
    }

    fileFound = true;
    streamingFile = {
      stream: file,
      filename,
      encoding,
      mimetype: mimeType,
    };

    (req as RequestWithStreamingFile).streamingFile = streamingFile;
    next();
  });

  bb.on("error", (error: Error) => {
    logger.error("Error while streaming file", error);
    if (!res.headersSent) {
      const maxSizeMB = config.maxFileSize / (1024 * 1024);
      if (error.message.includes("File size limit exceeded")) {
        res.status(400).json({
          error: `Error because file size exceeds maximum allowed size of ${maxSizeMB}MB`,
        });
      } else {
        res.status(400).json({ error: "Error while uploading file" });
      }
    }
  });

  bb.on("finish", () => {
    if (!fileFound && !res.headersSent) {
      res.status(400).json({ error: "No file uploaded" });
    }
  });

  req.pipe(bb);
}
