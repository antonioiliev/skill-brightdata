import { afterEach, describe, expect, it, vi } from "vitest";
import { detectPlatform, parseConfig, resolveDatasetId } from "./types.js";
import type { BrightDataConfig } from "./types.js";

describe("parseConfig", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("accepts valid config and returns BrightDataConfig", () => {
    const cfg = parseConfig({ apiKey: "test-key-123" });
    expect(cfg.apiKey).toBe("test-key-123");
    expect(cfg.timeoutMs).toBe(55_000);
    expect(cfg.datasetOverrides).toEqual({});
  });

  it("accepts custom timeoutMs and datasetOverrides", () => {
    const cfg = parseConfig({
      apiKey: "key",
      timeoutMs: 30_000,
      datasetOverrides: { instagram_posts: "custom-id" },
    });
    expect(cfg.timeoutMs).toBe(30_000);
    expect(cfg.datasetOverrides).toEqual({ instagram_posts: "custom-id" });
  });

  it("throws on missing apiKey", () => {
    expect(() => parseConfig({})).toThrow("brightdata apiKey is required");
  });

  it("throws on empty apiKey", () => {
    expect(() => parseConfig({ apiKey: "  " })).toThrow("brightdata apiKey is required");
  });

  it("resolves environment variable substitution in apiKey", () => {
    vi.stubEnv("MY_BD_KEY", "resolved-key-value");
    const cfg = parseConfig({ apiKey: "${MY_BD_KEY}" });
    expect(cfg.apiKey).toBe("resolved-key-value");
  });

  it("throws on unresolvable environment variable", () => {
    delete process.env.NONEXISTENT_VAR;
    expect(() => parseConfig({ apiKey: "${NONEXISTENT_VAR}" })).toThrow(
      "Environment variable NONEXISTENT_VAR is not set",
    );
  });

  it("throws on unknown config keys", () => {
    expect(() => parseConfig({ apiKey: "key", badKey: "val" })).toThrow(
      "brightdata config has unknown keys: badKey",
    );
  });

  it("throws on non-object config", () => {
    expect(() => parseConfig(null)).toThrow("brightdata config required");
    expect(() => parseConfig("string")).toThrow("brightdata config required");
    expect(() => parseConfig([1, 2])).toThrow("brightdata config required");
  });

  it("throws on timeoutMs out of range", () => {
    expect(() => parseConfig({ apiKey: "key", timeoutMs: 1000 })).toThrow(
      "brightdata timeoutMs must be between 5000 and 300000",
    );
    expect(() => parseConfig({ apiKey: "key", timeoutMs: 500_000 })).toThrow(
      "brightdata timeoutMs must be between 5000 and 300000",
    );
  });
});

describe("detectPlatform", () => {
  it("detects instagram", () => {
    expect(detectPlatform("https://www.instagram.com/p/ABC123/")).toBe("instagram");
  });

  it("detects facebook", () => {
    expect(detectPlatform("https://www.facebook.com/user/posts/123")).toBe("facebook");
  });

  it("detects facebook via fb.com", () => {
    expect(detectPlatform("https://fb.com/user")).toBe("facebook");
  });

  it("detects tiktok", () => {
    expect(detectPlatform("https://www.tiktok.com/@user/video/123")).toBe("tiktok");
  });

  it("detects reddit", () => {
    expect(detectPlatform("https://www.reddit.com/r/test/comments/abc/title/")).toBe("reddit");
  });

  it("returns undefined for unknown URLs", () => {
    expect(detectPlatform("https://example.com")).toBeUndefined();
    expect(detectPlatform("https://youtube.com/watch?v=abc")).toBeUndefined();
  });
});

describe("resolveDatasetId", () => {
  const baseCfg: BrightDataConfig = {
    apiKey: "key",
    timeoutMs: 55_000,
    datasetOverrides: {},
  };

  it("returns default dataset ID when no override", () => {
    const id = resolveDatasetId(baseCfg, "instagram_posts");
    expect(id).toBe("gd_lk5ns7kz21pck8jpis");
  });

  it("returns override when present", () => {
    const cfg: BrightDataConfig = {
      ...baseCfg,
      datasetOverrides: { instagram_posts: "custom-override" },
    };
    const id = resolveDatasetId(cfg, "instagram_posts");
    expect(id).toBe("custom-override");
  });

  it("returns key itself when no default and no override", () => {
    const id = resolveDatasetId(baseCfg, "unknown_key");
    expect(id).toBe("unknown_key");
  });
});
