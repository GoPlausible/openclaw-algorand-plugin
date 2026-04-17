import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

import { ALGORAND_MCP } from "./mcp-servers.js";

export function getMcpBinaryPath(pluginRoot: string): string {
  const pluginBin = join(pluginRoot, "node_modules", ".bin", "algorand-mcp");
  return existsSync(pluginBin) ? pluginBin : "algorand-mcp";
}

export function isMcpBinaryBundled(pluginRoot: string): boolean {
  return existsSync(join(pluginRoot, "node_modules", ".bin", "algorand-mcp"));
}

export function mcporterConfigPath(): string {
  return join(homedir(), ".mcporter", "mcporter.json");
}

type McporterServerEntry = {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  description?: string;
};

type McporterConfig = {
  mcpServers: Record<string, McporterServerEntry>;
  imports: string[];
};

export function isMcporterConfigured(): boolean {
  const cfgPath = mcporterConfigPath();
  if (!existsSync(cfgPath)) return false;
  try {
    const cfg = JSON.parse(readFileSync(cfgPath, "utf-8"));
    return Boolean(cfg.mcpServers?.[ALGORAND_MCP.id]);
  } catch {
    return false;
  }
}

export function upsertMcporterConfig(pluginRoot: string): { success: boolean; message: string } {
  const cfgPath = mcporterConfigPath();
  const cfgDir = dirname(cfgPath);

  if (!existsSync(cfgDir)) mkdirSync(cfgDir, { recursive: true });

  let cfg: McporterConfig = { mcpServers: {}, imports: [] };
  if (existsSync(cfgPath)) {
    try {
      const parsed = JSON.parse(readFileSync(cfgPath, "utf-8"));
      cfg = {
        mcpServers: parsed.mcpServers ?? {},
        imports: Array.isArray(parsed.imports) ? parsed.imports : [],
      };
    } catch (err) {
      return { success: false, message: `Failed to parse ${cfgPath}: ${err}` };
    }
  }

  const entry: McporterServerEntry = {
    command: getMcpBinaryPath(pluginRoot),
    description: "Algorand blockchain MCP (GoPlausible)",
  };

  const existing = cfg.mcpServers[ALGORAND_MCP.id];
  if (existing?.command === entry.command && existing?.description === entry.description) {
    return { success: true, message: `algorand-mcp already registered in ${cfgPath}` };
  }

  cfg.mcpServers[ALGORAND_MCP.id] = entry;
  writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
  return { success: true, message: `algorand-mcp registered in ${cfgPath}` };
}
