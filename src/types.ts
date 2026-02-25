export type BrightDataConfig = {
  apiKey: string;
  customerId?: string;
  proxyZone?: string;
  proxyPassword?: string;
  timeoutMs: number;
  datasetOverrides: Record<string, string>;
};

export const DEFAULT_DATASET_IDS: Record<string, string> = {
  instagram_posts: "gd_lk5ns7kz21pck8jpis",
  instagram_profiles: "gd_l1vikfnt1wgvvqz95w",
  facebook_posts: "gd_lyclm20il4r5helnj",
  facebook_profiles: "gd_l1vikfch893r09e97",
  tiktok_posts: "gd_lu702nij2f790tmv9h",
  tiktok_profiles: "gd_l1vikfnt88305b8bl",
  reddit_posts: "gd_lk5ns7kz25gol315s",
  reddit_comments: "gd_lwdb4vjm1ehb499uxs",
};

export type Platform = "instagram" | "facebook" | "tiktok" | "reddit";

const PLATFORM_PATTERNS: Array<{ pattern: RegExp; platform: Platform }> = [
  { pattern: /instagram\.com/i, platform: "instagram" },
  { pattern: /facebook\.com|fb\.com/i, platform: "facebook" },
  { pattern: /tiktok\.com/i, platform: "tiktok" },
  { pattern: /reddit\.com/i, platform: "reddit" },
];

export function detectPlatform(url: string): Platform | undefined {
  for (const { pattern, platform } of PLATFORM_PATTERNS) {
    if (pattern.test(url)) return platform;
  }
  return undefined;
}

export function resolveDatasetId(
  cfg: BrightDataConfig,
  key: string,
): string {
  return cfg.datasetOverrides[key] ?? DEFAULT_DATASET_IDS[key] ?? key;
}

const ALLOWED_CONFIG_KEYS = [
  "apiKey",
  "customerId",
  "proxyZone",
  "proxyPassword",
  "timeoutMs",
  "datasetOverrides",
];

function resolveEnvVars(value: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (_, envVar) => {
    const envValue = process.env[envVar];
    if (!envValue) {
      throw new Error(`Environment variable ${envVar} is not set`);
    }
    return envValue;
  });
}

export function parseConfig(value: unknown): BrightDataConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("brightdata config required");
  }
  const cfg = value as Record<string, unknown>;
  const unknown = Object.keys(cfg).filter((k) => !ALLOWED_CONFIG_KEYS.includes(k));
  if (unknown.length > 0) {
    throw new Error(`brightdata config has unknown keys: ${unknown.join(", ")}`);
  }

  if (typeof cfg.apiKey !== "string" || !cfg.apiKey.trim()) {
    throw new Error("brightdata apiKey is required");
  }

  const timeoutMs =
    typeof cfg.timeoutMs === "number" ? Math.floor(cfg.timeoutMs) : 55_000;
  if (timeoutMs < 5_000 || timeoutMs > 300_000) {
    throw new Error("brightdata timeoutMs must be between 5000 and 300000");
  }

  const datasetOverrides: Record<string, string> = {};
  if (cfg.datasetOverrides && typeof cfg.datasetOverrides === "object") {
    for (const [k, v] of Object.entries(cfg.datasetOverrides as Record<string, unknown>)) {
      if (typeof v === "string") datasetOverrides[k] = v;
    }
  }

  return {
    apiKey: resolveEnvVars(cfg.apiKey),
    customerId: typeof cfg.customerId === "string" ? cfg.customerId.trim() || undefined : undefined,
    proxyZone: typeof cfg.proxyZone === "string" ? cfg.proxyZone.trim() || undefined : undefined,
    proxyPassword:
      typeof cfg.proxyPassword === "string"
        ? resolveEnvVars(cfg.proxyPassword) || undefined
        : undefined,
    timeoutMs,
    datasetOverrides,
  };
}
