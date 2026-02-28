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
  try {
    execSync("which algorand-mcp", { encoding: "utf-8" });
    mcpAvailable = true;
  } catch {
    // Binary not found in PATH
  }

  if (mcpAvailable) {
    p.note(
      `MCP Server: ${ALGORAND_MCP.name}\n` +
        `Type: ${ALGORAND_MCP.type} (local)\n` +
        `Command: ${ALGORAND_MCP.command}\n` +
        `Status: ✅ Available`,
      "Algorand MCP"
    );
  } else {
    p.log.warn(
      `algorand-mcp binary not found in PATH.\n` +
        `It should be installed as a dependency. Try: npm install algorand-mcp`
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
    `MCP Server: ${ALGORAND_MCP.name} (local, stdio)\n` +
      `x402: ${config.enableX402 ? "Enabled" : "Disabled"}`,
    "Configuration"
  );

  p.outro(
    `🔷 Algorand plugin configured!\n` +
      `   Docs: ${GOPLAUSIBLE_SERVICES.website}\n` +
      `   Run \`openclaw algorand-plugin init\` to write MCP config and plugin memory.`
  );

  return config;
}
