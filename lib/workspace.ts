import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

import { upsertMcporterConfig } from "./mcporter.js";

const PLUGIN_ID = "openclaw-algorand-plugin";

export type WorkspaceApi = {
  logger: { info: (m: string) => void; warn: (m: string) => void; error: (m: string) => void };
  runtime?: {
    agent?: {
      resolveAgentWorkspaceDir?: () => string;
      ensureAgentWorkspace?: () => Promise<string> | string;
    };
  };
  config: Record<string, unknown>;
};

export function resolveWorkspaceDir(api: WorkspaceApi): string {
  const rt = api.runtime?.agent;
  if (rt?.resolveAgentWorkspaceDir) {
    try { return rt.resolveAgentWorkspaceDir(); } catch { /* fall through */ }
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

export function ensureWorkspaceMemoryIndex(pluginRoot: string, workspacePath: string): { success: boolean; message: string } {
  const templateFile = join(pluginRoot, "memory", "MEMORY.md");

  if (!existsSync(templateFile)) {
    return { success: false, message: "Template MEMORY.md not found in plugin" };
  }

  const templateContent = readFileSync(templateFile, "utf-8");

  const neverForgetMatch = templateContent.match(/## NEVER FORGET\n([\s\S]*?)(?=\n## (?!NEVER)|$)/);
  if (!neverForgetMatch) {
    return { success: false, message: "No NEVER FORGET section found in template MEMORY.md" };
  }
  const templateNeverForget = neverForgetMatch[1].trimEnd();

  const memoryMdPath = join(workspacePath, "MEMORY.md");
  const memoryMdLower = join(workspacePath, "memory.md");

  const existingPath = existsSync(memoryMdPath) ? memoryMdPath
    : existsSync(memoryMdLower) ? memoryMdLower
    : null;

  if (!existingPath) {
    if (!existsSync(workspacePath)) mkdirSync(workspacePath, { recursive: true });
    writeFileSync(memoryMdPath, templateContent);
    return { success: true, message: `Created ${memoryMdPath} with NEVER FORGET section` };
  }

  let existing = readFileSync(existingPath, "utf-8");

  if (!/## NEVER FORGET/i.test(existing)) {
    const firstHeadingEnd = existing.match(/^# .+\n/m);
    if (firstHeadingEnd) {
      const insertPos = (firstHeadingEnd.index ?? 0) + firstHeadingEnd[0].length;
      existing = existing.slice(0, insertPos) + "\n## NEVER FORGET\n" + templateNeverForget + "\n\n" + existing.slice(insertPos);
    } else {
      existing = "# OpenClaw Agent Long-Term Memory\n\n## NEVER FORGET\n" + templateNeverForget + "\n\n" + existing;
    }
    writeFileSync(existingPath, existing);
    return { success: true, message: `Added NEVER FORGET section to ${existingPath}` };
  }

  const parseSubsections = (text: string): { header: string; content: string }[] => {
    const sections: { header: string; content: string }[] = [];
    const lines = text.split("\n");
    let currentHeader = "";
    let currentLines: string[] = [];
    for (const line of lines) {
      if (line.startsWith("### ")) {
        if (currentHeader) sections.push({ header: currentHeader, content: currentLines.join("\n").trimEnd() });
        currentHeader = line;
        currentLines = [];
      } else if (currentHeader) {
        currentLines.push(line);
      }
    }
    if (currentHeader) sections.push({ header: currentHeader, content: currentLines.join("\n").trimEnd() });
    return sections;
  };

  const templateSections = parseSubsections(templateNeverForget);
  const nfSectionMatch = existing.match(/(## NEVER FORGET\n)([\s\S]*?)(?=\n## (?!#)|$)/);
  if (!nfSectionMatch) {
    return { success: true, message: `NEVER FORGET section in ${existingPath} is up to date` };
  }

  let nfContent = nfSectionMatch[2];
  let updated = false;

  for (const templateSec of templateSections) {
    if (templateSec.header === "### Never Do This") {
      const neverDoRegex = /(### Never Do This\n)([\s\S]*?)(?=\n### |$)/;
      const existingNeverDoMatch = nfContent.match(neverDoRegex);

      if (!existingNeverDoMatch) {
        nfContent = nfContent.trimEnd() + "\n\n" + templateSec.header + "\n" + templateSec.content + "\n";
        updated = true;
      } else {
        let existingBullets = existingNeverDoMatch[2];
        const templateBullets = templateSec.content.split("\n").filter((l: string) => l.startsWith("* "));
        const existingBulletLines = existingBullets.split("\n").filter((l: string) => l.startsWith("* "));

        for (const bullet of templateBullets) {
          const fingerprint = bullet.slice(2, 52).trim();
          const existingMatch = existingBulletLines.find((l: string) => l.includes(fingerprint));
          if (existingMatch) {
            if (existingMatch !== bullet) {
              nfContent = nfContent.replace(existingMatch, bullet);
              updated = true;
            }
          } else {
            existingBullets = existingBullets.trimEnd() + "\n" + bullet;
            nfContent = nfContent.replace(existingNeverDoMatch[2], existingBullets);
            updated = true;
          }
        }
      }
    } else {
      const escapedHeader = templateSec.header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const sectionRegex = new RegExp("(" + escapedHeader + "\\n)([\\s\\S]*?)(?=\\n### |$)");
      const existingSecMatch = nfContent.match(sectionRegex);

      if (existingSecMatch) {
        if (existingSecMatch[2].trimEnd() !== templateSec.content) {
          nfContent = nfContent.replace(existingSecMatch[0], templateSec.header + "\n" + templateSec.content);
          updated = true;
        }
      } else {
        const neverDoPos = nfContent.indexOf("### Never Do This");
        if (neverDoPos !== -1) {
          nfContent = nfContent.slice(0, neverDoPos) + templateSec.header + "\n" + templateSec.content + "\n\n" + nfContent.slice(neverDoPos);
        } else {
          nfContent = nfContent.trimEnd() + "\n\n" + templateSec.header + "\n" + templateSec.content + "\n";
        }
        updated = true;
      }
    }
  }

  if (!updated) return { success: true, message: `NEVER FORGET section in ${existingPath} is up to date` };

  existing = existing.replace(nfSectionMatch[2], nfContent);
  writeFileSync(existingPath, existing);
  return { success: true, message: `Updated NEVER FORGET subsections in ${existingPath}` };
}

export function runFirstLoadInit(api: WorkspaceApi, pluginRoot: string, workspacePath: string): void {
  const markerPath = join(workspacePath, ".openclaw", `${PLUGIN_ID}.initialized`);
  if (existsSync(markerPath)) return;

  const markerDir = dirname(markerPath);
  if (!existsSync(markerDir)) mkdirSync(markerDir, { recursive: true });

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
