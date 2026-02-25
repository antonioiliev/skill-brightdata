import { Type } from "@sinclair/typebox";
import { optionalStringEnum } from "openclaw/plugin-sdk";
import type { BrightDataClient } from "../client.js";
import { executePlatformScrape, coalesce } from "./shared.js";

const PROFILE_PLATFORMS = ["instagram", "facebook", "tiktok", "reddit"] as const;

export function createProfileLookupTool(client: BrightDataClient) {
  return {
    name: "profile_lookup",
    label: "Profile Lookup",
    description:
      "Look up a social media profile (Instagram, Facebook, TikTok, Reddit) and extract follower count, bio, verification status, and engagement metrics.",
    parameters: Type.Object({
      url: Type.String({
        description: "URL of the social media profile to look up",
      }),
      platform: optionalStringEnum(PROFILE_PLATFORMS, {
        description: "Platform override. Auto-detected from URL if omitted.",
      }),
    }),

    async execute(_toolCallId: string, params: Record<string, unknown>) {
      const scraped = await executePlatformScrape(client, params, PROFILE_PLATFORMS, "profiles");

      if (!scraped) {
        const url = String(params.url ?? "").trim();
        return { content: [{ type: "text" as const, text: `No profile data returned for ${url}` }] };
      }

      const { platform, result: profile, url } = scraped;
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

  const username = coalesce(profile, "username", "user_name", "name");
  if (username) lines.push(`**Username:** ${username}`);

  const displayName = coalesce(profile, "full_name", "display_name", "name");
  if (displayName && displayName !== username) {
    lines.push(`**Display Name:** ${displayName}`);
  }

  if (profile.is_verified != null) {
    lines.push(`**Verified:** ${profile.is_verified ? "Yes" : "No"}`);
  }

  const bio = coalesce(profile, "biography", "bio", "description");
  if (bio) lines.push(`\n**Bio:**\n${bio}`);

  const stats: string[] = [];
  const followers = coalesce(profile, "followers", "follower_count");
  if (followers != null) stats.push(`Followers: ${followers}`);
  const following = coalesce(profile, "following", "following_count");
  if (following != null) stats.push(`Following: ${following}`);
  const posts = coalesce(profile, "posts_count", "media_count");
  if (posts != null) stats.push(`Posts: ${posts}`);

  if (stats.length > 0) {
    lines.push(`\n**Stats:**\n${stats.join(" | ")}`);
  }

  if (profile.engagement_rate != null) {
    lines.push(`**Engagement Rate:** ${profile.engagement_rate}`);
  }

  const pic = coalesce(profile, "profile_pic_url", "avatar");
  if (pic) lines.push(`**Profile Picture:** ${pic}`);

  return lines.join("\n");
}
