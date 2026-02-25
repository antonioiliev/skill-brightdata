import { Type } from "@sinclair/typebox";
import type { BrightDataConfig } from "../types.js";

export function createProxySessionTool(cfg: BrightDataConfig) {
  return {
    name: "proxy_session",
    label: "Proxy Session",
    description:
      "Generate BrightData Scraping Browser proxy credentials. Returns WebSocket URL for Puppeteer/Playwright browserWSEndpoint and HTTP proxy URL.",
    parameters: Type.Object({
      session_id: Type.Optional(
        Type.String({
          description:
            "Custom session ID for sticky sessions. Auto-generated if omitted.",
        }),
      ),
      country: Type.Optional(
        Type.String({
          description:
            "Two-letter country code for geo-targeting (e.g. 'us', 'gb', 'de')",
        }),
      ),
    }),

    async execute(_toolCallId: string, params: Record<string, unknown>) {
      if (!cfg.customerId) {
        throw new Error("brightdata customerId is required for proxy sessions");
      }
      if (!cfg.proxyZone) {
        throw new Error("brightdata proxyZone is required for proxy sessions");
      }
      if (!cfg.proxyPassword) {
        throw new Error("brightdata proxyPassword is required for proxy sessions");
      }

      const sessionId =
        typeof params.session_id === "string" && params.session_id.trim()
          ? params.session_id.trim()
          : crypto.randomUUID();

      const country =
        typeof params.country === "string" && params.country.trim()
          ? params.country.trim().toLowerCase()
          : undefined;

      // Build username: brd-customer-<id>-zone-<zone>[-country-<cc>]-session-<sid>
      const parts = [
        `brd-customer-${cfg.customerId}`,
        `zone-${cfg.proxyZone}`,
      ];
      if (country) parts.push(`country-${country}`);
      parts.push(`session-${sessionId}`);
      const username = parts.join("-");

      const password = cfg.proxyPassword;
      const auth = `${username}:${password}`;

      const websocketUrl = `wss://${auth}@brd.superproxy.io:9222`;
      const httpProxy = `http://${auth}@brd.superproxy.io:22225`;

      const lines = [
        `## Proxy Session`,
        `**Session ID:** ${sessionId}`,
        country ? `**Country:** ${country}` : null,
        ``,
        `**WebSocket URL** (for Puppeteer \`browserWSEndpoint\` / Playwright CDP):`,
        `\`\`\``,
        websocketUrl,
        `\`\`\``,
        ``,
        `**HTTP Proxy** (for standard proxy config):`,
        `\`\`\``,
        httpProxy,
        `\`\`\``,
        ``,
        `**Username:** \`${username}\``,
      ].filter((l) => l !== null);

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
        details: { sessionId, country, websocketUrl, httpProxy, username },
      };
    },
  };
}
