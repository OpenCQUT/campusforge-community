import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
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
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
let lastCleanupAt = 0;

function shouldLog(config: ServerConfig, level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[config.logging.level];
}

function logPath(config: ServerConfig, file: string): string {
  return join(config.storage.logDir, file);
}

function timestampForFile(date = new Date()): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function rotateAppLogIfNeeded(config: ServerConfig) {
  const path = logPath(config, "app.log");
  if (!existsSync(path)) return;

  const maxBytes = config.logging.maxFileMb * 1024 * 1024;
  if (statSync(path).size < maxBytes) return;

  const rotated = logPath(config, `app-${timestampForFile()}.log`);
  const compressed = `${rotated}.gz`;
  renameSync(path, rotated);
  writeFileSync(compressed, gzipSync(readFileSync(rotated)), { mode: 0o600 });
  unlinkSync(rotated);
}

function cleanupCompressedAppLogs(config: ServerConfig) {
  const now = Date.now();
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;
  lastCleanupAt = now;

  const cutoff = now - config.logging.retentionDays * 24 * 60 * 60 * 1000;
  for (const file of readdirSync(config.storage.logDir)) {
    if (!/^app-\d{8}T\d{6}Z\.log\.gz$/.test(file)) continue;
    const path = logPath(config, file);
    if (statSync(path).mtimeMs < cutoff) {
      unlinkSync(path);
    }
  }
}

function maintainAppLog(config: ServerConfig) {
  try {
    rotateAppLogIfNeeded(config);
    cleanupCompressedAppLogs(config);
  } catch {
    // Logging must not break request handling.
  }
}

export function writeLog(
  config: ServerConfig,
  level: LogLevel,
  scope: string,
  message: string,
  details?: LogRecord["details"],
) {
  try {
    if (!shouldLog(config, level)) return;

    const record: LogRecord = {
      time: new Date().toISOString(),
      level,
      scope,
      message,
      ...(details ? { details } : {}),
    };
    mkdirSync(config.storage.logDir, { recursive: true });
    maintainAppLog(config);
    const line = `${JSON.stringify(record)}\n`;
    appendFileSync(logPath(config, "app.log"), line, { mode: 0o600 });
    if (level === "error") {
      appendFileSync(logPath(config, "error.log"), line, { mode: 0o600 });
    }
  } catch {
    // Logging must not break request handling.
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
