# BrightData

An [OpenClaw](https://github.com/openclaw/openclaw) plugin that adds social media intelligence tools powered by the BrightData Web Scraper API. Scan posts, look up creator profiles, and analyze Reddit threads without getting blocked by anti-bot protections.

## What It Does

Registers three tools that let your agent extract structured data from social media platforms:

- **`social_media_scan`** — Scan a single post (Instagram, Facebook, TikTok, LinkedIn) and extract engagement data, captions, hashtags, and author info
- **`profile_lookup`** — Look up a creator profile and get follower count, bio, verification status, and engagement metrics
- **`reddit_scan`** — Scan a Reddit thread and extract the post content plus top comments with scores

All requests go through BrightData's Web Scraper API, which handles anti-bot bypass, rate limiting, and data extraction.

## Installation

Clone into your skills directory:

```bash
# Workspace-level (this agent only)
git clone https://github.com/antonioiliev/skill-brightdata.git ./skills/brightdata

# User-level (shared across all agents)
git clone https://github.com/antonioiliev/skill-brightdata.git ~/.openclaw/skills/brightdata
```

Then add the plugin config to your `openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "brightdata": {
        "enabled": true,
        "config": {
          "apiKey": "${BRIGHTDATA_API_KEY}"
        }
      }
    }
  }
}
```

Agents that need these tools also need `tools.alsoAllow`:

```json
{
  "agents": {
    "list": [
      {
        "id": "social-media",
        "skills": ["brightdata"],
        "tools": { "alsoAllow": ["brightdata"] }
      }
    ]
  }
}
```

## Configuration

| Key | Required | Description |
|-----|----------|-------------|
| `apiKey` | Yes | BrightData API key. Supports `${ENV_VAR}` syntax. |
| `timeoutMs` | No | Request timeout in milliseconds (default: 55000). |
| `datasetOverrides` | No | Override default BrightData dataset IDs per platform/type (e.g. `{ "instagram_profiles": "gd_custom_id" }`). |

## Supported Platforms

| Platform | Posts | Profiles | Comments |
|----------|-------|----------|----------|
| Instagram | `instagram_posts` | `instagram_profiles` | - |
| Facebook | `facebook_posts` | `facebook_profiles` | - |
| TikTok | `tiktok_posts` | `tiktok_profiles` | - |
| LinkedIn | `linkedin_posts` | `linkedin_profiles` | - |
| Reddit | `reddit_posts` | - | `reddit_comments` |

Platform is auto-detected from the URL. You can override detection with the `platform` parameter.

## Agent Delegation Pattern

This plugin works best with a dedicated `social-media` sub-agent:

- **social-media agent** — Has the tools directly. Receives a task with URLs and data requirements, calls the appropriate tool, returns structured results.
- **main / research agents** — Delegate social media tasks to the social-media sub-agent.

## Requirements

- A [BrightData](https://brightdata.com) account with Web Scraper API access
- Active datasets for the platforms you want to scrape (dataset IDs are account-specific)

## License

MIT
