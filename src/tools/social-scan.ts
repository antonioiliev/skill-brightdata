import { Type } from "@sinclair/typebox";
import { optionalStringEnum } from "openclaw/plugin-sdk";
import type { BrightDataClient, ScrapeResult } from "../client.js";
import type { BrightDataConfig } from "../types.js";
import { detectPlatform } from "../types.js";

const SOCIAL_PLATFORMS = ["instagram", "facebook", "tiktok"] as const;

export function createSocialScanTool(client: BrightDataClient, cfg: BrightDataConfig) {
  return {
    name: "social_media_scan",
    label: "Social Media Scan",
    description:
      "Scan a social media post (Instagram, Facebook, TikTok) and extract structured engagement data including likes, comments, caption, hashtags, and author info.",
    parameters: Type.Object({
      url: Type.String({
        description:
          "URL of the social media post to scan (Instagram, Facebook, or TikTok post/reel URL)",
      }),
      platform: optionalStringEnum(SOCIAL_PLATFORMS, {
        description:
          "Platform override. Auto-detected from URL if omitted.",
      }),
    }),

    async execute(_toolCallId: string, params: Record<string, unknown>) {
      const url = String(params.url ?? "").trim();
      if (!url) throw new Error("url is required");

      const platform =
        (typeof params.platform === "string" ? params.platform : undefined) ??
        detectPlatform(url);

      if (!platform || !SOCIAL_PLATFORMS.includes(platform as typeof SOCIAL_PLATFORMS[number])) {
        throw new Error(
          `Could not detect platform from URL. Provide a platform parameter (${SOCIAL_PLATFORMS.join(", ")}).`,
        );
      }

      const datasetKey = `${platform}_posts`;
      const results: ScrapeResult = await client.scrapeSync(datasetKey, [{ url }]);

      if (!results.length) {
        return {
          content: [{ type: "text" as const, text: `No data returned for ${url}` }],
        };
      }

      const post = results[0] ?? {};
      const summary = formatPostSummary(platform, post, url);

      return {
        content: [{ type: "text" as const, text: summary }],
        details: { platform, post },
      };
    },
  };
}

function formatPostSummary(
  platform: string,
  post: Record<string, unknown>,
  url: string,
): string {
  const lines: string[] = [`## Social Media Post Scan`, `**Platform:** ${platform}`, `**URL:** ${url}`];

  if (post.author_name || post.user_name || post.username) {
    lines.push(`**Author:** ${post.author_name ?? post.user_name ?? post.username}`);
  }

  if (post.description || post.caption || post.text) {
    lines.push(`\n**Caption:**\n${post.description ?? post.caption ?? post.text}`);
  }

  const metrics: string[] = [];
  if (post.likes != null) metrics.push(`Likes: ${post.likes}`);
  if (post.num_comments != null || post.comments != null) {
    metrics.push(`Comments: ${post.num_comments ?? post.comments}`);
  }
  if (post.shares != null || post.reposts != null) {
    metrics.push(`Shares: ${post.shares ?? post.reposts}`);
  }
  if (post.views != null || post.plays != null) {
    metrics.push(`Views: ${post.views ?? post.plays}`);
  }

  if (metrics.length > 0) {
    lines.push(`\n**Engagement:**\n${metrics.join(" | ")}`);
  }

  if (Array.isArray(post.hashtags) && post.hashtags.length > 0) {
    lines.push(`**Hashtags:** ${post.hashtags.join(", ")}`);
  }

  if (post.date || post.timestamp || post.posted_at) {
    lines.push(`**Posted:** ${post.date ?? post.timestamp ?? post.posted_at}`);
  }

  return lines.join("\n");
}
