import { ALGORAND_MCP, GOPLAUSIBLE_SERVICES } from "./lib/mcp-servers.js";
import { runSetup, type AlgorandPluginConfig } from "./setup.js";
import { x402Fetch } from "./lib/x402-fetch.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ID = "openclaw-algorand-plugin";

interface PluginApi {
  config: {
    plugins?: {
      entries?: {
        "openclaw-algorand-plugin"?: {
          config?: Partial<AlgorandPluginConfig>;
        };
      };
    };
    agents?: {
      defaults?: {
        workspace?: string;
      };
    };
  };
  logger: {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
  };
  runtime: {
    openUrl: (url: string) => Promise<void>;
  };
  registerTool: (tool: object, options?: object) => void;
  registerCli: (fn: (ctx: { program: any }) => void, options: { commands: string[] }) => void;
  registerHook: (event: string, handler: () => Promise<void>, meta: object) => void;
}

function getWorkspacePath(api: PluginApi): string {
  return api.config.agents?.defaults?.workspace ||
    join(process.env.HOME || "~", ".openclaw", "workspace");
}

function getConfigPath(): string {
  return join(process.env.HOME || "~", ".openclaw", "openclaw.json");
}

function getMcpBinaryPath(): string {
  // Check plugin's node_modules first
  const pluginBin = join(__dirname, "node_modules", ".bin", "algorand-mcp");
  if (existsSync(pluginBin)) {
    return pluginBin;
  }
  // Fall back to npx
  return "npx algorand-mcp";
}

