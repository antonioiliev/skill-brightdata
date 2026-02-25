import { Type } from "@sinclair/typebox";
import type { BrightDataClient, ScrapeResult } from "../client.js";
import { detectPlatform } from "../types.js";
import { coalesce } from "./shared.js";

export function createRedditScanTool(client: BrightDataClient) {
  return {
    name: "reddit_scan",
    label: "Reddit Scan",
    description:
      "Scan a Reddit post and its top comments. Returns post content, score, author, subreddit info, and top N comments.",
    parameters: Type.Object({
      url: Type.String({
        description: "URL of the Reddit post to scan",
      }),
      include_comments: Type.Optional(
        Type.Boolean({
          description: "Include top comments (default: true)",
        }),
      ),
      max_comments: Type.Optional(
        Type.Number({
          description: "Maximum number of comments to return (default: 20)",
        }),
      ),
    }),

    async execute(_toolCallId: string, params: Record<string, unknown>) {
      const url = String(params.url ?? "").trim();
      if (!url) throw new Error("url is required");

      if (detectPlatform(url) !== "reddit") {
        throw new Error("URL does not appear to be a Reddit link");
      }

      const includeComments = params.include_comments !== false;
      const maxComments =
        typeof params.max_comments === "number" ? Math.floor(params.max_comments) : 20;

      const postResults: ScrapeResult = await client.scrapeSync("reddit_posts", [{ url }]);

      if (!postResults.length) {
        return {
          content: [{ type: "text" as const, text: `No data returned for ${url}` }],
        };
      }

      const post = postResults[0] ?? {};
      const lines: string[] = [`## Reddit Post Scan`, `**URL:** ${url}`];

      const subreddit = coalesce(post, "subreddit", "subreddit_name");
      if (subreddit) lines.push(`**Subreddit:** r/${subreddit}`);
      if (post.author) lines.push(`**Author:** u/${post.author}`);
      if (post.title) lines.push(`**Title:** ${post.title}`);
      if (post.score != null) lines.push(`**Score:** ${post.score}`);
      if (post.upvote_ratio != null) lines.push(`**Upvote Ratio:** ${post.upvote_ratio}`);
      if (post.num_comments != null) lines.push(`**Comment Count:** ${post.num_comments}`);

      const body = coalesce(post, "selftext", "body");
      if (body) lines.push(`\n**Post Body:**\n${body}`);

      // Fetch comments if requested
      let comments: ScrapeResult = [];
      if (includeComments) {
        try {
          comments = await client.scrapeSync("reddit_comments", [{ url }]);
        } catch {
          lines.push(`\n*Could not fetch comments.*`);
        }
      }

      if (comments.length > 0) {
        const topComments = comments.slice(0, maxComments);
        lines.push(`\n### Top Comments (${topComments.length})`);

        for (const comment of topComments) {
          const author = comment.author ?? "unknown";
          const score = comment.score != null ? ` [${comment.score} pts]` : "";
          const commentBody = coalesce(comment, "body", "text") ?? "";
          lines.push(`\n**u/${author}**${score}\n${commentBody}`);
        }
      }

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
        details: { post, comments: comments.slice(0, maxComments) },
      };
    },
  };
}
