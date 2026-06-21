import * as p from "@clack/prompts";
import { ALGORAND_MCP, GOPLAUSIBLE_SERVICES } from "./lib/mcp-servers.js";

export interface AlgorandPluginConfig {
  enableX402: boolean;
}

export async function runSetup(
  _existingConfig?: Partial<AlgorandPluginConfig>,
): Promise<AlgorandPluginConfig | null> {
  p.intro("🔷 Algorand Plugin Setup — powered by GoPlausible");

  // DISABLED FOR TESTING — see comment in /index.ts. The native x402_fetch
  // tool is currently disabled; the agent uses algorand-mcp's x402 tools
  // (`x402_discover_payment_requirements`, `make_http_request_with_x402`)
  // surfaced via mcporter. The `enableX402` toggle has no runtime effect in
  // this build, so we don't prompt for it. Restore by uncommenting the
  // p.confirm block below and removing the hardcoded `enableX402: true`.
  //
  // const enableX402 = await p.confirm({
  //   message: "Enable x402 micropayments integration?",
  //   initialValue: _existingConfig?.enableX402 ?? true,
  // });
  // if (p.isCancel(enableX402)) {
  //   p.cancel("Setup cancelled.");
  //   return null;
  // }

  const config: AlgorandPluginConfig = {
    enableX402: true,
  };

  p.note(
    `MCP Server:\n` +
      `  ${ALGORAND_MCP.name} (${ALGORAND_MCP.command}) — 107 blockchain tools.\n` +
      `  Registered in ~/.mcporter/mcporter.json on first load.\n` +
      `  x402 micropayment and AP2 mandate flows are handled by algorand-mcp tools.\n`,
  );

  p.outro(
    `🔷 Algorand plugin configured!\n\n` +
      `   Next step: restart OpenClaw gateway.\n\n` +
      `   Docs: ${GOPLAUSIBLE_SERVICES.website}`,
  );

  return config;
}
