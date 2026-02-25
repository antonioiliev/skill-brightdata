import type { AnyAgentTool, OpenClawPluginApi } from "openclaw/plugin-sdk";
import { parseConfig } from "./src/types.js";
import { BrightDataClient } from "./src/client.js";
import { createSocialScanTool } from "./src/tools/social-scan.js";
import { createProfileLookupTool } from "./src/tools/profile-lookup.js";
import { createRedditScanTool } from "./src/tools/reddit-scan.js";
import { createProxySessionTool } from "./src/tools/proxy-session.js";

export default function register(api: OpenClawPluginApi) {
  const cfg = parseConfig(api.pluginConfig);
  const client = new BrightDataClient(cfg);

  api.registerTool(
    createSocialScanTool(client) as unknown as AnyAgentTool,
    { optional: true },
  );
  api.registerTool(
    createProfileLookupTool(client) as unknown as AnyAgentTool,
    { optional: true },
  );
  api.registerTool(
    createRedditScanTool(client) as unknown as AnyAgentTool,
    { optional: true },
  );

  // Only register proxy tool if all proxy config fields are present
  if (cfg.customerId && cfg.proxyZone && cfg.proxyPassword) {
    api.registerTool(
      createProxySessionTool(cfg) as unknown as AnyAgentTool,
      { optional: true },
    );
  }
}
