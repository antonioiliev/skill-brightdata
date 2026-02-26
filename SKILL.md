---
name: brightdata
description: "Social media intelligence: scan Instagram/Facebook/TikTok/LinkedIn posts, look up creator profiles, scan Reddit threads. Triggers on: 'scan post', 'look up profile', 'instagram', 'tiktok', 'reddit scan', 'linkedin', 'social media', 'creator lookup', 'scrape'."
metadata: { "openclaw": { "always": true } }
---

# BrightData Skill

Social media intelligence tools powered by the BrightData Web Scraper API. Scan posts, look up profiles, and analyze Reddit threads.

## Tools

### social_media_scan

Scan a single social media post (Instagram, Facebook, TikTok, LinkedIn) and extract structured data.

**When to use:** The user shares a social media post URL and wants engagement data, caption, hashtags, or author info.

**Example URLs:**
- `https://www.instagram.com/p/ABC123/`
- `https://www.instagram.com/reel/ABC123/`
- `https://www.facebook.com/username/posts/123456`
- `https://www.tiktok.com/@user/video/123456`
- `https://www.linkedin.com/posts/username_topic-abc123`

**Returns:** Platform, author, likes, comments, shares, caption, hashtags, timestamp, media URLs.

### profile_lookup

Look up a social media creator profile and extract profile-level data.

**When to use:** The user wants creator/influencer stats — follower count, bio, verification status, engagement metrics.

**Example URLs:**
- `https://www.instagram.com/username/`
- `https://www.facebook.com/username`
- `https://www.tiktok.com/@username`
- `https://www.reddit.com/user/username`
- `https://www.linkedin.com/in/username/`

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

---

## Dataset Reference

Each dataset supports specific input parameters. All dates use **MM-DD-YYYY** format.

### Instagram

**Posts** (`instagram_posts`) — Scan a single post or discover recent posts from a profile.

| Mode | Input | Optional filters |
|------|-------|-----------------|
| Single post | `url` (post/reel URL) | — |
| Discover from profile | `url` (profile URL) | `num_of_posts`, `start_date`, `end_date`, `post_type` (`post` or `reel`), `posts_to_not_include` (array of post IDs) |

**Profiles** (`instagram_profiles`) — Snapshot of a single profile.

| Input | Optional filters |
|-------|-----------------|
| `url` (profile URL) | — |

Returns: followers, posts_count, is_verified, is_business_account, avg_engagement, profile_image_link.

### Facebook

**Posts** (`facebook_posts`) — Scan a single post or discover posts from a profile/group.

| Mode | Input | Optional filters |
|------|-------|-----------------|
| Single post | `url` (post URL) | — |
| From profile | `url` (profile/page URL) | `num_of_posts`, `start_date`, `end_date`, `posts_to_not_include` |
| From group | `url` (group URL) | `num_of_posts`, `start_date`, `end_date`, `posts_to_not_include` |

**Profiles** (`facebook_profiles`) — Page/profile info by URL.

| Input | Optional filters |
|-------|-----------------|
| `url` (profile/page URL) | — |

### TikTok

**Posts** (`tiktok_posts`) — Scan a single video or discover from a profile.

| Mode | Input | Optional filters |
|------|-------|-----------------|
| Single video | `url` (video URL) | — |
| From profile | `url` (profile URL) | `num_of_posts`, `start_date`, `end_date`, `post_type` (`post` or `reel`), `posts_to_not_include` |

**Profiles** (`tiktok_profiles`) — Creator profile snapshot.

| Input | Optional filters |
|-------|-----------------|
| `url` (profile URL) | — |

Returns: followers, following, likes, videos_count, biography, is_verified, engagement_rate.

### Reddit

**Posts** (`reddit_posts`) — Scan a single thread.

| Input | Optional filters |
|-------|-----------------|
| `url` (post URL) | — |

**Comments** (`reddit_comments`) — Fetch comments from a post.

| Input | Optional filters |
|-------|-----------------|
| `url` (post URL) | `days_back` (only comments within N days) |

### LinkedIn

**Profiles** (`linkedin_profiles`) — Professional profile snapshot.

| Input | Optional filters |
|-------|-----------------|
| `url` (profile URL, e.g. `linkedin.com/in/name/`) | — |

Returns: name, headline, about, country_code, current_company, followers, connections, skills, education, certifications.

**Posts** (`linkedin_posts`) — Single post or article.

| Input | Optional filters |
|-------|-----------------|
| `url` (post/article URL) | — |

Returns: title, post_text, hashtags, num_likes, num_comments, date_posted, user_followers.

**Companies** (`linkedin_companies`) — Company page snapshot.

| Input | Optional filters |
|-------|-----------------|
| `url` (company URL, e.g. `linkedin.com/company/name/`) | — |

Returns: name, about, specialties, followers, employees_in_linkedin, founding_year, headquarters, locations.

### Filter parameter summary

These optional parameters work across platforms when scanning from a profile/page URL (discovery mode):

| Parameter | Type | Description |
|-----------|------|-------------|
| `num_of_posts` | number | Max posts to collect. Omit for unlimited. |
| `start_date` | string | From date (MM-DD-YYYY). |
| `end_date` | string | Until date (MM-DD-YYYY). |
| `post_type` | string | `post` or `reel` (Instagram/TikTok). |
| `posts_to_not_include` | array | Post IDs to skip. |
| `days_back` | number | Reddit comments: only within N days. |
