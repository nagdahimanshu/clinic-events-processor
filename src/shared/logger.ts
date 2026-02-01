import winston from "winston";

const { combine, timestamp, errors, splat, json, colorize, printf } =
  winston.format;

const baseTimestamp = timestamp({ format: "YYYY-MM-DD HH:mm:ss" });

const fileFormat = combine(
  baseTimestamp,
  errors({ stack: true }),
  splat(),
  json(),
);

const consoleFormat = combine(
  colorize(),
  baseTimestamp,
  errors({ stack: true }),
  splat(),
  printf(({ timestamp, level, message, ...meta }) => {
    const metaString =
      Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} [${level}]: ${message}${metaString}`;
  }),
);

export const logger = winston.createLogger({
  level: "info",
  defaultMeta: { service: "ocm-import" },
  transports: [
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: fileFormat,
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      format: fileFormat,
    }),
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
  exitOnError: false,
});
