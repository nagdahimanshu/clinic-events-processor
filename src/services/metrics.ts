import { Registry, Counter, Histogram, Gauge } from "prom-client";

/**
 * Prometheus metrics registry
 */
export const register = new Registry();

// Default metrics (CPU, memory)
register.setDefaultLabels({
  app: "client-events-processor",
});

// File upload metrics
export const fileUploadTotal = new Counter({
  name: "csv_processor_file_uploads_total",
  help: "Total number of file uploads",
  labelNames: ["status"], // success, error
  registers: [register],
});

// CSV processing metrics
export const csvProcessingErrors = new Counter({
  name: "csv_processor_processing_errors_total",
  help: "Total number of CSV processing errors",
  labelNames: ["error_type"], // parse_error, validation_error, etc.
  registers: [register],
});

// Active jobs
export const activeJobs = new Gauge({
  name: "csv_processor_active_jobs",
  help: "Number of currently active processing jobs",
  registers: [register],
});
