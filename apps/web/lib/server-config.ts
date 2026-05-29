import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface ServerConfig {
  admin: {
    email: string;
    emails: string[];
    password: string;
  };
  github: {
    org: string;
    token: string;
    clientId: string;
    clientSecret: string;
  };
  app: {
    debug: boolean;
    sessionSecret: string;
  };
  storage: {
    dataDir: string;
    logDir: string;
  };
  email: {
    mode: "smtp" | "log";
    from: string;
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };
  verification: {
    codeTtlMinutes: number;
    resendCooldownSeconds: number;
  };
}

type TomlValue = string | boolean | number | string[];
type TomlTree = Record<string, Record<string, TomlValue>>;

const DEFAULT_CONFIG: ServerConfig = {
  admin: {
    email: "",
    emails: [],
    password: "",
  },
  github: {
    org: "OpenCQUT",
    token: "",
    clientId: "",
    clientSecret: "",
  },
  app: {
    debug: false,
    sessionSecret: process.env.CAMPUSFORGE_SESSION_SECRET ?? "",
  },
  storage: {
    dataDir: process.env.CAMPUSFORGE_DATA_DIR ?? resolve(process.cwd(), ".campusforge-data"),
    logDir: process.env.CAMPUSFORGE_LOG_DIR ?? resolve(process.cwd(), ".campusforge-logs"),
  },
  email: {
    mode: "log",
    from: "",
    host: "",
    port: 587,
    secure: false,
    user: "",
    pass: "",
  },
  verification: {
    codeTtlMinutes: 10,
    resendCooldownSeconds: 60,
  },
};

function parseTomlValue(rawValue: string): TomlValue {
  const value = rawValue.trim();
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner
      .split(",")
      .map((item) => parseTomlValue(item.trim()))
      .filter((item): item is string => typeof item === "string");
  }
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  if (value === "true") return true;
  if (value === "false") return false;

  const numberValue = Number(value);
  if (!Number.isNaN(numberValue)) return numberValue;

  return value;
}

function stripTomlComment(line: string): string {
  let inString = false;
  let escaped = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (char === "#" && !inString) {
      return line.slice(0, index);
    }
  }

  return line;
}

function parseToml(source: string): TomlTree {
  const result: TomlTree = {};
  let currentSection = "";

  for (const rawLine of source.split(/\r?\n/)) {
    const line = stripTomlComment(rawLine).trim();
    if (!line) continue;

    const sectionMatch = line.match(/^\[([A-Za-z0-9_-]+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1] ?? "";
      result[currentSection] ??= {};
      continue;
    }

    const assignmentMatch = line.match(/^([A-Za-z0-9_-]+)\s*=\s*(.+)$/);
    if (!assignmentMatch || !currentSection) continue;

    const [, key, rawValue] = assignmentMatch;
    if (!key || !rawValue) continue;
    result[currentSection] ??= {};
    const section = result[currentSection];
    if (section) {
      section[key] = parseTomlValue(rawValue);
    }
  }

  return result;
}

function asString(value: TomlValue | undefined): string {
  return typeof value === "string" ? value : "";
}

function asBoolean(value: TomlValue | undefined): boolean {
  return typeof value === "boolean" ? value : false;
}

function asNumber(value: TomlValue | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asStringList(value: TomlValue | undefined): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }
  const single = asString(value).trim();
  return single ? [single] : [];
}

function configCandidates(): string[] {
  if (process.env.CAMPUSFORGE_CONFIG) {
    return [process.env.CAMPUSFORGE_CONFIG];
  }

  return [
    resolve(process.cwd(), "config.toml"),
    resolve(process.cwd(), "../../config.toml"),
  ];
}

export function loadServerConfig(): ServerConfig {
  for (const candidate of configCandidates()) {
    try {
      const parsed = parseToml(readFileSync(candidate, "utf8"));
      return {
        admin: {
          email:
            asString(parsed.admin?.email).trim() || asStringList(parsed.admin?.emails)[0] || "",
          emails: [
            ...asStringList(parsed.admin?.emails),
            asString(parsed.admin?.email).trim(),
          ].filter(Boolean),
          password: asString(parsed.admin?.password),
        },
        github: {
          org: asString(parsed.github?.org).trim() || DEFAULT_CONFIG.github.org,
          token: asString(parsed.github?.token).trim(),
          clientId: asString(parsed.github?.client_id).trim(),
          clientSecret: asString(parsed.github?.client_secret).trim(),
        },
        app: {
          debug: asBoolean(parsed.app?.debug),
          sessionSecret:
            asString(parsed.app?.session_secret).trim() || DEFAULT_CONFIG.app.sessionSecret,
        },
        storage: {
          dataDir:
            asString(parsed.storage?.data_dir).trim() || DEFAULT_CONFIG.storage.dataDir,
          logDir: asString(parsed.storage?.log_dir).trim() || DEFAULT_CONFIG.storage.logDir,
        },
        email: {
          mode: asString(parsed.email?.mode).trim() === "smtp" ? "smtp" : "log",
          from: asString(parsed.email?.from).trim(),
          host: asString(parsed.email?.host).trim(),
          port: asNumber(parsed.email?.port, DEFAULT_CONFIG.email.port),
          secure: asBoolean(parsed.email?.secure),
          user: asString(parsed.email?.user).trim(),
          pass: asString(parsed.email?.pass),
        },
        verification: {
          codeTtlMinutes: asNumber(
            parsed.verification?.code_ttl_minutes,
            DEFAULT_CONFIG.verification.codeTtlMinutes,
          ),
          resendCooldownSeconds: asNumber(
            parsed.verification?.resend_cooldown_seconds,
            DEFAULT_CONFIG.verification.resendCooldownSeconds,
          ),
        },
      };
    } catch {
      // Try the next config location.
    }
  }

  return DEFAULT_CONFIG;
}
