import * as p from "@clack/prompts";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ALGORAND_MCP, GOPLAUSIBLE_SERVICES } from "./lib/mcp-servers.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface AlgorandPluginConfig {
  enableX402: boolean;
}

export async function runSetup(
  existingConfig?: Partial<AlgorandPluginConfig>
): Promise<AlgorandPluginConfig | null> {
  p.intro("🔷 Algorand Plugin Setup — powered by GoPlausible");

  // Step 1: Keyring persistence check & setup
  p.log.step("Checking keyring persistence for wallet storage...");
  try {
    const scriptPath = join(__dirname, "scripts", "setup-keyring.sh");
    execSync(`bash "${scriptPath}" --setup`, { stdio: "inherit" });
  } catch {
    p.log.warn("Keyring setup script failed — you may need to configure manually.");
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
      `  The Algorand MCP server (${ALGORAND_MCP.command}) provides 107 blockchain tools.\n` +
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
