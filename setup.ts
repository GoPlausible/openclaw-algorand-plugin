import * as p from "@clack/prompts";
import { ALGORAND_MCP, GOPLAUSIBLE_SERVICES } from "./lib/mcp-servers.js";

export interface AlgorandPluginConfig {
  enableX402: boolean;
}

export async function runSetup(
  existingConfig?: Partial<AlgorandPluginConfig>,
): Promise<AlgorandPluginConfig | null> {
  p.intro("🔷 Algorand Plugin Setup — powered by GoPlausible");

  const enableX402 = await p.confirm({
    message: "Enable x402 micropayments integration?",
    initialValue: existingConfig?.enableX402 ?? true,
  });

  if (p.isCancel(enableX402)) {
    p.cancel("Setup cancelled.");
    return null;
  }

  const config: AlgorandPluginConfig = {
    enableX402: enableX402 as boolean,
  };

  p.note(
    `x402 Micropayments: ${config.enableX402 ? "Enabled" : "Disabled"}\n\n` +
      `MCP Server:\n` +
      `  ${ALGORAND_MCP.name} (${ALGORAND_MCP.command}) — 107 blockchain tools.\n` +
      `  Registered in ~/.mcporter/mcporter.json on first load.\n` +
      `  x402 micropayment and AP2 mandate flows are fully supported.\n`,
  );

  p.outro(
    `🔷 Algorand plugin configured!\n\n` +
      `   Next step: restart OpenClaw gateway.\n\n` +
      `   Docs: ${GOPLAUSIBLE_SERVICES.website}`,
  );

  return config;
}
