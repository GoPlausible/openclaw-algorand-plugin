import { ALGORAND_MCP, GOPLAUSIBLE_SERVICES } from "./lib/mcp-servers.js";
import { runSetup, type AlgorandPluginConfig } from "./setup.js";
import { x402Fetch } from "./lib/x402-fetch.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ID = "openclaw-algorand-plugin";

interface PluginApi {
  config: {
    plugins?: {
      entries?: {
        "openclaw-algorand-plugin"?: {
          config?: Partial<AlgorandPluginConfig>;
        };
      };
    };
    agents?: {
      defaults?: {
        workspace?: string;
      };
    };
  };
  logger: {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
  };
  runtime: {
    openUrl: (url: string) => Promise<void>;
  };
  registerTool: (tool: object, options?: object) => void;
  registerCli: (fn: (ctx: { program: any }) => void, options: { commands: string[] }) => void;
  registerHook: (event: string, handler: () => Promise<void>, meta: object) => void;
}

function getWorkspacePath(api: PluginApi): string {
  return api.config.agents?.defaults?.workspace ||
    join(homedir(), ".openclaw", "workspace");
}

function getConfigPath(): string {
  return join(homedir(), ".openclaw", "openclaw.json");
}

function getMcpBinaryPath(): string {
  // Check plugin's node_modules first
  const pluginBin = join(__dirname, "node_modules", ".bin", "algorand-mcp");
  if (existsSync(pluginBin)) {
    return pluginBin;
  }
  // Fall back to npx
  return "npx algorand-mcp";
}

