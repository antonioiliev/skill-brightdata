import { Type } from "@sinclair/typebox";
import { optionalStringEnum } from "openclaw/plugin-sdk";
import type { BrightDataClient, ScrapeResult } from "../client.js";
import type { BrightDataConfig } from "../types.js";
import { detectPlatform } from "../types.js";

const PROFILE_PLATFORMS = ["instagram", "facebook", "tiktok", "reddit"] as const;

export function createProfileLookupTool(client: BrightDataClient, cfg: BrightDataConfig) {
  return {
    name: "profile_lookup",
    label: "Profile Lookup",
    description:
      "Look up a social media profile (Instagram, Facebook, TikTok, Reddit) and extract follower count, bio, verification status, and engagement metrics.",
    parameters: Type.Object({
      url: Type.String({
        description:
          "URL of the social media profile to look up",
      }),
      platform: optionalStringEnum(PROFILE_PLATFORMS, {
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

      if (!platform || !PROFILE_PLATFORMS.includes(platform as typeof PROFILE_PLATFORMS[number])) {
        throw new Error(
          `Could not detect platform from URL. Provide a platform parameter (${PROFILE_PLATFORMS.join(", ")}).`,
        );
      }

      const datasetKey = `${platform}_profiles`;
      const results: ScrapeResult = await client.scrapeSync(datasetKey, [{ url }]);

      if (!results.length) {
        return {
          content: [{ type: "text" as const, text: `No profile data returned for ${url}` }],
        };
      }

      const profile = results[0] ?? {};
      const summary = formatProfileSummary(platform, profile, url);

      return {
        content: [{ type: "text" as const, text: summary }],
        details: { platform, profile },
      };
    },
  };
}

function formatProfileSummary(
  platform: string,
  profile: Record<string, unknown>,
  url: string,
): string {
  const lines: string[] = [`## Profile Lookup`, `**Platform:** ${platform}`, `**URL:** ${url}`];

  const username = profile.username ?? profile.user_name ?? profile.name;
  if (username) lines.push(`**Username:** ${username}`);

  const displayName = profile.full_name ?? profile.display_name ?? profile.name;
  if (displayName && displayName !== username) {
    lines.push(`**Display Name:** ${displayName}`);
  }

  if (profile.is_verified != null) {
    lines.push(`**Verified:** ${profile.is_verified ? "Yes" : "No"}`);
  }

  if (profile.biography || profile.bio || profile.description) {
    lines.push(`\n**Bio:**\n${profile.biography ?? profile.bio ?? profile.description}`);
  }

  const stats: string[] = [];
  if (profile.followers != null || profile.follower_count != null) {
    stats.push(`Followers: ${profile.followers ?? profile.follower_count}`);
  }
  if (profile.following != null || profile.following_count != null) {
    stats.push(`Following: ${profile.following ?? profile.following_count}`);
  }
  if (profile.posts_count != null || profile.media_count != null) {
    stats.push(`Posts: ${profile.posts_count ?? profile.media_count}`);
  }

  if (stats.length > 0) {
    lines.push(`\n**Stats:**\n${stats.join(" | ")}`);
  }

  if (profile.engagement_rate != null) {
    lines.push(`**Engagement Rate:** ${profile.engagement_rate}`);
  }

  if (profile.profile_pic_url || profile.avatar) {
    lines.push(`**Profile Picture:** ${profile.profile_pic_url ?? profile.avatar}`);
  }

  return lines.join("\n");
}
