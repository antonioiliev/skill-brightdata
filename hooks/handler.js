// brightdata bootstrap hook
// Injects BrightData tool usage guidance on agent:bootstrap events.

const BRIGHTDATA_GUIDANCE = `## BrightData Tools

You have access to BrightData social media intelligence tools. Use them when the user asks about social media content or creator profiles.

### Tool selection guide

| Need | Tool | When |
|------|------|------|
| Post engagement data | \`social_media_scan\` | User shares an Instagram/Facebook/TikTok post URL |
| Creator/profile stats | \`profile_lookup\` | User wants follower count, bio, verification for a profile |
| Reddit thread analysis | \`reddit_scan\` | User shares a Reddit post URL |
| Browser proxy session | \`proxy_session\` | User needs proxy credentials for browser automation |

### Prefer BrightData tools over \`web_fetch\` when:
- The target is a social media post or profile (these sites block standard scraping)
- The user explicitly asks to "scan", "scrape", or "look up" social content
- You need structured engagement data (likes, comments, followers) rather than raw HTML`;

module.exports = {
  name: "brightdata-bootstrap",
  events: ["agent:bootstrap"],
  handler(event) {
    if (event.type !== "agent:bootstrap") return;

    if (!event.context.bootstrapFiles) {
      event.context.bootstrapFiles = [];
    }

    event.context.bootstrapFiles.push({
      name: "BRIGHTDATA_TOOLS.md",
      content: BRIGHTDATA_GUIDANCE,
    });
  },
};
