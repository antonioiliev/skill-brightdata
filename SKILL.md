---
name: brightdata
description: "Social media intelligence: scan Instagram/Facebook/TikTok posts, look up creator profiles, scan Reddit threads. Triggers on: 'scan post', 'look up profile', 'instagram', 'tiktok', 'reddit scan', 'social media', 'creator lookup', 'scrape'."
metadata: { "openclaw": { "always": true } }
---

# BrightData Skill

Social media intelligence tools powered by the BrightData Web Scraper API. Scan posts, look up profiles, and analyze Reddit threads.

## Tools

### social_media_scan

Scan a single social media post (Instagram, Facebook, TikTok) and extract structured data.

**When to use:** The user shares a social media post URL and wants engagement data, caption, hashtags, or author info.

**Example URLs:**
- `https://www.instagram.com/p/ABC123/`
- `https://www.instagram.com/reel/ABC123/`
- `https://www.facebook.com/username/posts/123456`
- `https://www.tiktok.com/@user/video/123456`

**Returns:** Platform, author, likes, comments, shares, caption, hashtags, timestamp, media URLs.

### profile_lookup

Look up a social media creator profile and extract profile-level data.

**When to use:** The user wants creator/influencer stats — follower count, bio, verification status, engagement metrics.

**Example URLs:**
- `https://www.instagram.com/username/`
- `https://www.facebook.com/username`
- `https://www.tiktok.com/@username`
- `https://www.reddit.com/user/username`

**Returns:** Username, display name, followers, following, post count, verification status, bio, profile picture URL.

### reddit_scan

Scan a Reddit post and its comments.

**When to use:** The user shares a Reddit thread URL and wants the post content plus top comments and discussion summary.

**Example URLs:**
- `https://www.reddit.com/r/subreddit/comments/abc123/post_title/`
- `https://reddit.com/r/subreddit/comments/abc123/`

**Returns:** Post title, body, score, author, subreddit, and top N comments with scores and authors.

## Agent Roles

This skill supports a delegation pattern with a dedicated `social-media` agent:

- **social-media agent** — Runs the tools directly. Receives a task with URL(s) and data requirements, calls the appropriate tool, and announces structured results back.
- **main / research agents** — Delegate social media intelligence tasks to the `social-media` sub-agent instead of calling tools directly.

## When NOT to Use

- For simple web page fetching — use built-in `web_fetch` instead
- For public API data — call APIs directly
- For websites that don't require anti-bot bypass — use standard HTTP tools
