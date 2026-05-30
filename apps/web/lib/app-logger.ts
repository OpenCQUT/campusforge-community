import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ServerConfig } from "./server-config";

export type LogLevel = ServerConfig["logging"]["level"];

export interface LogRecord {
  time: string;
  level: LogLevel;
  scope: string;
  message: string;
  details?: Record<string, string | number | boolean | null>;
}

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function shouldLog(config: ServerConfig, level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[config.logging.level];
}

function logPath(config: ServerConfig, file: string): string {
  return join(config.storage.logDir, file);
}

export function writeLog(
  config: ServerConfig,
  level: LogLevel,
  scope: string,
  message: string,
  details?: LogRecord["details"],
) {
  if (!shouldLog(config, level)) return;

  const record: LogRecord = {
    time: new Date().toISOString(),
    level,
    scope,
    message,
    ...(details ? { details } : {}),
  };
  mkdirSync(config.storage.logDir, { recursive: true });
  const line = `${JSON.stringify(record)}\n`;
  appendFileSync(logPath(config, "app.log"), line, { mode: 0o600 });
  if (level === "error") {
    appendFileSync(logPath(config, "error.log"), line, { mode: 0o600 });
  }
}

export function logInfo(
  config: ServerConfig,
  scope: string,
  message: string,
  details?: LogRecord["details"],
) {
  writeLog(config, "info", scope, message, details);
}

export function logError(
  config: ServerConfig,
  scope: string,
  message: string,
  details?: LogRecord["details"],
) {
  writeLog(config, "error", scope, message, details);
}

export function readRecentErrorLogs(config: ServerConfig, limit = 50): LogRecord[] {
  const path = logPath(config, "error.log");
  if (!existsSync(path)) return [];

  return readFileSync(path, "utf8")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-limit)
    .map((line) => {
      try {
        return JSON.parse(line) as LogRecord;
      } catch {
        return null;
      }
    })
    .filter((record): record is LogRecord => Boolean(record))
    .reverse();
}
