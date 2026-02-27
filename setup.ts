import * as p from "@clack/prompts";
import { execSync } from "node:child_process";
import { MCP_SERVERS, GOPLAUSIBLE_SERVICES, type McpServerKey } from "./lib/mcp-servers.js";

export interface AlgorandPluginConfig {
  mcpServer: McpServerKey;
  mcpServerUrl: string;
  enableX402: boolean;
  authenticated: boolean;
}

export async function runSetup(
  existingConfig?: Partial<AlgorandPluginConfig>
): Promise<AlgorandPluginConfig | null> {
  p.intro("🔷 Algorand Plugin Setup — powered by GoPlausible");

  // Step 1: Choose MCP Server
  const mcpChoice = await p.select({
    message: "Which Algorand MCP server do you want to use?",
    initialValue: existingConfig?.mcpServer || "lite",
    options: [
      {
        value: "lite",
        label: MCP_SERVERS.lite.name,
        hint: MCP_SERVERS.lite.description,
      },
      {
        value: "full",
        label: MCP_SERVERS.full.name,
        hint: MCP_SERVERS.full.description,
      },
    ],
  });

  if (p.isCancel(mcpChoice)) {
    p.cancel("Setup cancelled.");
    return null;
  }

  const selectedServer = MCP_SERVERS[mcpChoice as McpServerKey];

  // Step 2: x402 integration
  const enableX402 = await p.confirm({
    message: "Enable x402 micropayments integration?",
    initialValue: existingConfig?.enableX402 ?? true,
  });

  if (p.isCancel(enableX402)) {
    p.cancel("Setup cancelled.");
    return null;
  }

  // Step 3: OAuth Authentication
  p.note(
    `The ${selectedServer.name} uses OAuth authentication.\n` +
      `You'll need to authorize via browser to connect your wallet.`,
    "Authentication Required"
  );

  const authNow = await p.confirm({
    message: "Authenticate now? (Opens browser)",
    initialValue: true,
  });

  if (p.isCancel(authNow)) {
    p.cancel("Setup cancelled.");
    return null;
  }

  let authenticated = existingConfig?.authenticated ?? false;

  if (authNow) {
    authenticated = await runAuth(selectedServer.url);
  }

  // Summary
  const config: AlgorandPluginConfig = {
    mcpServer: mcpChoice as McpServerKey,
    mcpServerUrl: selectedServer.url,
    enableX402: enableX402 as boolean,
    authenticated,
  };

  p.note(
    `MCP Server: ${selectedServer.name}\n` +
      `URL: ${selectedServer.url}\n` +
      `x402: ${config.enableX402 ? "Enabled" : "Disabled"}\n` +
      `Auth: ${config.authenticated ? "✅ Connected" : "⏳ Pending"}`,
    "Configuration"
  );

  p.outro(
    `🔷 Algorand plugin configured!\n` +
      `   Docs: ${GOPLAUSIBLE_SERVICES.website}\n` +
      `   Run \`openclaw algorand --help\` for commands.`
  );

  return config;
}

export async function runAuth(serverUrl: string): Promise<boolean> {
  const spinner = p.spinner();
  spinner.start("Opening browser for Algorand OAuth...");

  try {
    execSync(`mcporter auth "${serverUrl}"`, { stdio: "inherit" });
    spinner.stop("✅ Authentication successful!");
    return true;
  } catch (error) {
    spinner.stop("⚠️ Authentication skipped or failed. Run `openclaw algorand auth` to retry.");
    return false;
  }
}
