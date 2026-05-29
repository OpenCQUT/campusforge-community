import { readFileSync } from "node:fs";
import { resolve } from "node:path";

interface ServerConfig {
  admin: {
    email: string;
    password: string;
  };
  app: {
    debug: boolean;
  };
}

type TomlValue = string | boolean | number;
type TomlTree = Record<string, Record<string, TomlValue>>;

const DEFAULT_CONFIG: ServerConfig = {
  admin: {
    email: "",
    password: "",
  },
  app: {
    debug: false,
  },
};

function parseTomlValue(rawValue: string): TomlValue {
  const value = rawValue.trim();
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
          email: asString(parsed.admin?.email).trim(),
          password: asString(parsed.admin?.password),
        },
        app: {
          debug: asBoolean(parsed.app?.debug),
        },
      };
    } catch {
      // Try the next config location.
    }
  }

  return DEFAULT_CONFIG;
}
