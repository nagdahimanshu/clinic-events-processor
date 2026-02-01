export interface ProcessingMetrics {
  totalRows: number;
  errors: number;
  revenue: number;
  eventTypes: Record<string, number>;
  clinics: Record<string, number>;
  startTime: number;
  endTime?: number;
}
