import { Request, Response, NextFunction } from "express";

import { logger } from "../shared/logger";

interface ErrorWithStatus extends Error {
  status?: number;
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error("HTTP error", err, {
    path: req.path,
    method: req.method,
  });

  if (!res.headersSent) {
    const status = (err as ErrorWithStatus).status || 500;
    const message =
      err instanceof Error ? err.message : "Internal server error";
    res.status(status).json({
      error: message,
    });
  }
}
