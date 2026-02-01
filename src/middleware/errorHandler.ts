import { Request, Response, NextFunction } from "express";

import { logger } from "../shared/logger";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error("HTTP error", err, {
    path: req.path,
    method: req.method,
  });

  if (!res.headersSent) {
    res.status(err.status || 500).json({
      error: err.message || "Internal server error",
    });
  }
}
