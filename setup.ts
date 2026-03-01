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

  // // Step 1: Verify algorand-mcp binary is available
  // let mcpAvailable = false;
  // let mcpPath = "";
  // try {
  //   mcpPath = execSync("npm list @goplausible/algorand-mcp", { encoding: "utf-8" }).trim();
  //   mcpAvailable = true;
  // } catch {
  //   // Binary not found in PATH
  // }

  // if (mcpAvailable) {
  //   p.note(
  //     `MCP Server: ${ALGORAND_MCP.name}\n` +
  //       `Type: ${ALGORAND_MCP.type} (local)\n` +
  //       `Command: ${ALGORAND_MCP.command}\n` +
  //       `Path: ${mcpPath}\n` +
  //       `Status: ✅ Available`,
  //     "Algorand MCP"
  //   );
  // } else {
  //   p.log.warn(
  //     `algorand-mcp binary not found in PATH.\n\n` +
  //       `Options:\n` +
  //       `  • Run with npx: npx algorand-mcp\n` +
  //       `  • Install globally: npm install -g @goplausible/algorand-mcp\n` +
  //       `  • Add node_modules/.bin to PATH`
  //   );
  // }

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
      `  x402 micropayment and AP2 mandate verifiable credentials flows are fully supported in Algorand MCP.\n` ,
  );

  p.outro(
    `🔷 Algorand plugin configured!\n\n` +
      `   Next steps:\n` +
      `   3. Restart OpenClaw gateway\n\n` +
      `   GoPlausible website: ${GOPLAUSIBLE_SERVICES.website}`
  );

  return config;
}
