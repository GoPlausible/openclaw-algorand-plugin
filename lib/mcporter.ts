import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { homedir } from "node:os";

import { ALGORAND_MCP } from "./mcp-servers.js";

const NM = "node_modules";
const BIN_NAME = "algorand-mcp";
const PKG_SUBPATH = ["@goplausible", "algorand-mcp"];
const DIST_ENTRY = ["dist", "index.js"];

/**
 * Locate the algorand-mcp binary across the layouts npm may produce.
 * Tries three locations in order:
 *   1. Nested under the plugin's own node_modules/.bin/ (npm without hoisting)
 *   2. An ancestor node_modules/.bin/ (npm v7+ default hoisting — typical for
 *      OpenClaw's managed /home/node/.openclaw/npm/ install root)
 *   3. The package's dist/index.js directly under an ancestor node_modules/
 *      (handles the case where the .bin symlink wasn't created but the
 *      package files are installed; the file is shebang'd + chmod'd by
 *      algorand-mcp's build, so spawning it directly works the same way
 *      as spawning the .bin symlink)
 * Returns null only when none of the three are present anywhere on the path.
 */
function resolveMcpBinaryPath(pluginRoot: string): string | null {
  // 1. Plugin's own nested .bin (works when npm doesn't hoist)
  const nestedBin = join(pluginRoot, NM, ".bin", BIN_NAME);
  if (existsSync(nestedBin)) return nestedBin;

  // 2. Walk up looking for an ancestor node_modules/.bin/algorand-mcp
  //    (hoisted layout — most common on managed npm installs)
  let cur = dirname(pluginRoot);
  for (let i = 0; i < 10; i++) {
    if (basename(cur) === NM) {
      const hoisted = join(cur, ".bin", BIN_NAME);
      if (existsSync(hoisted)) return hoisted;
    }
    const parent = dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }

  // 3. Walk up looking for <ancestor>/node_modules/@goplausible/algorand-mcp/dist/index.js
  //    directly (handles missing .bin symlink — npm chmod +x'd the file at build time)
  cur = pluginRoot;
  for (let i = 0; i < 10; i++) {
    const direct = join(cur, NM, ...PKG_SUBPATH, ...DIST_ENTRY);
    if (existsSync(direct)) return direct;
    const parent = dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }

  return null;
}

export function getMcpBinaryPath(pluginRoot: string): string {
  const path = resolveMcpBinaryPath(pluginRoot);
  if (!path) {
    throw new Error(
      `algorand-mcp binary not found. Searched (in order):\n` +
        `  1. ${join(pluginRoot, NM, ".bin", BIN_NAME)} (plugin-local .bin)\n` +
        `  2. ancestor ${NM}/.bin/${BIN_NAME} walking up from ${pluginRoot} (hoisted .bin)\n` +
        `  3. ancestor ${NM}/${PKG_SUBPATH.join("/")}/${DIST_ENTRY.join("/")} walking up from ${pluginRoot} (direct dist)\n` +
        `Reinstall the Algorand plugin to restore the bundled MCP package; PATH fallback is disabled to prevent running an unintended algorand-mcp implementation.`,
    );
  }
  return path;
}

export function isMcpBinaryBundled(pluginRoot: string): boolean {
  return resolveMcpBinaryPath(pluginRoot) !== null;
}

export function mcporterConfigPath(): string {
  return join(homedir(), ".mcporter", "mcporter.json");
}

type McporterStdioEntry = {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  description?: string;
};

type McporterHttpEntry = {
  baseUrl: string;
};

type McporterServerEntry = McporterStdioEntry | McporterHttpEntry;

type McporterConfig = {
  mcpServers: Record<string, McporterServerEntry>;
  imports: string[];
};

function loadMcporterConfig(): { ok: true; cfg: McporterConfig; path: string } | { ok: false; message: string; path: string } {
  const cfgPath = mcporterConfigPath();
  const cfgDir = dirname(cfgPath);
  if (!existsSync(cfgDir)) mkdirSync(cfgDir, { recursive: true });

  if (!existsSync(cfgPath)) {
    return { ok: true, cfg: { mcpServers: {}, imports: [] }, path: cfgPath };
  }
  try {
    const parsed = JSON.parse(readFileSync(cfgPath, "utf-8"));
    return {
      ok: true,
      cfg: {
        mcpServers: parsed.mcpServers ?? {},
        imports: Array.isArray(parsed.imports) ? parsed.imports : [],
      },
      path: cfgPath,
    };
  } catch (err) {
    return { ok: false, message: `Failed to parse ${cfgPath}: ${err}`, path: cfgPath };
  }
}

function isStdioEntry(entry: McporterServerEntry | undefined): entry is McporterStdioEntry {
  return !!entry && "command" in entry && typeof (entry as McporterStdioEntry).command === "string";
}

export function isMcporterConfigured(): boolean {
  const loaded = loadMcporterConfig();
  if (!loaded.ok) return false;
  return Boolean(loaded.cfg.mcpServers?.[ALGORAND_MCP.id]);
}

export function upsertMcporterConfig(pluginRoot: string): { success: boolean; message: string } {
  const loaded = loadMcporterConfig();
  if (!loaded.ok) return { success: false, message: loaded.message };

  let binaryPath: string;
  try {
    binaryPath = getMcpBinaryPath(pluginRoot);
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }

  const entry: McporterStdioEntry = {
    command: binaryPath,
    description: "Algorand blockchain MCP (GoPlausible)",
  };

  const existing = loaded.cfg.mcpServers[ALGORAND_MCP.id];
  if (isStdioEntry(existing) && existing.command === entry.command && existing.description === entry.description) {
    return { success: true, message: `algorand-mcp already registered in ${loaded.path}` };
  }

  loaded.cfg.mcpServers[ALGORAND_MCP.id] = entry;
  writeFileSync(loaded.path, JSON.stringify(loaded.cfg, null, 2));
  return { success: true, message: `algorand-mcp registered in ${loaded.path}` };
}
