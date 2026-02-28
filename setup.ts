import * as p from "@clack/prompts";
import { execSync } from "node:child_process";
import { ALGORAND_MCP, GOPLAUSIBLE_SERVICES } from "./lib/mcp-servers.js";

export interface AlgorandPluginConfig {
  enableX402: boolean;
}

export async function runSetup(
  existingConfig?: Partial<AlgorandPluginConfig>
): Promise<AlgorandPluginConfig | null> {
  p.intro("🔷 Algorand Plugin Setup — powered by GoPlausible");

  // Step 1: Verify algorand-mcp binary is available
  let mcpAvailable = false;
  let mcpPath = "";
  try {
    mcpPath = execSync("which algorand-mcp", { encoding: "utf-8" }).trim();
    mcpAvailable = true;
  } catch {
    // Binary not found in PATH
  }

  if (mcpAvailable) {
    p.note(
      `MCP Server: ${ALGORAND_MCP.name}\n` +
        `Type: ${ALGORAND_MCP.type} (local)\n` +
        `Command: ${ALGORAND_MCP.command}\n` +
        `Path: ${mcpPath}\n` +
        `Status: ✅ Available`,
      "Algorand MCP"
    );
  } else {
    p.log.warn(
      `algorand-mcp binary not found in PATH.\n\n` +
        `Options:\n` +
        `  • Run with npx: npx algorand-mcp\n` +
        `  • Install globally: npm install -g algorand-mcp\n` +
        `  • Add node_modules/.bin to PATH`
    );
  }

  // Step 2: x402 integration
  const enableX402 = await p.confirm({
    message: "Enable x402 micropayments integration?",
    initialValue: existingConfig?.enableX402 ?? true,
  });

  if (p.isCancel(enableX402)) {
    p.cancel("Setup cancelled.");
    return null;
  }

  // Summary
  const config: AlgorandPluginConfig = {
    enableX402: enableX402 as boolean,
  };

  p.note(
    `x402 Micropayments: ${config.enableX402 ? "Enabled" : "Disabled"}\n\n` +
      `MCP Server Setup:\n` +
      `  The Algorand MCP server (${ALGORAND_MCP.command}) provides 99 blockchain tools.\n` +
      `  Configure it in your coding agent's MCP config:\n` +
      `  • Claude Code: .mcp.json\n` +
      `  • Cursor: .cursor/mcp.json\n` +
      `  • OpenCode: opencode.json`,
    "Configuration"
  );

  p.outro(
    `🔷 Algorand plugin configured!\n\n` +
      `   Next steps:\n` +
      `   1. Run \`openclaw algorand-plugin init\` to add plugin memory\n` +
      `   2. Configure algorand-mcp in your coding agent's MCP config\n` +
      `   3. Restart OpenClaw gateway\n\n` +
      `   Docs: ${GOPLAUSIBLE_SERVICES.website}`
  );

  return config;
}
