# OpenClaw Algorand Plugin

🔷 Algorand blockchain integration for [OpenClaw](https://openclaw.ai) — by [GoPlausible](https://goplausible.com)

## Features

- **Bundled Algorand MCP Server**: `@goplausible/algorand-mcp` (pinned to `^3.9.6`, 107 tools) — wallet, transactions, smart contracts, TEAL, indexer, DEX, NFD, Haystack Router, Alpha Arcade, knowledge base
- **x402 Payment Protocol**: Built-in `x402_fetch` tool for HTTP-native payments on Algorand
- **Zero-privilege installation**: First-load init only writes a declarative entry into `~/.mcporter/mcporter.json` and a memory file into the agent workspace — no shell scripts, no system packages, no keyring installation, no `sudo`, no post-install hooks
- **9 Skills** covering development, interaction, x402, DEX aggregation, and prediction markets:
  - `algorand-development` — AlgoKit CLI, project creation, general workflows
  - `algorand-typescript` — TypeScript smart contracts (PuyaTs)
  - `algorand-python` — Python smart contracts (PuyaPy)
  - `algorand-interaction` — Blockchain interaction via MCP (wallet, transactions, swaps, NFD)
  - `algorand-x402-typescript` — x402 payments in TypeScript
  - `algorand-x402-python` — x402 payments in Python
  - `haystack-router-development` — DEX aggregator SDK integration
  - `haystack-router-interaction` — Best-price swaps via MCP tools
  - `alpha-arcade-interaction` — Prediction markets interaction

## Installation

From [ClawHub](https://clawhub.ai):

```bash
clawhub install @goplausible/openclaw-algorand-plugin
```

Or from a local path (source code):

```bash
openclaw plugins install ./path/to/openclaw-algorand-plugin
```

## Configuration

On first load, the plugin initializes idempotently:

- Writes the plugin memory file into your agent workspace (`memory/algorand-plugin.md`)
- Ensures the workspace `MEMORY.md` contains the Algorand NEVER FORGET block
- Registers `algorand-mcp` in `~/.mcporter/mcporter.json`

To (re)run the interactive configuration wizard or rewrite the mcporter entry:

```bash
openclaw algorand-plugin setup
openclaw gateway restart
```

## What this plugin writes to your system

The plugin performs only **declarative file writes** — no shell scripts, no system packages, no privilege elevation, no keyring installation, no D-Bus/loginctl changes.

| Path | When | Purpose |
|------|------|---------|
| `~/.mcporter/mcporter.json` | First load + `setup` | Idempotently adds an `algorand-mcp` entry pointing at the bundled binary. Existing entries for other servers are preserved. |
| `<agent-workspace>/memory/algorand-plugin.md` | First load + `setup` | Writes the plugin's Algorand routing guide for the agent. |
| `<agent-workspace>/MEMORY.md` | First load + `setup` | Adds a `## NEVER FORGET` block (or updates its subsections) if not already present. Existing content is preserved. |
| `<agent-workspace>/.openclaw/openclaw-algorand-plugin.initialized` | First load | Marker file so first-load init is skipped on subsequent gateway starts. |
| `~/.openclaw/openclaw.json` | When you run `openclaw algorand-plugin setup` and confirm | Persists the plugin config (`enableX402`). |

The plugin does **not**:

- Install OS packages (no `apt`, `brew`, `pacman`, `gnome-keyring`, `libsecret-tools`, `dbus-user-session`).
- Elevate privileges or require `sudo`.
- Run shell scripts, `loginctl linger`, or any D-Bus session setup.
- Read or back up wallet mnemonics — wallet storage is owned entirely by `@goplausible/algorand-mcp`.
- Register post-install or post-update hooks.

The source is small and self-contained:

- [`index.ts`](./index.ts) — plugin entry, tool + CLI registration
- [`lib/mcporter.ts`](./lib/mcporter.ts) — mcporter JSON merge
- [`lib/workspace.ts`](./lib/workspace.ts) — memory file + MEMORY.md merge + plugin config writer
- [`lib/x402-fetch.ts`](./lib/x402-fetch.ts) — x402 fetch implementation
- [`setup.ts`](./setup.ts) — interactive config prompt (x402 toggle only)

## Commands

```bash
openclaw algorand-plugin setup       # Re-run interactive configuration
openclaw algorand-plugin status      # Show plugin status (binary, mcporter, config)
openclaw algorand-plugin mcp-config  # Show MCP config snippet for external coding agents
```

## MCP Server

The plugin bundles [`@goplausible/algorand-mcp`](https://www.npmjs.com/package/@goplausible/algorand-mcp) as an npm dependency. It runs locally via stdio through [mcporter](https://www.npmjs.com/package/mcporter).

- **107 tools** across 13 categories (wallet, transactions, algod, indexer, NFD, Tinyman, Haystack Router, Pera verification, Alpha Arcade, TEAL, knowledge base, and more)
- **Multi-network**: `mainnet`, `testnet`, `localnet`
- **Secure wallet**: Per-transaction and daily spending limits, private keys never exposed to agents

Wallet persistence is handled by `algorand-mcp` itself. The plugin does not install, configure, or manage any keyring software — it simply registers the MCP server with mcporter and lets the MCP server own wallet storage.

## x402 Payment Protocol

When `enableX402` is enabled (default), the plugin registers the `x402_fetch` tool — an HTTP fetch with [x402](https://github.com/coinbase/x402) payment protocol support.

- Fetches URLs normally; on HTTP 402, returns structured `PaymentRequirements` with step-by-step instructions
- Agent builds payment using algorand-mcp wallet tools (atomic group with facilitator-sponsored fees)
- Agent retries with signed `PAYMENT-SIGNATURE` header to complete the payment and access the resource

## Plugin Config

Config lives in `~/.openclaw/openclaw.json` under `plugins.entries.openclaw-algorand-plugin.config`:

```json
{
  "plugins": {
    "allow": ["openclaw-algorand-plugin"],
    "entries": {
      "openclaw-algorand-plugin": {
        "config": {
          "enableX402": true
        }
      }
    }
  }
}
```

| Key | Default | Description |
|-----|---------|-------------|
| `enableX402` | `true` | Enable `x402_fetch` tool and x402 skills |

## Skills Overview

| Skill | Purpose |
|-------|---------|
| `algorand-development` | AlgoKit CLI, project creation, general workflows |
| `algorand-typescript` | TypeScript smart contracts (PuyaTs) |
| `algorand-python` | Python smart contracts (PuyaPy) |
| `algorand-interaction` | MCP-based blockchain interaction (wallet, txns, DEX, NFD, x402) |
| `algorand-x402-typescript` | x402 payments in TypeScript |
| `algorand-x402-python` | x402 payments in Python |
| `haystack-router-development` | Haystack router SDK integration |
| `haystack-router-interaction` | Haystack router interaction via MCP |
| `alpha-arcade-interaction` | Alpha Arcade prediction markets interaction |

## Compatibility

- **OpenClaw gateway**: `>= 2026.3.14`
- **Plugin API**: `>= 2026.3.14`
- **Node**: `>= 20`

## Links

- **GoPlausible**: https://goplausible.com
- **Algorand**: https://algorand.co
- **Algorand Developer Docs**: https://dev.algorand.co/
- **Algorand x402**: https://x402.goplausible.xyz
- **Algorand x402 test endpoints**: https://example.x402.goplausible.xyz/
- **Algorand x402 Facilitator**: https://facilitator.goplausible.xyz
- **OpenClaw**: https://openclaw.ai
- **ClawHub**: https://clawhub.ai

## License

MIT © [GoPlausible](https://goplausible.com)
