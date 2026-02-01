import { Readable } from "stream";
import { parse } from "csv-parse";

import {
  ProcessingMetrics,
  CSVEventSchema,
  WeeklyAnalytics,
  WeeklyMetrics,
  WeeklyData,
} from "../types";
import { getWeekDateRange, formatWeekDateRange } from "../utils/date";
import { EVENT_TYPES, EVENT_PATTERNS } from "../shared/constants";

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
  currProgress: ProcessingMetrics;
  analytics: WeeklyAnalytics | { message: string };
}> {
  const currProgress: ProcessingMetrics = {
    totalRows: 0,
    errors: 0,
    revenue: 0,
    eventTypes: {},
    clinics: {},
    startTime: Date.now(),
  };

  // Incremental metrics calculation
  const weeklyData: Record<string, WeeklyMetrics> = {};
  const weekDates: Record<string, Date> = {}; // Store start date as key for each week

  let lastProgressTime = Date.now();

  const parser = parse({
    columns: true,
    skip_empty_lines: true,
    trim: true,
  } as any);

  return new Promise<{
    currProgress: ProcessingMetrics;
    analytics: WeeklyAnalytics | { message: string };
  }>((resolve, reject) => {
    stream
      .pipe(parser)
      .on("data", (row: CSVEventSchema) => {
        try {
          currProgress.totalRows++;
          const revenue = parseFloat(row.revenue_amount || "0");
          // Validate revenue: must be a valid number and >= 0
          if (!isNaN(revenue) && revenue >= 0) {
            currProgress.revenue += revenue;
          } else {
            currProgress.errors++;
          }

          const eventType = row.event_type || "unknown";
          currProgress.eventTypes[eventType] =
            (currProgress.eventTypes[eventType] || 0) + 1;

          const clinicId = row.clinic_id || "unknown";
          currProgress.clinics[clinicId] =
            (currProgress.clinics[clinicId] || 0) + 1;

          // Incremental analytics calculation instead of loading all rows into memory
          if (row.event_timestamp) {
            const rowDate = new Date(row.event_timestamp);
            if (!isNaN(rowDate.getTime())) {
              const { startDate } = getWeekDateRange(rowDate);
              const weekKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;

              // Initialize week data
              if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = {
                  revenue: 0,
                  revenuePerTreatment: 0,
                  revenueByTreatmentType: {},
                  appointments: 0,
                  bookings: 0,
                  treatmentsCompleted: 0,
                };
                weekDates[weekKey] = startDate;
              }

              const eventTypeUpper = (row.event_type || "").toUpperCase();

              if (!isNaN(revenue) && revenue >= 0) {
                weeklyData[weekKey].revenue += revenue;

                // Track revenue per treatment
                if (revenue > 0) {
                  const originalEventType = row.event_type || "UNKNOWN";
                  if (
                    !weeklyData[weekKey].revenueByTreatmentType[
                      originalEventType
                    ]
                  ) {
                    weeklyData[weekKey].revenueByTreatmentType[
                      originalEventType
                    ] = 0;
                  }
                  weeklyData[weekKey].revenueByTreatmentType[
                    originalEventType
                  ] += revenue;
                }
              }

              // Count TREATMENT_COMPLETED events
              if (eventTypeUpper === EVENT_TYPES.TREATMENT_COMPLETED) {
                weeklyData[weekKey].treatmentsCompleted += 1;
              }

              // Count appointments
              if (eventTypeUpper.includes(EVENT_PATTERNS.APPOINTMENT)) {
                weeklyData[weekKey].appointments += 1;
              }

              // Count bookings
              if (
                eventTypeUpper.includes(EVENT_PATTERNS.BOOKING) ||
                eventTypeUpper.includes(EVENT_PATTERNS.BOOKED)
              ) {
                weeklyData[weekKey].bookings += 1;
              }
            }
          }

          // Progress callback
          const now = Date.now();
          if (onProgress && now - lastProgressTime >= progressIntervalMs) {
            onProgress({ ...currProgress });
            lastProgressTime = now;
          }
        } catch (error) {
          currProgress.errors++;
        }
      })
      .on("error", (error: Error) => {
        reject(error);
      })
      .on("end", () => {
        currProgress.endTime = Date.now();

        // Calculate revenue per treatment for each week
        Object.keys(weeklyData).forEach((week) => {
          const data = weeklyData[week];
          data.revenuePerTreatment =
            data.treatmentsCompleted > 0
              ? data.revenue / data.treatmentsCompleted
              : 0;
        });

        // Create final analytics
        let analytics: WeeklyAnalytics | { message: string };
        if (Object.keys(weeklyData).length === 0) {
          analytics = { message: "No valid data found" };
        } else {
          const sortedWeeks = Object.keys(weeklyData).sort();
          const weeks: WeeklyData[] = sortedWeeks.map((key) => ({
            week: key,
            dateRange: formatWeekDateRange(weekDates[key]),
            metrics: weeklyData[key],
          }));

          analytics = {
            weeks,
            totalWeeks: weeks.length,
          };
        }

        resolve({ currProgress, analytics });
      });
  });
}