function updatePluginConfig(newConfig: AlgorandPluginConfig): { success: boolean; error?: string } {
  try {
    const configPath = getConfigPath();
    if (!existsSync(configPath)) {
      return { success: false, error: `Config file not found: ${configPath}` };
    }

    const rawConfig = readFileSync(configPath, "utf-8");
    const config = JSON.parse(rawConfig);

    // Ensure plugins structure exists
    if (!config.plugins) config.plugins = {};
    if (!config.plugins.entries) config.plugins.entries = {};
    if (!config.plugins.entries[PLUGIN_ID]) {
      config.plugins.entries[PLUGIN_ID] = {};
    }

    // Update the plugin config
    config.plugins.entries[PLUGIN_ID].config = newConfig;

    // Add to plugins.allow if not already there
    if (!config.plugins.allow) config.plugins.allow = [];
    if (!config.plugins.allow.includes(PLUGIN_ID)) {
      config.plugins.allow.push(PLUGIN_ID);
    }

    // Write back with pretty formatting
    writeFileSync(configPath, JSON.stringify(config, null, 2));

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

function configureMcporter(): { success: boolean; message: string } {
  const mcpCommand = getMcpBinaryPath();

  try {
    // Check if mcporter is available
    execSync("which mcporter", { encoding: "utf-8" });
  } catch {
    return { success: false, message: "mcporter not installed. Install with: npm install -g mcporter" };
  }

  try {
    // Check if algorand server already configured
    const listOutput = execSync("mcporter config list 2>/dev/null || echo ''", { encoding: "utf-8" });
    if (listOutput.includes("algorand-mcp")) {
      return { success: true, message: "algorand-mcp server already configured in mcporter" };
    }
  } catch {
    // Continue to add
  }

  try {
    // Add algorand server to mcporter config (home scope for global access)
    const cmd = `mcporter config add algorand-mcp --command "${mcpCommand}" --scope home --description "Algorand blockchain MCP (GoPlausible)"`;
    execSync(cmd, { encoding: "utf-8" });
    return { success: true, message: `algorand server added to mcporter (command: ${mcpCommand})` };
  } catch (err) {
    return { success: false, message: `Failed to configure mcporter: ${err}` };
  }
}

function writeMemoryFile(workspacePath: string): { success: boolean; message: string } {
  const sourceFile = join(__dirname, "memory", "algorand-plugin.md");
  const memoryDir = join(workspacePath, "memory");
  const targetFile = join(memoryDir, "algorand-plugin.md");

  if (!existsSync(sourceFile)) {
    return { success: false, message: `Source memory/algorand-plugin.md not found at ${sourceFile}` };
  }

  if (!existsSync(memoryDir)) {
    mkdirSync(memoryDir, { recursive: true });
  }

  const content = readFileSync(sourceFile, "utf-8");
  writeFileSync(targetFile, content);

  return { success: true, message: `Plugin memory written to ${targetFile}` };
}

function checkMcpBinary(): { available: boolean; path?: string } {
  try {
    const path = execSync("which algorand-mcp", { encoding: "utf-8" }).trim();
    return { available: true, path };
  } catch {
    // Check plugin's node_modules
    const pluginBin = join(__dirname, "node_modules", ".bin", "algorand-mcp");
    if (existsSync(pluginBin)) {
      return { available: true, path: pluginBin };
    }
    return { available: false };
  }
}

export default function register(api: PluginApi) {
  const pluginConfig = api.config.plugins?.entries?.[PLUGIN_ID]?.config ?? {};

  // ─────────────────────────────────────────────────────────────
  // x402 Fetch Tool
  // ─────────────────────────────────────────────────────────────
  if (pluginConfig.enableX402 !== false) {
    api.registerTool(
      {
        name: "x402_fetch",
        description:
          "Fetch a URL with x402 payment protocol support. On HTTP 402, returns structured PaymentRequirements and step-by-step instructions to build payment using algorand-mcp tools. Use paymentHeader to retry with a signed payment.",
        parameters: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The URL to fetch",
            },
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
            body: {
              type: "string",
              description: "Request body (for POST/PUT/PATCH)",
            },
            paymentHeader: {
              type: "string",
              description:
                "JSON string for X-PAYMENT header — the signed payment payload from the x402 payment flow",
            },
          },
          required: ["url"],
        },
        async execute(_id: string, params: {
          url: string;
          method?: string;
          headers?: Record<string, string>;
          body?: string;
          paymentHeader?: string;
        }) {
          const result = await x402Fetch(params);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        },
      },
      { scope: "agent" },
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CLI Commands
  // ─────────────────────────────────────────────────────────────
  api.registerCli(
    ({ program }) => {
      const algorand = program
        .command("algorand-plugin")
        .description("Algorand blockchain integration (GoPlausible)");

      // Init command - writes plugin memory file AND configures mcporter
      algorand
        .command("init")
        .description("Initialize Algorand plugin (memory file + mcporter config)")
        .action(async () => {
          console.log("\n🔷 Initializing Algorand plugin...\n");

          const workspacePath = getWorkspacePath(api);

          // Step 1: Write memory file
          const memResult = writeMemoryFile(workspacePath);
          if (memResult.success) {
            console.log(`  ✅ ${memResult.message}`);
          } else {
            console.error(`  ❌ ${memResult.message}`);
          }

          // Step 2: Configure mcporter
          console.log("");
          const mcpResult = configureMcporter();
          if (mcpResult.success) {
            console.log(`  ✅ ${mcpResult.message}`);
          } else {
            console.log(`  ⚠️  ${mcpResult.message}`);
          }

          console.log("\n  Run `openclaw algorand-plugin setup` to configure options.");
          console.log("  Run `mcporter list algorand-mcp --schema` to verify MCP tools.\n");
        });

      // Setup wizard
      algorand
        .command("setup")
        .description("Run interactive Algorand plugin setup")
        .action(async () => {
          const newConfig = await runSetup(pluginConfig);
          if (newConfig) {
            const result = updatePluginConfig(newConfig);
            if (result.success) {
              console.log("\n✅ Config saved to ~/.openclaw/openclaw.json");
              console.log("   Plugin added to plugins.allow list.");
              console.log("   Restart gateway to apply changes: openclaw gateway restart\n");
            } else {
              console.error(`\n❌ Failed to save config: ${result.error}`);
              console.log("   You can manually add to ~/.openclaw/openclaw.json:");
              console.log(`   "plugins": { "allow": ["${PLUGIN_ID}"], "entries": { "${PLUGIN_ID}": { "config": ${JSON.stringify(newConfig)} } } }\n`);
            }
          }
        });

      // Status command
      algorand
        .command("status")
        .description("Show Algorand plugin status")
        .action(() => {
          const mcp = checkMcpBinary();

          // Check mcporter config
          let mcporterConfigured = false;
          try {
            const list = execSync("mcporter config list 2>/dev/null || echo ''", { encoding: "utf-8" });
            mcporterConfigured = list.includes("algorand-mcp");
          } catch { }

          console.log("\n🔷 Algorand Plugin Status\n");
          console.log("  Skills:");
          console.log("    • algorand-development");
          console.log("    • algorand-typescript");
          console.log("    • algorand-python");
          console.log("    • algorand-interaction");
          console.log("    • algorand-x402-typescript");
          console.log("    • algorand-x402-python");
          console.log("");
          console.log("  MCP Server:");
          console.log(`    Binary:    ${mcp.available ? `✅ ${mcp.path}` : "⚠️  Not found"}`);
          console.log(`    mcporter:  ${mcporterConfigured ? "✅ Configured" : "⚠️  Not configured (run init)"}`);
          console.log("");
          console.log("  Config:");
          console.log(`    x402:      ${pluginConfig.enableX402 !== false ? "Enabled" : "Disabled"}`);
          console.log("");
          console.log("  Links:");
          console.log(`    GoPlausible: ${GOPLAUSIBLE_SERVICES.website}`);
          console.log(`    x402 Gateway: ${GOPLAUSIBLE_SERVICES.x402}`);
          console.log("");
        });

      // MCP config helper (for external coding agents)
      algorand
        .command("mcp-config")
        .description("Show MCP config snippet for coding agents (Claude Code, Cursor, etc.)")
        .action(() => {
          const mcp = checkMcpBinary();
          const command = mcp.path || "npx algorand-mcp";

          console.log("\n🔷 Algorand MCP Configuration\n");
          console.log("  For external coding agents, add this to their MCP config:\n");
          console.log("  Claude Code (.mcp.json):");
          console.log("  ─────────────────────────");
          console.log(`  {`);
          console.log(`    "mcpServers": {`);
          console.log(`      "algorand": {`);
          console.log(`        "command": "${command}",`);
          console.log(`        "args": []`);
          console.log(`      }`);
          console.log(`    }`);
          console.log(`  }\n`);
          console.log("  Cursor (.cursor/mcp.json) — same format\n");
          console.log("  Note: OpenClaw uses mcporter. Run `openclaw algorand-plugin init` to configure.\n");
        });
    },
    { commands: ["algorand-plugin"] }
  );

  // ─────────────────────────────────────────────────────────────
  // Post-install hook
  // ─────────────────────────────────────────────────────────────
  api.registerHook(
    "plugin:post-install",
    async () => {
      console.log("\n🔷 Algorand plugin installed!\n");
      console.log("   This plugin provides:");
      console.log("   • 6 Algorand development skills (smart contracts, x402, MCP interaction)");
      console.log("   • algorand-mcp server (99 blockchain tools via mcporter)\n");
      console.log("   Next steps:");
      console.log("   1. Run `openclaw algorand-plugin init` — configure mcporter + add plugin memory");
      console.log("   2. Run `openclaw algorand-plugin setup` — configure options & add to allow list");
      console.log("   3. Restart OpenClaw gateway\n");
      console.log(`   Docs: ${GOPLAUSIBLE_SERVICES.website}\n`);
    },
    { name: "algorand.post-install", description: "Show setup instructions on install" }
  );

  api.logger.info(`Algorand plugin registered (skills: 6, MCP: ${ALGORAND_MCP.name})`);
}

export const id = PLUGIN_ID;
export const name = "Algorand Integration";
