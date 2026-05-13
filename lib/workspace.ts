import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

import { upsertMcporterConfig } from "./mcporter.js";

const PLUGIN_ID = "algorand-plugin";

export type WorkspaceApi = {
  logger: { info: (m: string) => void; warn: (m: string) => void; error: (m: string) => void };
  runtime?: {
    agent?: {
      resolveAgentWorkspaceDir?: (...args: any[]) => string;
    };
  };
  config: Record<string, unknown>;
};

export function resolveWorkspaceDir(api: WorkspaceApi): string {
  const rt = api.runtime?.agent;
  if (rt?.resolveAgentWorkspaceDir) {
    try { return (rt.resolveAgentWorkspaceDir as (...args: any[]) => string)(api.config, "default"); } catch { /* fall through */ }
  }
  const cfg = api.config as { agents?: { defaults?: { workspace?: string } } };
  return cfg.agents?.defaults?.workspace ?? join(homedir(), ".openclaw", "workspace");
}

export function writeMemoryFile(pluginRoot: string, workspacePath: string): { success: boolean; message: string } {
  const sourceFile = join(pluginRoot, "memory", "algorand-plugin.md");
  const memoryDir = join(workspacePath, "memory");
  const targetFile = join(memoryDir, "algorand-plugin.md");

  if (!existsSync(sourceFile)) {
    return { success: false, message: `Source memory/algorand-plugin.md not found at ${sourceFile}` };
  }

  if (!existsSync(memoryDir)) mkdirSync(memoryDir, { recursive: true });

  writeFileSync(targetFile, readFileSync(sourceFile, "utf-8"));
  return { success: true, message: `Plugin memory written to ${targetFile}` };
}

const POINTER_MARKER = "<!-- algorand-plugin:index -->";
const POINTER_LINE = `- [Algorand plugin](memory/algorand-plugin.md) — load when the user mentions Algorand, ALGO, ASA, wallet, x402, AlgoKit, PuyaTs/PuyaPy, Haystack, Alpha Arcade, NFD, or any on-chain Algorand operation. ${POINTER_MARKER}`;

export function ensureWorkspaceMemoryIndex(_pluginRoot: string, workspacePath: string): { success: boolean; message: string } {
  const memoryMdPath = join(workspacePath, "MEMORY.md");
  const memoryMdLower = join(workspacePath, "memory.md");

  const existingPath = existsSync(memoryMdPath) ? memoryMdPath
    : existsSync(memoryMdLower) ? memoryMdLower
    : null;

  if (!existingPath) {
    if (!existsSync(workspacePath)) mkdirSync(workspacePath, { recursive: true });
    const initial = `# OpenClaw Agent Long-Term Memory\n\n## Plugin Routing\n\n${POINTER_LINE}\n`;
    writeFileSync(memoryMdPath, initial);
    return { success: true, message: `Created ${memoryMdPath} with Algorand plugin pointer (one line)` };
  }

  let existing = readFileSync(existingPath, "utf-8");

  if (existing.includes(POINTER_MARKER)) {
    const escapedMarker = POINTER_MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const lineRegex = new RegExp(`^.*${escapedMarker}.*$`, "m");
    const currentMatch = existing.match(lineRegex);
    if (currentMatch && currentMatch[0] !== POINTER_LINE) {
      existing = existing.replace(lineRegex, POINTER_LINE);
      writeFileSync(existingPath, existing);
      return { success: true, message: `Refreshed Algorand plugin pointer in ${existingPath}` };
    }
    return { success: true, message: `Algorand plugin pointer already present in ${existingPath}` };
  }

  const routingHeading = existing.match(/^## Plugin Routing\n/m);
  if (routingHeading) {
    const insertPos = (routingHeading.index ?? 0) + routingHeading[0].length;
    existing = existing.slice(0, insertPos) + POINTER_LINE + "\n" + existing.slice(insertPos);
  } else {
    const firstHeading = existing.match(/^# .+\n/m);
    if (firstHeading) {
      const insertPos = (firstHeading.index ?? 0) + firstHeading[0].length;
      existing = existing.slice(0, insertPos) + "\n## Plugin Routing\n\n" + POINTER_LINE + "\n\n" + existing.slice(insertPos);
    } else {
      existing = "## Plugin Routing\n\n" + POINTER_LINE + "\n\n" + existing;
    }
  }
  writeFileSync(existingPath, existing);
  return { success: true, message: `Added Algorand plugin pointer to ${existingPath}` };
}

export function runFirstLoadInit(api: WorkspaceApi, pluginRoot: string, workspacePath: string): void {
  const markerPath = join(workspacePath, ".openclaw", `${PLUGIN_ID}.initialized`);
  if (existsSync(markerPath)) return;

  const markerDir = dirname(markerPath);
  if (!existsSync(markerDir)) mkdirSync(markerDir, { recursive: true });

  api.logger.info(
    `[algorand-plugin] First-load setup: writing Algorand routing reference to ${workspacePath}/memory/algorand-plugin.md, adding a single pointer line under "## Plugin Routing" in ${workspacePath}/MEMORY.md (no always-loaded NEVER FORGET block), registering algorand-mcp in ~/.mcporter/mcporter.json, and creating ${markerPath} so this runs only once. The agent loads the routing reference on demand when Algorand keywords appear; remove the pointer line or the reference file to opt out.`,
  );

  const mem = writeMemoryFile(pluginRoot, workspacePath);
  if (mem.success) api.logger.info(`[algorand-plugin] ${mem.message}`);
  else api.logger.warn(`[algorand-plugin] ${mem.message}`);

  const memIdx = ensureWorkspaceMemoryIndex(pluginRoot, workspacePath);
  if (memIdx.success) api.logger.info(`[algorand-plugin] ${memIdx.message}`);
  else api.logger.warn(`[algorand-plugin] ${memIdx.message}`);

  const mcp = upsertMcporterConfig(pluginRoot);
  if (mcp.success) api.logger.info(`[algorand-plugin] ${mcp.message}`);
  else api.logger.warn(`[algorand-plugin] ${mcp.message}`);

  writeFileSync(markerPath, new Date().toISOString());
}

export function writePluginConfig(pluginConfig: Record<string, unknown>): { success: boolean; error?: string } {
  try {
    const configPath = join(homedir(), ".openclaw", "openclaw.json");
    const configDir = dirname(configPath);
    if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true });

    let config: Record<string, any> = {};
    if (existsSync(configPath)) {
      config = JSON.parse(readFileSync(configPath, "utf-8"));
    }

    config.plugins ??= {};
    config.plugins.entries ??= {};
    config.plugins.entries[PLUGIN_ID] ??= {};
    config.plugins.entries[PLUGIN_ID].config = pluginConfig;

    config.plugins.allow ??= [];
    if (!config.plugins.allow.includes(PLUGIN_ID)) config.plugins.allow.push(PLUGIN_ID);

    writeFileSync(configPath, JSON.stringify(config, null, 2));
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
