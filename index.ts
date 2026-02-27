import { MCP_SERVERS, GOPLAUSIBLE_SERVICES, type McpServerKey } from "./lib/mcp-servers.js";
import { runSetup, runAuth, type AlgorandPluginConfig } from "./setup.js";
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

function copyAgentsFile(workspacePath: string): { success: boolean; message: string } {
  const sourceFile = join(__dirname, "AGENTS.md");
  const targetFile = join(workspacePath, "AGENTS.md");
  
  if (!existsSync(sourceFile)) {
    return { success: false, message: `Source AGENTS.md not found at ${sourceFile}` };
  }
  
  // Check if target exists
  if (existsSync(targetFile)) {
    // Backup existing file
    const backupFile = join(workspacePath, `AGENTS.md.backup.${Date.now()}`);
    const existingContent = readFileSync(targetFile, "utf-8");
    writeFileSync(backupFile, existingContent);
    console.log(`  Backed up existing AGENTS.md to ${backupFile}`);
  }
  
  // Ensure workspace directory exists
  if (!existsSync(workspacePath)) {
    mkdirSync(workspacePath, { recursive: true });
  }
  
  // Copy file
  const content = readFileSync(sourceFile, "utf-8");
  writeFileSync(targetFile, content);
  
  return { success: true, message: `AGENTS.md copied to ${targetFile}` };
}

export default function register(api: PluginApi) {
  const pluginConfig = api.config.plugins?.entries?.algorand?.config ?? {};
  const mcpServer = (pluginConfig.mcpServer || "lite") as McpServerKey;
  const mcpServerUrl = pluginConfig.mcpServerUrl || MCP_SERVERS[mcpServer]?.url || MCP_SERVERS.lite.url;

  // ─────────────────────────────────────────────────────────────
  // CLI Commands
  // ─────────────────────────────────────────────────────────────
  api.registerCli(
    ({ program }) => {
      const algorand = program
        .command("algorand-plugin")
        .description("Algorand blockchain integration (GoPlausible)");

      // Init command - copies workspace files
      algorand
        .command("init")
        .description("Initialize Algorand workspace files (copies AGENTS.md)")
        .option("--force", "Overwrite existing files without prompting")
        .action(async (opts: { force?: boolean }) => {
          console.log("\n🔷 Initializing Algorand workspace files...\n");
          
          const workspacePath = getWorkspacePath(api);
          const targetFile = join(workspacePath, "AGENTS.md");
          
          if (existsSync(targetFile) && !opts.force) {
            console.log(`  ⚠️  AGENTS.md already exists at ${targetFile}`);
            console.log("     Use --force to overwrite (creates backup)\n");
            return;
          }
          
          const result = copyAgentsFile(workspacePath);
          if (result.success) {
            console.log(`  ✅ ${result.message}\n`);
            console.log("  Algorand skills documentation is now available in your workspace.");
            console.log("  Run `openclaw algorand-plugin setup` to configure MCP authentication.\n");
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
            api.runtime.updatePluginConfig("openclaw-algorand-plugin", { config: newConfig });
            console.log("\n✅ Config saved. Restart gateway to apply changes.");
          }
        });

      // Auth command
      algorand
        .command("auth")
        .description("Authenticate with Algorand MCP (OAuth)")
        .option("--server <server>", "MCP server: lite | full", mcpServer)
        .action(async (opts: { server?: string }) => {
          const serverKey = (opts.server || mcpServer) as McpServerKey;
          const url = MCP_SERVERS[serverKey]?.url || mcpServerUrl;
          const success = await runAuth(url);
          if (success) {
            api.runtime.updatePluginConfig("openclaw-algorand-plugin", {
              config: { ...pluginConfig, authenticated: true },
            });
          }
        });

      // Status command
      algorand
        .command("status")
        .description("Show Algorand plugin status")
        .action(() => {
          console.log("\n🔷 Algorand Plugin Status\n");
          console.log(`  MCP Server:  ${MCP_SERVERS[mcpServer]?.name || mcpServer}`);
          console.log(`  URL:         ${mcpServerUrl}`);
          console.log(`  x402:        ${pluginConfig.enableX402 ? "Enabled" : "Disabled"}`);
          console.log(`  Auth:        ${pluginConfig.authenticated ? "✅ Connected" : "⏳ Not authenticated"}`);
          console.log(`\n  GoPlausible: ${GOPLAUSIBLE_SERVICES.website}\n`);
        });

      // Switch MCP server
      algorand
        .command("use <server>")
        .description("Switch MCP server (lite | full)")
        .action((server: string) => {
          const serverKey = server as McpServerKey;
          if (!MCP_SERVERS[serverKey]) {
            console.error(`❌ Unknown server: ${server}. Use 'lite' or 'full'.`);
            return;
          }
          api.runtime.updatePluginConfig("openclaw-algorand-plugin", {
            config: {
              ...pluginConfig,
              mcpServer: serverKey,
              mcpServerUrl: MCP_SERVERS[serverKey].url,
              authenticated: false, // Reset auth when switching
            },
          });
          console.log(`✅ Switched to ${MCP_SERVERS[serverKey].name}`);
          console.log("   Run `openclaw algorand-plugin auth` to authenticate.");
          console.log("   Restart gateway to apply changes.");
        });
    },
    { commands: ["algorand-plugin"] }
  );

  // ─────────────────────────────────────────────────────────────
  // Agent Tools
  // ─────────────────────────────────────────────────────────────
  api.registerTool({
    name: "algorand_auth",
    description: "Authenticate with Algorand MCP via OAuth (opens browser for wallet connection)",
    parameters: { type: "object", properties: {}, required: [] },
    async execute(
      _id: string,
      _params: object,
      ctx: { runtime: { openUrl: (url: string) => Promise<void> } }
    ) {
      const authUrl = `${mcpServerUrl.replace("/sse", "")}/oauth/authorize`;
      await ctx.runtime.openUrl(authUrl);
      return {
        content: [
          {
            type: "text",
            text:
              `🔷 OAuth flow initiated for Algorand MCP.\n\n` +
              `Browser opened to complete wallet authentication.\n` +
              `Once done, retry your Algorand request.`,
          },
        ],
      };
    },
  });

  // ─────────────────────────────────────────────────────────────
  // Post-install hook
  // ─────────────────────────────────────────────────────────────
  api.registerHook(
    "plugin:post-install",
    async () => {
      console.log("\n🔷 Algorand plugin installed!\n");
      console.log("   Next steps:");
      console.log("   1. Run `openclaw algorand-plugin init` to copy AGENTS.md to your workspace");
      console.log("   2. Run `openclaw algorand-plugin setup` to configure MCP authentication\n");
      
      // Auto-run setup if not configured
      if (!pluginConfig.mcpServer) {
        console.log("   Starting setup wizard...\n");
        const config = await runSetup();
        if (config) {
          api.runtime.updatePluginConfig("openclaw-algorand-plugin", { config });
        }
      }
    },
    { name: "algorand.post-install", description: "Show init instructions on first install" }
  );

  api.logger.info(`Algorand plugin registered (MCP: ${mcpServer})`);
}

export const id = "openclaw-algorand-plugin";
export const name = "Algorand Integration";
