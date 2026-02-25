import { describe, expect, it, vi } from "vitest";
import { coalesce, executePlatformScrape } from "./shared.js";

describe("coalesce", () => {
  it("returns first non-null value", () => {
    expect(coalesce({ a: null, b: "hello", c: "world" }, "a", "b", "c")).toBe("hello");
  });

  it("returns first value when non-null", () => {
    expect(coalesce({ a: 42, b: "hello" }, "a", "b")).toBe(42);
  });

  it("returns undefined when all values are null", () => {
    expect(coalesce({ a: null, b: null }, "a", "b")).toBeUndefined();
  });

  it("returns undefined when all keys are missing", () => {
    expect(coalesce({}, "a", "b")).toBeUndefined();
  });

  it("treats 0 and empty string as non-null", () => {
    expect(coalesce({ a: 0 }, "a")).toBe(0);
    expect(coalesce({ a: "" }, "a")).toBe("");
  });

  it("skips undefined values", () => {
    expect(coalesce({ a: undefined, b: "found" }, "a", "b")).toBe("found");
  });
});

describe("executePlatformScrape", () => {
  it("throws on missing url", async () => {
    const mockClient = { scrapeSync: vi.fn() } as any;
    await expect(
      executePlatformScrape(mockClient, {}, ["instagram"], "posts"),
    ).rejects.toThrow("url is required");
  });

  it("throws on undetectable platform", async () => {
    const mockClient = { scrapeSync: vi.fn() } as any;
    await expect(
      executePlatformScrape(
        mockClient,
        { url: "https://example.com/page" },
        ["instagram", "facebook"],
        "posts",
      ),
    ).rejects.toThrow("Could not detect platform from URL");
  });

  it("builds correct dataset key from platform and suffix", async () => {
    const mockClient = {
      scrapeSync: vi.fn().mockResolvedValue([{ id: "result-1" }]),
    } as any;

    const result = await executePlatformScrape(
      mockClient,
      { url: "https://www.instagram.com/p/ABC123/" },
      ["instagram", "facebook"],
      "posts",
    );

    expect(mockClient.scrapeSync).toHaveBeenCalledWith("instagram_posts", [
      { url: "https://www.instagram.com/p/ABC123/" },
    ]);
    expect(result).toEqual({
      platform: "instagram",
      result: { id: "result-1" },
      url: "https://www.instagram.com/p/ABC123/",
    });
  });

  it("returns null when no results", async () => {
    const mockClient = {
      scrapeSync: vi.fn().mockResolvedValue([]),
    } as any;

    const result = await executePlatformScrape(
      mockClient,
      { url: "https://www.instagram.com/p/ABC123/" },
      ["instagram"],
      "posts",
    );
    expect(result).toBeNull();
  });

  it("uses explicit platform parameter over detection", async () => {
    const mockClient = {
      scrapeSync: vi.fn().mockResolvedValue([{ data: true }]),
    } as any;

    await executePlatformScrape(
      mockClient,
      { url: "https://www.instagram.com/p/ABC123/", platform: "facebook" },
      ["instagram", "facebook"],
      "profiles",
    );

    expect(mockClient.scrapeSync).toHaveBeenCalledWith("facebook_profiles", [
      { url: "https://www.instagram.com/p/ABC123/" },
    ]);
  });
});
