import { Readable } from "stream";

import { processCSV } from "../../src/domain/csvProcessor";
import { EVENT_TYPES } from "../../src/shared/constants";

function createCSVStream(rows: Array<Record<string, string>>): Readable {
  const headers = [
    "event_id",
    "clinic_id",
    "patient_id",
    "event_type",
    "event_timestamp",
    "revenue_amount",
    "channel",
    "treatment_type",
  ];
  const csvRows = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => row[h] || "").join(",")),
  ];
  return Readable.from(csvRows.join("\n"));
}

describe("Test CSV Processor", () => {
  describe("Test Incremental metrics", () => {
    it("should return message for empty data", async () => {
      const stream = Readable.from("");
      const result = await processCSV(stream);
      expect(result.analytics).toEqual({
        message: "No valid data found",
      });
    });

    it("should calculate metrics for single week", async () => {
      const rows = [
        {
          event_id: "1",
          clinic_id: "clinic1",
          patient_id: "patient1",
          event_type: EVENT_TYPES.TREATMENT_COMPLETED,
          event_timestamp: "2025-01-20T10:00:00Z",
          revenue_amount: "100.50",
        },
        {
          event_id: "2",
          clinic_id: "clinic1",
          patient_id: "patient2",
          event_type: EVENT_TYPES.TREATMENT_COMPLETED,
          event_timestamp: "2025-01-21T10:00:00Z",
          revenue_amount: "200.00",
        },
      ];

      const stream = createCSVStream(rows);
      const result = await processCSV(stream);

      if ("weeks" in result.analytics) {
        expect(result.analytics.totalWeeks).toBe(1);
        expect(result.analytics.weeks[0].metrics.revenue).toBe(300.5);
        expect(result.analytics.weeks[0].metrics.treatmentsCompleted).toBe(2);
      }
    });

    it("should calculate metrics for multiple weeks", async () => {
      const rows = [
        {
          event_id: "1",
          clinic_id: "clinic1",
          patient_id: "patient1",
          event_type: EVENT_TYPES.TREATMENT_COMPLETED,
          event_timestamp: "2025-01-20T10:00:00Z",
          revenue_amount: "100.00",
        },
        {
          event_id: "2",
          clinic_id: "clinic1",
          patient_id: "patient2",
          event_type: EVENT_TYPES.TREATMENT_COMPLETED,
          event_timestamp: "2025-01-27T10:00:00Z",
          revenue_amount: "200.00",
        },
      ];

      const stream = createCSVStream(rows);
      const result = await processCSV(stream);

      if ("weeks" in result.analytics) {
        expect(result.analytics.totalWeeks).toBe(2);
        expect(result.analytics.weeks[0].metrics.revenue).toBe(100);
        expect(result.analytics.weeks[1].metrics.revenue).toBe(200);
      }
    });

    it("should count appointments correctly", async () => {
      const rows = [
        {
          event_id: "1",
          clinic_id: "clinic1",
          patient_id: "patient1",
          event_type: "APPOINTMENT_SCHEDULED",
          event_timestamp: "2025-01-20T10:00:00Z",
          revenue_amount: "0",
        },
        {
          event_id: "2",
          clinic_id: "clinic1",
          patient_id: "patient2",
          event_type: "APPOINTMENT_CANCELLED",
          event_timestamp: "2025-01-20T11:00:00Z",
          revenue_amount: "0",
        },
      ];

      const stream = createCSVStream(rows);
      const result = await processCSV(stream);

      if ("weeks" in result.analytics) {
        expect(result.analytics.weeks[0].metrics.appointments).toBe(2);
      }
    });

    it("should count bookings correctly", async () => {
      const rows = [
        {
          event_id: "1",
          clinic_id: "clinic1",
          patient_id: "patient1",
          event_type: "BOOKING_CREATED",
          event_timestamp: "2025-01-20T10:00:00Z",
          revenue_amount: "0",
        },
        {
          event_id: "2",
          clinic_id: "clinic1",
          patient_id: "patient2",
          event_type: "BOOKED",
          event_timestamp: "2025-01-20T11:00:00Z",
          revenue_amount: "0",
        },
      ];

      const stream = createCSVStream(rows);
      const result = await processCSV(stream);

      if ("weeks" in result.analytics) {
        expect(result.analytics.weeks[0].metrics.bookings).toBe(2);
      }
    });

    it("should track revenue per treatment type", async () => {
      const rows = [
        {
          event_id: "1",
          clinic_id: "clinic1",
          patient_id: "patient1",
          event_type: EVENT_TYPES.TREATMENT_COMPLETED,
          event_timestamp: "2025-01-20T10:00:00Z",
          revenue_amount: "100.00",
          treatment_type: "implants",
        },
        {
          event_id: "2",
          clinic_id: "clinic1",
          patient_id: "patient2",
          event_type: EVENT_TYPES.TREATMENT_COMPLETED,
          event_timestamp: "2025-01-20T11:00:00Z",
          revenue_amount: "200.00",
          treatment_type: "implants",
        },
        {
          event_id: "3",
          clinic_id: "clinic1",
          patient_id: "patient3",
          event_type: EVENT_TYPES.TREATMENT_COMPLETED,
          event_timestamp: "2025-01-20T12:00:00Z",
          revenue_amount: "150.00",
          treatment_type: "veneers",
        },
      ];

      const stream = createCSVStream(rows);
      const result = await processCSV(stream);

      if ("weeks" in result.analytics) {
        const revenueByType =
          result.analytics.weeks[0].metrics.revenueByTreatmentType;
        expect(revenueByType["implants"]).toBe(300);
        expect(revenueByType["veneers"]).toBe(150);
      }
    });
  });
});
