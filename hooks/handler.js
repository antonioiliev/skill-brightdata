// brightdata bootstrap hook
// Injects agent-aware social media extraction guidance on agent:bootstrap events.

// ---------------------------------------------------------------------------
// Guidance for the dedicated social-media agent (direct tool usage)
// ---------------------------------------------------------------------------
const EXTRACTOR_AGENT_GUIDANCE = `## Social Media Extractor

You are the dedicated social media extractor agent. Your job is to scan social media content and return structured results to the parent agent.

### Tool selection

| Need | Tool | When |
|------|------|------|
| Post engagement data | \`social_media_scan\` | Instagram/Facebook/TikTok post URL |
| Creator/profile stats | \`profile_lookup\` | Profile URL — follower count, bio, verification |
| Reddit thread analysis | \`reddit_scan\` | Reddit post URL — content + top comments |

### Workflow

1. **Identify the URL type** — post, profile, or Reddit thread.
2. **Pick the right tool** using the table above.
3. **Call the tool** with the URL from the task.
4. **Summarize the results** clearly — include key metrics (likes, comments, followers, etc.) and any notable details.
5. **Announce back** to the parent agent with the structured summary.

### Prefer these tools over \`web_fetch\` when:
- The target is a social media post or profile (these sites block standard scraping)
- You need structured engagement data (likes, comments, followers) rather than raw HTML

### Important
- Always use the exact URL provided — do not modify or guess URLs.
- If a tool call fails, report the error clearly rather than retrying silently.
- Keep your response focused on the data — the parent agent will handle interpretation and follow-up with the user.`;

// ---------------------------------------------------------------------------
// Guidance for delegating agents (main, research)
// ---------------------------------------------------------------------------
const DELEGATOR_GUIDANCE = `## Social Media Intelligence (via sub-agent)

You can delegate social media intelligence tasks to the **social-media** sub-agent. It has specialized tools for scanning social media content that bypass anti-bot protections.

### What social-media can do

| Capability | Details |
|------------|---------|
| Scan social media posts | Instagram, Facebook, TikTok — returns engagement data, captions, hashtags |
| Look up creator profiles | Follower counts, bio, verification status, engagement metrics |
| Analyze Reddit threads | Post content + top comments with scores |

### When to delegate to social-media

- User shares an Instagram / Facebook / TikTok post URL and wants data about it
- User asks to "scan", "scrape", or "look up" a social media post or profile
- User shares a Reddit thread URL and wants discussion analysis
- You need structured social media data (likes, comments, followers)

### How to delegate

Spawn the **social-media** agent with a clear task. Include:
1. The exact URL(s) to scan
2. What data the user needs (engagement metrics, profile stats, thread summary, etc.)

Example task: "Scan this Instagram post and report engagement metrics: https://www.instagram.com/p/ABC123/"

### When NOT to delegate
- Simple web page fetching — use \`web_fetch\` directly
- Public API data — call APIs directly
- Sites that don't need anti-bot bypass — use standard HTTP tools`;

module.exports = {
  name: "brightdata-bootstrap",
  events: ["agent:bootstrap"],
  handler(event) {
    if (event.type !== "agent:bootstrap") return;

    const agentId = event.context.agentId;
    let content;

    if (agentId === "social-media") {
      content = EXTRACTOR_AGENT_GUIDANCE;
    } else if (agentId === "main" || agentId === "research") {
      content = DELEGATOR_GUIDANCE;
    } else {
      // Other agents don't need social media extraction context
      return;
    }

    if (!event.context.bootstrapFiles) {
      event.context.bootstrapFiles = [];
    }

    event.context.bootstrapFiles.push({
      name: "SOCIAL_MEDIA_TOOLS.md",
      content,
    });
  },
};
