import { Readable } from "stream";
import { parse } from "csv-parse";

import { ProcessingMetrics } from "../types";

export interface ProgressCallback {
  (metrics: ProcessingMetrics): void;
}

/**
 * Processes CSV data
 */
export async function processCSV(
  stream: Readable,
  onProgress?: ProgressCallback,
  progressIntervalMs: number = 10000,
): Promise<{
  metrics: ProcessingMetrics;
}> {
  const metrics: ProcessingMetrics = {
    totalRows: 0,
    errors: 0,
    revenue: 0,
    eventTypes: {},
    clinics: {},
    startTime: Date.now(),
  };

  let lastProgressTime = Date.now();

  const parser = parse({
    columns: true,
    skip_empty_lines: true,
    trim: true,
  } as any);

  // TODO: Missing metrics grouped by week
  return new Promise<{
    metrics: ProcessingMetrics;
  }>((resolve, reject) => {
    stream
      .pipe(parser)
      .on("data", (row: any) => {
        try {
          metrics.totalRows++;
          const revenue = parseFloat(row.revenue_amount || "0");
          // Validate revenue: must be a valid number and >= 0
          if (!isNaN(revenue) && revenue >= 0) {
            metrics.revenue += revenue;
          } else {
            metrics.errors++;
          }

          const eventType = row.event_type || "unknown";
          metrics.eventTypes[eventType] =
            (metrics.eventTypes[eventType] || 0) + 1;

          const clinicId = row.clinic_id || "unknown";
          metrics.clinics[clinicId] = (metrics.clinics[clinicId] || 0) + 1;

          // callback
          const now = Date.now();
          if (onProgress && now - lastProgressTime >= progressIntervalMs) {
            onProgress({ ...metrics });
            lastProgressTime = now;
          }
        } catch (error) {
          metrics.errors++;
        }
      })
      .on("error", (error: Error) => {
        reject(error);
      })
      .on("end", () => {
        metrics.endTime = Date.now();
        resolve({ metrics });
      });
  });
}
