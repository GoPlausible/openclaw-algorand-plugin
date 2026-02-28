import { ALGORAND_MCP, GOPLAUSIBLE_SERVICES } from "./lib/mcp-servers.js";
import { runSetup, type AlgorandPluginConfig } from "./setup.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface PluginApi {
  config: {
    plugins?: {
      entries?: {
        algorand?: {
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
    updatePluginConfig: (id: string, patch: object) => void;
  };
  registerTool: (tool: object, options?: object) => void;
  registerCli: (fn: (ctx: { program: any }) => void, options: { commands: string[] }) => void;
  registerHook: (event: string, handler: () => Promise<void>, meta: object) => void;
}

function getWorkspacePath(api: PluginApi): string {
  return api.config.agents?.defaults?.workspace ||
    join(process.env.HOME || "~", ".openclaw", "workspace");
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

export default function register(api: PluginApi) {
  const pluginConfig = api.config.plugins?.entries?.algorand?.config ?? {};

  // ─────────────────────────────────────────────────────────────
  // CLI Commands
  // ─────────────────────────────────────────────────────────────
  api.registerCli(
    ({ program }) => {
      const algorand = program
        .command("algorand-plugin")
        .description("Algorand blockchain integration (GoPlausible)");

      // Init command - writes plugin memory file
      algorand
        .command("init")
        .description("Initialize Algorand plugin memory (skill routing & quick reference)")
        .action(async () => {
          console.log("\n🔷 Initializing Algorand plugin...\n");

          const workspacePath = getWorkspacePath(api);

          const result = writeMemoryFile(workspacePath);
          if (result.success) {
            console.log(`  ✅ ${result.message}\n`);
            console.log("  Algorand skill routing guide is now searchable via memory_search.");
            console.log("  Run `openclaw algorand-plugin setup` to configure options.\n");
          } else {
            console.error(`  ❌ ${result.message}\n`);
          }
        });

      // Setup wizard
      algorand
        .command("setup")
        .description("Run interactive Algorand plugin setup")
        .action(async () => {
          const newConfig = await runSetup(pluginConfig);
          if (newConfig) {
            api.runtime.updatePluginConfig("openclaw-algorand-plugin", {
              config: {
                ...newConfig,
                mcpServer: ALGORAND_MCP,
              },
            });
            console.log("\n✅ Config saved. Restart gateway to apply changes.");
          }
        });

      // Status command
      algorand
        .command("status")
        .description("Show Algorand plugin status")
        .action(() => {
          console.log("\n🔷 Algorand Plugin Status\n");
          console.log(`  MCP Server:  ${ALGORAND_MCP.name} (local, ${ALGORAND_MCP.type})`);
          console.log(`  Command:     ${ALGORAND_MCP.command}`);
          console.log(`  x402:        ${pluginConfig.enableX402 ? "Enabled" : "Disabled"}`);
          console.log(`\n  GoPlausible: ${GOPLAUSIBLE_SERVICES.website}\n`);
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
      console.log("   Next steps:");
      console.log("   1. Run `openclaw algorand-plugin init` to set up plugin memory");
      console.log("   2. Run `openclaw algorand-plugin setup` to configure options\n");

      // Auto-register MCP server config on first install
      api.runtime.updatePluginConfig("openclaw-algorand-plugin", {
        config: {
          ...pluginConfig,
          mcpServer: ALGORAND_MCP,
        },
      });
      console.log("   Algorand MCP server registered in OpenClaw config.\n");
    },
    { name: "algorand.post-install", description: "Register MCP server on first install" }
  );

  api.logger.info(`Algorand plugin registered (MCP: ${ALGORAND_MCP.name})`);
}

export const id = "openclaw-algorand-plugin";
export const name = "Algorand Integration";
