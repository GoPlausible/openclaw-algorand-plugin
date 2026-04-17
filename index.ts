import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { ALGORAND_MCP, GOPLAUSIBLE_SERVICES } from "./lib/mcp-servers.js";
import { runSetup, type AlgorandPluginConfig } from "./setup.js";
import { x402Fetch } from "./lib/x402-fetch.js";
import {
  getMcpBinaryPath,
  isMcpBinaryBundled,
  isMcporterConfigured,
  mcporterConfigPath,
  upsertMcporterConfig,
} from "./lib/mcporter.js";
import {
  ensureWorkspaceMemoryIndex,
  resolveWorkspaceDir,
  runFirstLoadInit,
  writeMemoryFile,
  writePluginConfig,
  type WorkspaceApi,
} from "./lib/workspace.js";

const PLUGIN_ROOT = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ID = "openclaw-algorand-plugin";

type OpenClawPluginApi = WorkspaceApi & {
  id: string;
  name: string;
  version?: string;
  pluginConfig?: Partial<AlgorandPluginConfig>;
  registerTool: (tool: object, options?: object) => void;
  registerCli: (fn: (ctx: { program: any }) => void, options: { commands: string[] }) => void;
};

function register(api: OpenClawPluginApi) {
  const pluginConfig: Partial<AlgorandPluginConfig> = api.pluginConfig ?? {};
  const workspacePath = resolveWorkspaceDir(api);

  try { runFirstLoadInit(api, PLUGIN_ROOT, workspacePath); }
  catch (err) { api.logger.warn(`[algorand-plugin] first-load init failed: ${err}`); }

  if (pluginConfig.enableX402 !== false) {
    api.registerTool(
      {
        name: "x402_fetch",
        description:
          "Fetch a URL with x402 payment protocol support. On HTTP 402, returns structured PaymentRequirements and step-by-step instructions to build payment using algorand-mcp tools. Use paymentHeader to retry with a signed payment.",
        parameters: {
          type: "object",
          properties: {
            url: { type: "string", description: "The URL to fetch" },
            method: {
              type: "string",
              description: "HTTP method (default: GET)",
              enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
              default: "GET",
            },
            headers: {
              type: "object",
              description: "Additional request headers as key-value pairs",
              additionalProperties: { type: "string" },
            },
            body: { type: "string", description: "Request body (for POST/PUT/PATCH)" },
            paymentHeader: {
              type: "string",
              description: "JSON string for X-PAYMENT header — the signed payment payload from the x402 payment flow",
            },
          },
          required: ["url"],
        },
        async execute(
          _id: string,
          params: { url: string; method?: string; headers?: Record<string, string>; body?: string; paymentHeader?: string },
        ) {
          const result = await x402Fetch(params);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        },
      },
      { scope: "agent" },
    );
  }

  api.registerCli(
    ({ program }) => {
      const algorand = program
        .command("algorand-plugin")
        .description("Algorand blockchain integration (GoPlausible)");

      algorand
        .command("setup")
        .description("Reconfigure Algorand plugin (interactive)")
        .action(async () => {
          console.log("\n🔷 Reconfiguring Algorand plugin...\n");

          const mem = writeMemoryFile(PLUGIN_ROOT, workspacePath);
          console.log(`  ${mem.success ? "✅" : "❌"} ${mem.message}`);

          const memIdx = ensureWorkspaceMemoryIndex(PLUGIN_ROOT, workspacePath);
          console.log(`  ${memIdx.success ? "✅" : "❌"} ${memIdx.message}`);

          const mcp = upsertMcporterConfig(PLUGIN_ROOT);
          console.log(`  ${mcp.success ? "✅" : "⚠️"} ${mcp.message}`);

          console.log("");
          const newConfig = await runSetup(pluginConfig);
          if (newConfig) {
            const result = writePluginConfig(newConfig as unknown as Record<string, unknown>);
            if (result.success) {
              console.log("\n✅ Config saved to ~/.openclaw/openclaw.json");
              console.log("   Restart gateway to apply: openclaw gateway restart\n");
            } else {
              console.error(`\n❌ Failed to save config: ${result.error}`);
            }
          }
        });

      algorand
        .command("status")
        .description("Show Algorand plugin status")
        .action(() => {
          const mcpBinary = getMcpBinaryPath(PLUGIN_ROOT);
          const bundled = isMcpBinaryBundled(PLUGIN_ROOT);
          const mcporterOk = isMcporterConfigured();

          console.log("\n🔷 Algorand Plugin Status\n");
          console.log("  Skills:");
          for (const s of [
            "algorand-development", "algorand-typescript", "algorand-python",
            "algorand-interaction", "algorand-x402-typescript", "algorand-x402-python",
            "haystack-router-development", "haystack-router-interaction", "alpha-arcade-interaction",
          ]) console.log(`    • ${s}`);
          console.log("");
          console.log("  MCP Server:");
          console.log(`    Binary:    ${bundled ? `✅ ${mcpBinary}` : "⚠️  Not bundled (reinstall plugin)"}`);
          console.log(`    mcporter:  ${mcporterOk ? `✅ Configured (${mcporterConfigPath()})` : "⚠️  Not configured (run setup)"}`);
          console.log("");
          console.log("  Config:");
          console.log(`    x402:      ${pluginConfig.enableX402 !== false ? "Enabled" : "Disabled"}`);
          console.log("");
          console.log("  Links:");
          console.log(`    GoPlausible: ${GOPLAUSIBLE_SERVICES.website}`);
          console.log(`    Algorand x402: ${GOPLAUSIBLE_SERVICES.x402}`);
          console.log(`    Algorand x402 Facilitator: ${GOPLAUSIBLE_SERVICES.facilitator}`);
          console.log(`    Algorand x402 Test endpoints: ${GOPLAUSIBLE_SERVICES.test}`);
          console.log("");
        });

      algorand
        .command("mcp-config")
        .description("Show MCP config snippet for external coding agents (Claude Code, Cursor, etc.)")
        .action(() => {
          const command = getMcpBinaryPath(PLUGIN_ROOT);

          console.log("\n🔷 Algorand MCP Configuration\n");
          console.log("  For external coding agents, add this to their MCP config:\n");
          console.log("  Claude Code (.mcp.json) / Cursor (.cursor/mcp.json):");
          console.log("  ──────────────────────────────────────────────────");
          console.log(`  {`);
          console.log(`    "mcpServers": {`);
          console.log(`      "algorand": {`);
          console.log(`        "command": "${command}",`);
          console.log(`        "args": []`);
          console.log(`      }`);
          console.log(`    }`);
          console.log(`  }\n`);
          console.log(`  OpenClaw uses mcporter (~/.mcporter/mcporter.json); the plugin registers`);
          console.log(`  algorand-mcp automatically on first load.\n`);
        });
    },
    { commands: ["algorand-plugin"] },
  );

  api.logger.info(`Algorand plugin registered (skills: 9, MCP: ${ALGORAND_MCP.name})`);
}

export default definePluginEntry({
  id: PLUGIN_ID,
  name: "Algorand Integration",
  description: "Algorand blockchain integration with MCP and skills — by GoPlausible",
  register,
});

export const id = PLUGIN_ID;
export const name = "Algorand Integration";