function updatePluginConfig(newConfig: AlgorandPluginConfig): { success: boolean; error?: string } {
  try {
    const configPath = getConfigPath();
    const configDir = dirname(configPath);

    // Create ~/.openclaw directory if it doesn't exist
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    // Create config file with empty object if it doesn't exist
    let config: Record<string, any> = {};
    if (existsSync(configPath)) {
      const rawConfig = readFileSync(configPath, "utf-8");
      config = JSON.parse(rawConfig);
    }

    // Ensure plugins structure exists
    if (!config.plugins) config.plugins = {};
    if (!config.plugins.entries) config.plugins.entries = {};
    if (!config.plugins.entries[PLUGIN_ID]) {
      config.plugins.entries[PLUGIN_ID] = {};
    }

    // Update the plugin config
    config.plugins.entries[PLUGIN_ID].config = newConfig;

    // Add to plugins.allow if not already there
    if (!config.plugins.allow) config.plugins.allow = [];
    if (!config.plugins.allow.includes(PLUGIN_ID)) {
      config.plugins.allow.push(PLUGIN_ID);
    }

    // Write back with pretty formatting
    writeFileSync(configPath, JSON.stringify(config, null, 2));

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

function stopExistingMcpProcesses(): { stopped: number; message: string } {
  try {
    // Find all running algorand-mcp processes
    const psOutput = execSync("ps aux 2>/dev/null || tasklist 2>/dev/null || echo ''", { encoding: "utf-8" });
    const lines = psOutput.split("\n").filter((line: string) => line.includes("algorand-mcp") && !line.includes("grep"));

    if (lines.length === 0) {
      return { stopped: 0, message: "No existing algorand-mcp processes found" };
    }

    // Extract PIDs and kill them
    let stopped = 0;
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[1]; // PID is second column in ps aux
      if (pid && /^\d+$/.test(pid)) {
        try {
          execSync(`kill ${pid} 2>/dev/null`, { encoding: "utf-8" });
          stopped++;
        } catch {
          // Process may have already exited
        }
      }
    }

    // Brief wait for processes to terminate
    if (stopped > 0) {
      execSync("sleep 1");
    }

    return { stopped, message: `Stopped ${stopped} existing algorand-mcp process${stopped !== 1 ? "es" : ""}` };
  } catch {
    return { stopped: 0, message: "Could not check for existing processes" };
  }
}

function configureMcporter(): { success: boolean; message: string } {
  const mcpCommand = getMcpBinaryPath();

  try {
    // Check if mcporter is available
    execSync("which mcporter", { encoding: "utf-8" });
  } catch {
    return { success: false, message: "mcporter not installed. Install with: npm install -g mcporter" };
  }

  try {
    // Check if algorand server already configured
    const listOutput = execSync("mcporter config list 2>/dev/null || echo ''", { encoding: "utf-8" });
    if (listOutput.includes("algorand-mcp")) {
      return { success: true, message: "algorand-mcp server already configured in mcporter" };
    }
  } catch {
    // Continue to add
  }

  try {
    // Add algorand server to mcporter config (home scope for global access)
    const cmd = `mcporter config add algorand-mcp --command "${mcpCommand}" --scope home --description "Algorand blockchain MCP (GoPlausible)"`;
    execSync(cmd, { encoding: "utf-8" });
    return { success: true, message: `algorand server added to mcporter (command: ${mcpCommand})` };
  } catch (err) {
    return { success: false, message: `Failed to configure mcporter: ${err}` };
  }
}

function writeMemoryFile(workspacePath: string): { success: boolean; message: string } {
  const sourceFile = join(__dirname, "memory", "algorand-plugin.md");
  const memoryDir = join(workspacePath, "memory");
  const targetFile = join(memoryDir, "algorand-plugin.md");

  if (!existsSync(sourceFile)) {
    return { success: false, message: `Source memory/algorand-plugin.md not found at ${sourceFile}` };
  }

  if (!existsSync(memoryDir)) {
    mkdirSync(memoryDir, { recursive: true });
  }

  const content = readFileSync(sourceFile, "utf-8");
  writeFileSync(targetFile, content);

  return { success: true, message: `Plugin memory written to ${targetFile}` };
}

function ensureWorkspaceMemoryIndex(workspacePath: string): { success: boolean; message: string } {
  const templateFile = join(__dirname, "memory", "MEMORY.md");

  if (!existsSync(templateFile)) {
    return { success: false, message: "Template MEMORY.md not found in plugin" };
  }

  const templateContent = readFileSync(templateFile, "utf-8");

  // Extract NEVER FORGET section from template (everything between ## NEVER FORGET and next ## or EOF)
  const neverForgetMatch = templateContent.match(/## NEVER FORGET\n([\s\S]*?)(?=\n## (?!NEVER)|$)/);
  if (!neverForgetMatch) {
    return { success: false, message: "No NEVER FORGET section found in template MEMORY.md" };
  }
  const templateNeverForget = neverForgetMatch[1].trimEnd();

  // Check for MEMORY.md or memory.md at workspace root
  const memoryMdPath = join(workspacePath, "MEMORY.md");
  const memoryMdLower = join(workspacePath, "memory.md");

  const existingPath = existsSync(memoryMdPath) ? memoryMdPath
    : existsSync(memoryMdLower) ? memoryMdLower
    : null;

  if (!existingPath) {
    // No MEMORY.md exists — create from template
    writeFileSync(memoryMdPath, templateContent);
    return { success: true, message: `Created ${memoryMdPath} with NEVER FORGET section` };
  }

  // MEMORY.md exists — check for NEVER FORGET header
  let existing = readFileSync(existingPath, "utf-8");

  if (!/## NEVER FORGET/i.test(existing)) {
    // No NEVER FORGET section — insert after first # heading
    const firstHeadingEnd = existing.match(/^# .+\n/m);
    if (firstHeadingEnd) {
      const insertPos = (firstHeadingEnd.index ?? 0) + firstHeadingEnd[0].length;
      existing = existing.slice(0, insertPos) + "\n## NEVER FORGET\n" + templateNeverForget + "\n\n" + existing.slice(insertPos);
    } else {
      // No heading at all — prepend
      existing = "# OpenClaw Agent Long-Term Memory\n\n## NEVER FORGET\n" + templateNeverForget + "\n\n" + existing;
    }
    writeFileSync(existingPath, existing);
    return { success: true, message: `Added NEVER FORGET section to ${existingPath}` };
  }

  // NEVER FORGET exists — merge template items that are missing
  // Extract existing NEVER FORGET section content
  const existingNFMatch = existing.match(/## NEVER FORGET\n([\s\S]*?)(?=\n## (?!#)|$)/);
  const existingNFContent = existingNFMatch ? existingNFMatch[1] : "";

  // Extract individual items (lines starting with *) from template, grouped by subsection
  const templateLines = templateNeverForget.split("\n");
  const newLines: string[] = [];

  for (const line of templateLines) {
    // Add subsection headers and bullet items that don't exist in existing content
    if (line.startsWith("### ")) {
      if (!existingNFContent.includes(line)) {
        newLines.push(line);
      }
    } else if (line.startsWith("* ")) {
      // Check if this bullet's key content already exists (first 50 chars as fingerprint)
      const fingerprint = line.slice(2, 52).trim();
      if (!existingNFContent.includes(fingerprint)) {
        newLines.push(line);
      }
    }
  }

  if (newLines.length === 0) {
    return { success: true, message: `NEVER FORGET section in ${existingPath} is up to date` };
  }

  // Append new items at the end of existing NEVER FORGET section
  const nfEnd = existing.search(/## NEVER FORGET\n[\s\S]*?(?=\n## (?!#)|$)/);
  if (nfEnd !== -1) {
    const sectionMatch = existing.match(/## NEVER FORGET\n([\s\S]*?)(?=\n## (?!#)|$)/);
    if (sectionMatch) {
      const sectionEnd = (sectionMatch.index ?? 0) + sectionMatch[0].length;
      const insertion = "\n" + newLines.join("\n") + "\n";
      existing = existing.slice(0, sectionEnd) + insertion + existing.slice(sectionEnd);
      writeFileSync(existingPath, existing);
    }
  }

  return { success: true, message: `Updated NEVER FORGET section in ${existingPath} (added ${newLines.length} items)` };
}

function checkMcpBinary(): { available: boolean; path?: string } {
  try {
    const path = execSync("which algorand-mcp", { encoding: "utf-8" }).trim();
    return { available: true, path };
  } catch {
    // Check plugin's node_modules
    const pluginBin = join(__dirname, "node_modules", ".bin", "algorand-mcp");
    if (existsSync(pluginBin)) {
      return { available: true, path: pluginBin };
    }
    return { available: false };
  }
}

export default function register(api: PluginApi) {
  const pluginConfig = api.config.plugins?.entries?.[PLUGIN_ID]?.config ?? {};

  // ─────────────────────────────────────────────────────────────
  // x402 Fetch Tool
  // ─────────────────────────────────────────────────────────────
  if (pluginConfig.enableX402 !== false) {
    api.registerTool(
      {
        name: "x402_fetch",
        description:
          "Fetch a URL with x402 payment protocol support. On HTTP 402, returns structured PaymentRequirements and step-by-step instructions to build payment using algorand-mcp tools. Use paymentHeader to retry with a signed payment.",
        parameters: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The URL to fetch",
            },
            method: {
              type: "string",
              description: "HTTP method (default: GET)",
              enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
              default: "GET",
            },
            headers: {
              type: "object",
              description: "Additional request headers as key-value pairs",
              additionalProperties: { type: "string" },
            },
            body: {
              type: "string",
              description: "Request body (for POST/PUT/PATCH)",
            },
            paymentHeader: {
              type: "string",
              description:
                "JSON string for X-PAYMENT header — the signed payment payload from the x402 payment flow",
            },
          },
          required: ["url"],
        },
        async execute(_id: string, params: {
          url: string;
          method?: string;
          headers?: Record<string, string>;
          body?: string;
          paymentHeader?: string;
        }) {
          const result = await x402Fetch(params);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        },
      },
      { scope: "agent" },
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CLI Commands
  // ─────────────────────────────────────────────────────────────
  api.registerCli(
    ({ program }) => {
      const algorand = program
        .command("algorand-plugin")
        .description("Algorand blockchain integration (GoPlausible)");

      // Setup command - initializes (memory + mcporter) then runs interactive config
      algorand
        .command("setup")
        .description("Initialize and configure Algorand plugin")
        .action(async () => {
          console.log("\n🔷 Setting up Algorand plugin...\n");

          const workspacePath = getWorkspacePath(api);

          // Step 1: Write memory file
          const memResult = writeMemoryFile(workspacePath);
          if (memResult.success) {
            console.log(`  ✅ ${memResult.message}`);
          } else {
            console.error(`  ❌ ${memResult.message}`);
          }

          // Step 1b: Ensure MEMORY.md exists at workspace root with NEVER FORGET section
          const memIndexResult = ensureWorkspaceMemoryIndex(workspacePath);
          if (memIndexResult.success) {
            console.log(`  ✅ ${memIndexResult.message}`);
          } else {
            console.error(`  ❌ ${memIndexResult.message}`);
          }

          // Step 2: Stop any existing algorand-mcp processes
          const stopResult = stopExistingMcpProcesses();
          if (stopResult.stopped > 0) {
            console.log(`  ✅ ${stopResult.message}`);
          } else {
            console.log(`  ℹ️  ${stopResult.message}`);
          }

          // Step 3: Configure mcporter
          console.log("");
          const mcpResult = configureMcporter();
          if (mcpResult.success) {
            console.log(`  ✅ ${mcpResult.message}`);
          } else {
            console.log(`  ⚠️  ${mcpResult.message}`);
          }

          // Step 4: Interactive config
          console.log("");
          const newConfig = await runSetup(pluginConfig);
          if (newConfig) {
            const result = updatePluginConfig(newConfig);
            if (result.success) {
              console.log("\n✅ Config saved to ~/.openclaw/openclaw.json");
              console.log("   Plugin added to plugins.allow list.");
              console.log("   Restart gateway to apply changes: openclaw gateway restart\n");
            } else {
              console.error(`\n❌ Failed to save config: ${result.error}`);
              console.log("   You can manually add to ~/.openclaw/openclaw.json:");
              console.log(`   "plugins": { "allow": ["${PLUGIN_ID}"], "entries": { "${PLUGIN_ID}": { "config": ${JSON.stringify(newConfig)} } } }\n`);
            }
          }

          console.log("  Run `mcporter list algorand-mcp --schema` to verify MCP tools.\n");
        });

      // Status command
      algorand
        .command("status")
        .description("Show Algorand plugin status")
        .action(() => {
          const mcp = checkMcpBinary();

          // Check mcporter config
          let mcporterConfigured = false;
          try {
            const list = execSync("mcporter config list 2>/dev/null || echo ''", { encoding: "utf-8" });
            mcporterConfigured = list.includes("algorand-mcp");
          } catch { }

          console.log("\n🔷 Algorand Plugin Status\n");
          console.log("  Skills:");
          console.log("    • algorand-development");
          console.log("    • algorand-typescript");
          console.log("    • algorand-python");
          console.log("    • algorand-interaction");
          console.log("    • algorand-x402-typescript");
          console.log("    • algorand-x402-python");
          console.log("");
          console.log("  MCP Server:");
          console.log(`    Binary:    ${mcp.available ? `✅ ${mcp.path}` : "⚠️  Not found"}`);
          console.log(`    mcporter:  ${mcporterConfigured ? "✅ Configured" : "⚠️  Not configured (run setup)"}`);
          console.log("");
          console.log("  Config:");
          console.log(`    x402:      ${pluginConfig.enableX402 !== false ? "Enabled" : "Disabled"}`);
          console.log("");

          // Keyring status
          try {
            const scriptPath = join(__dirname, "scripts", "setup-keyring.sh");
            const keyringOutput = execSync(`bash "${scriptPath}" --detect`, { encoding: "utf-8", timeout: 5000 });
            const vars = Object.fromEntries(
              keyringOutput.trim().split("\n").map((line: string) => line.split("=", 2))
            );
            console.log("  Keyring:");
            if (vars.PERSISTENT === "true") {
              console.log(`    Storage:   ✅ ${vars.BACKEND}`);
              console.log(`    Wallets:   ${vars.WALLET_DB_COUNT} account(s) in wallet.db`);
            } else {
              console.log(`    Storage:   ⚠️  ${vars.BACKEND} — run \`openclaw algorand-plugin setup\``);
              if (parseInt(vars.WALLET_DB_COUNT) > 0) {
                console.log(`    Wallets:   ⚠️  ${vars.WALLET_DB_COUNT} account(s) with mnemonics in volatile storage!`);
              }
            }
          } catch {
            console.log("  Keyring:");
            console.log("    Storage:   ❓ Could not detect");
          }
          console.log("");
          console.log("  Links:");
          console.log(`    GoPlausible: ${GOPLAUSIBLE_SERVICES.website}`);
          console.log(`    Algorand x402: ${GOPLAUSIBLE_SERVICES.x402}`);
          console.log(`    Algorand x402 Facilitator: ${GOPLAUSIBLE_SERVICES.facilitator}`);
          console.log(`    Algorand x402 Test endpoints: ${GOPLAUSIBLE_SERVICES.test}`);
          console.log("");
        });

      // MCP config helper (for external coding agents)
      algorand
        .command("mcp-config")
        .description("Show MCP config snippet for coding agents (Claude Code, Cursor, etc.)")
        .action(() => {
          const mcp = checkMcpBinary();
          const command = mcp.path || "npx algorand-mcp";

          console.log("\n🔷 Algorand MCP Configuration\n");
          console.log("  For external coding agents, add this to their MCP config:\n");
          console.log("  Claude Code (.mcp.json):");
          console.log("  ─────────────────────────");
          console.log(`  {`);
          console.log(`    "mcpServers": {`);
          console.log(`      "algorand": {`);
          console.log(`        "command": "${command}",`);
          console.log(`        "args": []`);
          console.log(`      }`);
          console.log(`    }`);
          console.log(`  }\n`);
          console.log("  Cursor (.cursor/mcp.json) — same format\n");
          console.log("  Note: OpenClaw uses mcporter. Run `openclaw algorand-plugin setup` to configure.\n");
        });
    },
    { commands: ["algorand-plugin"] }
  );

  // ─────────────────────────────────────────────────────────────
  // Post-install hook
  // ─────────────────────────────────────────────────────────────
  api.registerHook(
    "plugin:post-install",
    async () => {
      console.log("\n🔷 Algorand plugin installed!\n");
      console.log("   This plugin provides:");
      console.log("   • 9 Algorand skills (Algorand development in TS and Python, x402, MCP interaction, alpha arcade interaction, haystack router development and interaction)");
      console.log("   • algorand-mcp server (~100 blockchain tools via mcporter)\n");

      // Ensure MEMORY.md exists at workspace root
      const workspacePath = getWorkspacePath(api);
      const memIndexResult = ensureWorkspaceMemoryIndex(workspacePath);
      if (memIndexResult.success) {
        console.log(`   ✅ ${memIndexResult.message}`);
      }

      // Keyring persistence warning for headless Linux
      try {
        const scriptPath = join(__dirname, "scripts", "setup-keyring.sh");
        const keyringOutput = execSync(`bash "${scriptPath}" --detect`, { encoding: "utf-8", timeout: 5000 });
        if (keyringOutput.includes("PERSISTENT=false")) {
          console.log("   ⚠️  Headless Linux detected — wallet keys use in-memory storage.");
          console.log("   Run `openclaw algorand-plugin setup` for persistent storage.\n");
        }
      } catch { /* ignore on install */ }

      console.log("   Next steps:");
      console.log("   1. Run `openclaw algorand-plugin setup` — initialize + configure plugin");
      console.log("   2. Restart OpenClaw gateway\n");
      console.log(`   Docs: ${GOPLAUSIBLE_SERVICES.website}\n`);
    },
    { name: "algorand.post-install", description: "Show setup instructions on install" }
  );

  // ─────────────────────────────────────────────────────────────
  // Post-update hook
  // ─────────────────────────────────────────────────────────────
  api.registerHook(
    "plugin:post-update",
    async () => {
      console.log("\n🔷 Algorand plugin updated!\n");

      // Ensure MEMORY.md and memory files are up to date
      const workspacePath = getWorkspacePath(api);
      const memResult = writeMemoryFile(workspacePath);
      if (memResult.success) {
        console.log(`   ✅ ${memResult.message}`);
      }
      const memIndexResult = ensureWorkspaceMemoryIndex(workspacePath);
      if (memIndexResult.success) {
        console.log(`   ✅ ${memIndexResult.message}`);
      }

      console.log("\n   Restart OpenClaw gateway to apply changes.\n");
    },
    { name: "algorand.post-update", description: "Update memory files on plugin update" }
  );

  api.logger.info(`Algorand plugin registered (skills: 6, MCP: ${ALGORAND_MCP.name})`);
}

export const id = PLUGIN_ID;
export const name = "Algorand Integration";
