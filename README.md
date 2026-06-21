# OpenClaw Algorand Plugin

🔷 Algorand blockchain integration for [OpenClaw](https://openclaw.ai) — by [GoPlausible](https://goplausible.com)

## Features

- **Bundled Algorand MCP Server**: `@goplausible/algorand-mcp` (pinned to `4.3.3`, 123 tools, **defaults to testnet**) — wallet, transactions, smart contracts, TEAL, indexer, DEX, NFD, Haystack Router, Alpha Arcade, x402 payments, knowledge base
- **x402 Payment Protocol**: HTTP-native payments on Algorand via `@goplausible/algorand-mcp`'s `x402_discover_payment_requirements` and `make_http_request_with_x402` tools (surfaced through mcporter)
- **Zero-privilege installation**: First-load init only writes a declarative entry into `~/.mcporter/mcporter.json` and a memory file into the agent workspace — no shell scripts, no system packages, no keyring installation, no `sudo`, no post-install hooks
- **9 Skills** covering development, interaction, x402, DEX aggregation, and prediction markets:
  - `algorand-development` — AlgoKit CLI, project creation, general workflows
  - `algorand-typescript` — TypeScript smart contracts (PuyaTs)
  - `algorand-python` — Python smart contracts (PuyaPy)
  - `algorand-interaction` — Blockchain interaction via MCP (wallet, transactions, swaps, NFD)
  - `algorand-x402-typescript` — x402 payments development in TypeScript
  - `algorand-x402-python` — x402 payments development in Python
  - `haystack-router-development` — DEX aggregator SDK integration
  - `haystack-router-interaction` — Best-price swaps via MCP tools
  - `alpha-arcade-interaction` — Prediction markets interaction

## Installation

From [ClawHub](https://clawhub.ai):

```bash
clawhub install @goplausible/algorand-plugin
```

Or from a local path (source code):

```bash
openclaw plugins install ./path/to/algorand-plugin
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
| `<agent-workspace>/.openclaw/algorand-plugin.initialized` | First load | Marker file so first-load init is skipped on subsequent gateway starts. |
| `~/.openclaw/openclaw.json` | When you run `openclaw algorand-plugin setup` | Adds `algorand-plugin` to `plugins.allow`, sets `plugins.entries.algorand-plugin.enabled = true`, and persists the plugin config. |

The plugin does **not**:

- Install OS packages (no `apt`, `brew`, `pacman`, `gnome-keyring`, `libsecret-tools`, `dbus-user-session`).
- Elevate privileges or require `sudo`.
- Run shell scripts, `loginctl linger`, or any D-Bus session setup.
- Read or back up wallet mnemonics — wallet storage is owned entirely by `@goplausible/algorand-mcp`.
- Register post-install or post-update hooks.

The source is small and self-contained:

- [`index.ts`](./index.ts) — plugin entry, CLI registration (`setup`, `status`, `mcp-config`)
- [`lib/mcporter.ts`](./lib/mcporter.ts) — mcporter JSON merge
- [`lib/workspace.ts`](./lib/workspace.ts) — memory file + MEMORY.md merge + OpenClaw config writer (`plugins.allow`, `plugins.entries.algorand-plugin.enabled`)
- [`setup.ts`](./setup.ts) — setup wizard (memory + mcporter + allow-list sync; no questions asked)

## Commands

```bash
openclaw algorand-plugin setup       # Re-run interactive configuration
openclaw algorand-plugin status      # Show plugin status (binary, mcporter, config)
openclaw algorand-plugin mcp-config  # Show MCP config snippet for external coding agents
```

## MCP Server

The plugin bundles [`@goplausible/algorand-mcp`](https://www.npmjs.com/package/@goplausible/algorand-mcp) as an npm dependency. It runs locally via stdio through [mcporter](https://www.npmjs.com/package/mcporter).

- **123 tools** across 14 categories (wallet, transactions, algod, indexer, NFD, Tinyman, Haystack Router, Pera verification, Alpha Arcade, x402 payments, TEAL, knowledge base, and more)
- **Multi-network**: `mainnet`, `testnet`, `localnet`
- **Secure wallet**: private keys not exposed to agents

Wallet persistence is handled by `algorand-mcp` itself. The plugin does not install, configure, or manage any keyring software — it simply registers the MCP server with mcporter and lets the MCP server own wallet storage.

## x402 Payment Protocol

x402 HTTP-native payments on Algorand are handled by `@goplausible/algorand-mcp`'s two x402 tools (surfaced through mcporter):

- **`x402_discover_payment_requirements`** — probes an x402-protected endpoint and returns the server's `accepts[]` array (cost, networks, assets, facilitator) without paying. Use for supervised flows where the user should approve the cost first.
- **`make_http_request_with_x402`** — runs discovery → selects the cheapest affordable Algorand requirement (or one matching `preferredNetwork`) → builds an atomic 2-transaction group (facilitator fee-payer + wallet payment) → signs the payment leg with the active wallet → resends with `PAYMENT-SIGNATURE` header → returns the resource plus the settlement readback. Pass `paymentRequirements` (from discovery), `preferredNetwork`, and `maxAmountPerRequest` as guardrails.

See the `algorand-interaction` skill ([`references/examples-algorand-mcp.md`](./skills/algorand-interaction/references/examples-algorand-mcp.md)) for the full workflow, response shapes, and common errors.

## Plugin Config

Config lives in `~/.openclaw/openclaw.json` under `plugins.entries.algorand-plugin`:

```json
{
  "plugins": {
    "allow": ["algorand-plugin"],
    "entries": {
      "algorand-plugin": {
        "enabled": true,
        "config": {}
      }
    }
  }
}
```

The plugin has no required config keys. Setup writes the `enabled` flag and adds the plugin to `plugins.allow`; the `config` object is reserved for future options.

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
