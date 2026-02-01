export interface ProcessingMetrics {
  totalRows: number;
  errors: number;
  revenue: number;
  eventTypes: Record<string, number>;
  clinics: Record<string, number>;
  startTime: number;
  endTime?: number;
}

export interface CSVEventSchema {
  event_id: string;
  clinic_id: string;
  patient_id: string;
  event_type: string;
  event_timestamp: string;
  revenue_amount: string;
  channel?: string;
}

export interface WeeklyMetrics {
  revenue: number;
  revenuePerTreatment: number;
  revenueByTreatmentType: Record<string, number>;
  appointments: number;
  bookings: number;
  treatmentsCompleted: number;
}

export interface WeeklyData {
  week: string;
  dateRange: string;
  metrics: WeeklyMetrics;
}

export interface WeeklyAnalytics {
  weeks: WeeklyData[];
  totalWeeks: number;
}
