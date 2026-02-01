import axios from "axios";

import { config } from "../shared/config";
import { logger } from "../shared/logger";
import { WeeklyData } from "../types";

export async function sendSlackMessage(message: string): Promise<void> {
  if (!config.slackWebhookUrl) {
    logger.debug(
      "Missing webhook URL. Please set SLACK_WEBHOOK_URL environment variable.",
      {
        message,
      },
    );
    return;
  }

  try {
    await axios.post(
      config.slackWebhookUrl,
      { text: message },
      {
        timeout: 5000,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    logger.debug("Message has been successfully sent", {
      messageLength: message.length,
    });
  } catch (error: any) {
    // Graceful handling in case slack webhook URL is not configured
    logger.warn("Faild to send the message", {
      error: error.message,
      messageLength: message.length,
    });
  }
}

export function formatProgressMessage(jobId: string, metrics: any): string {
  return (
    `Progress Update (${jobId})\n` +
    `Rows processed: ${metrics.totalRows}\n` +
    `Errors: ${metrics.errors}\n` +
    `Revenue so far: $${metrics.revenue.toFixed(2)}\n` +
    `Event types: ${Object.keys(metrics.eventTypes).length}\n` +
    `Clinics: ${Object.keys(metrics.clinics).length}`
  );
}

export function formatStartMessage(jobId: string, filename: string): string {
  return `Processing started for job ${jobId}\n` + `File: ${filename}\n`;
}

export function formatCompletionMessage(
  jobId: string,
  metrics: any,
  weekComparison: any,
): string {
  const duration = ((metrics.endTime - metrics.startTime) / 1000).toFixed(2);

  let message = `Processing Complete (${jobId})\n\n`;
  message += `Summary:\n`;
  message += `• Total Rows: ${metrics.totalRows}\n`;
  message += `• Errors: ${metrics.errors}\n`;
  message += `• Total Revenue: $${metrics.revenue.toFixed(2)}\n`;
  message += `• Processing Time: ${duration}s\n\n`;

  // Week-by-week analytics
  if (weekComparison.weeks && weekComparison.weeks.length > 0) {
    message += `Weekly Analytics (${weekComparison.totalWeeks} week${weekComparison.totalWeeks > 1 ? "s" : ""}):\n\n`;

    weekComparison.weeks.forEach((weekData: WeeklyData) => {
      const m = weekData.metrics;
      message += `${weekData.dateRange}:\n`;
      message += `  Revenue: $${m.revenue.toFixed(2)}\n`;

      // Revenue per treatment
      const revenueByType = Object.entries(m.revenueByTreatmentType);
      if (revenueByType.length > 0) {
        message += `  Revenue by Treatment Type:\n`;
        revenueByType
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .forEach(([type, amount]) => {
            message += `    - ${type}: $${(amount as number).toFixed(2)}\n`;
          });
      }

      message += `  Appointments: ${m.appointments}\n`;
      message += `  Bookings: ${m.bookings}\n\n`;
    });
  } else {
    message += `${weekComparison.message}\n`;
  }

  return message;
}

export function formatErrorMessage(
  jobId: string,
  filename: string,
  error: string,
): string {
  return (
    `Error while processing CSV file: ${filename}and ${jobId}\n` +
    `Error: ${error}`
  );
}
