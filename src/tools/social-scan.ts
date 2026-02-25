import { Type } from "@sinclair/typebox";
import { optionalStringEnum } from "openclaw/plugin-sdk";
import type { BrightDataClient } from "../client.js";
import { executePlatformScrape, coalesce } from "./shared.js";

const SOCIAL_PLATFORMS = ["instagram", "facebook", "tiktok"] as const;

export function createSocialScanTool(client: BrightDataClient) {
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
        description: "Platform override. Auto-detected from URL if omitted.",
      }),
    }),

    async execute(_toolCallId: string, params: Record<string, unknown>) {
      const scraped = await executePlatformScrape(client, params, SOCIAL_PLATFORMS, "posts");

      if (!scraped) {
        const url = String(params.url ?? "").trim();
        return { content: [{ type: "text" as const, text: `No data returned for ${url}` }] };
      }

      const { platform, result: post, url } = scraped;
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

  const author = coalesce(post, "author_name", "user_name", "username");
  if (author) lines.push(`**Author:** ${author}`);

  const caption = coalesce(post, "description", "caption", "text");
  if (caption) lines.push(`\n**Caption:**\n${caption}`);

  const metrics: string[] = [];
  if (post.likes != null) metrics.push(`Likes: ${post.likes}`);
  const comments = coalesce(post, "num_comments", "comments");
  if (comments != null) metrics.push(`Comments: ${comments}`);
  const shares = coalesce(post, "shares", "reposts");
  if (shares != null) metrics.push(`Shares: ${shares}`);
  const views = coalesce(post, "views", "plays");
  if (views != null) metrics.push(`Views: ${views}`);

  if (metrics.length > 0) {
    lines.push(`\n**Engagement:**\n${metrics.join(" | ")}`);
  }

  if (Array.isArray(post.hashtags) && post.hashtags.length > 0) {
    lines.push(`**Hashtags:** ${post.hashtags.join(", ")}`);
  }

  const posted = coalesce(post, "date", "timestamp", "posted_at");
  if (posted) lines.push(`**Posted:** ${posted}`);

  return lines.join("\n");
}
