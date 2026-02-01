import { getWeekDateRange, formatWeekDateRange } from "../../src/utils/date";

describe("Test date Utilities", () => {
  describe("Test getWeekDateRange function", () => {
    it("should return start and end dates for a week", () => {
      const date = new Date("2025-01-20");
      const { startDate, endDate } = getWeekDateRange(date);
      expect(startDate).toBeInstanceOf(Date);
      expect(endDate).toBeInstanceOf(Date);
    });

    it("should return same week start for dates in same week", () => {
      const monday = new Date("2025-01-20");
      const friday = new Date("2025-01-24");
      expect(getWeekDateRange(monday).startDate.getTime()).toBe(
        getWeekDateRange(friday).startDate.getTime(),
      );
    });

    it("should return different week starts for dates in different weeks", () => {
      const week1 = new Date("2025-01-20");
      const week2 = new Date("2025-01-27");
      expect(getWeekDateRange(week1).startDate.getTime()).not.toBe(
        getWeekDateRange(week2).startDate.getTime(),
      );
    });
  });

  describe("Test formatWeekDateRange function", () => {
    it("should format date range in ISO format", () => {
      const date = new Date("2025-01-20");
      const range = formatWeekDateRange(date);
      // Should be in format: "2025-01-20 - 2025-01-27"
      expect(range).toMatch(/^\d{4}-\d{2}-\d{2} - \d{4}-\d{2}-\d{2}$/);
      expect(range).toContain("2025");
    });

    it("should return correct date range for a week", () => {
      const date = new Date("2025-01-20");
      const range = formatWeekDateRange(date);
      expect(range).toBe("2025-01-20 - 2025-01-26");
    });
  });
});
