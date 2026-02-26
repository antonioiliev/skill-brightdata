export type BrightDataConfig = {
	apiKey: string;
	timeoutMs: number;
	datasetOverrides: Record<string, string>;
};

export const DEFAULT_DATASET_IDS: Record<string, string> = {
	instagram_posts: "gd_lk5ns7kz21pck8jpis",
	instagram_profiles: "gd_l1vikfch901nx3by4",
	facebook_posts: "gd_lyclm20il4r5helnj",
	facebook_profiles: "gd_lkaxegm826bjpoo9m5",
	tiktok_posts: "gd_lu702nij2f790tmv9h",
	tiktok_profiles: "gd_l1villgoiiidt09ci",
	reddit_posts: "gd_lvz8ah06191smkebj4",
	reddit_comments: "gd_lvzdpsdlw09j6t702",
	linkedin_profiles: "gd_l1viktl72bvl7bjuj0",
	linkedin_posts: "gd_lyy3tktm25m4avu764",
	linkedin_companies: "gd_l1vikfnt1wgvvqz95w",
};

export type Platform =
	| "instagram"
	| "facebook"
	| "tiktok"
	| "reddit"
	| "linkedin";

const PLATFORM_PATTERNS: Array<{ pattern: RegExp; platform: Platform }> = [
	{ pattern: /instagram\.com/i, platform: "instagram" },
	{ pattern: /facebook\.com|fb\.com/i, platform: "facebook" },
	{ pattern: /tiktok\.com/i, platform: "tiktok" },
	{ pattern: /reddit\.com/i, platform: "reddit" },
	{ pattern: /linkedin\.com/i, platform: "linkedin" },
];

export function detectPlatform(url: string): Platform | undefined {
	for (const { pattern, platform } of PLATFORM_PATTERNS) {
		if (pattern.test(url)) return platform;
	}
	return undefined;
}

export function resolveDatasetId(cfg: BrightDataConfig, key: string): string {
	return cfg.datasetOverrides[key] ?? DEFAULT_DATASET_IDS[key] ?? key;
}

const ALLOWED_CONFIG_KEYS: readonly (keyof BrightDataConfig)[] = [
	"apiKey",
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
	const unknown = Object.keys(cfg).filter(
		(k) => !ALLOWED_CONFIG_KEYS.includes(k),
	);

	if (unknown.length > 0) {
		throw new Error(
			`brightdata config has unknown keys: ${unknown.join(", ")}`,
		);
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
		for (const [k, v] of Object.entries(
			cfg.datasetOverrides as Record<string, unknown>,
		)) {
			if (typeof v === "string") datasetOverrides[k] = v;
		}
	}

	return {
		apiKey: resolveEnvVars(cfg.apiKey),
		timeoutMs,
		datasetOverrides,
	};
}
