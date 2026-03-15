# OpenClaw Algorand Plugin

🔷 Algorand blockchain integration for [OpenClaw](https://openclaw.ai) — by [GoPlausible](https://goplausible.com)

## Features

- **Local MCP Server**: Bundled `algorand-mcp` (107 tools) — wallet, transactions, smart contracts, TEAL, indexer, DEX, NFD, Haystack Router, Alpha Arcade, knowledge base
- **x402 Payment Protocol**: Built-in `x402_fetch` tool for HTTP-native payments on Algorand
- **Headless Linux Keyring Persistence**: Automatic setup for wallet key persistence on cloud VMs and Docker (survives reboots)
- **Interactive Setup**: Guided wizard for configuration
- **Skills Included** (9 skills):
  - `algorand-development` — AlgoKit CLI, project creation, general workflows
  - `algorand-typescript` — TypeScript smart contracts (PuyaTs)
  - `algorand-python` — Python smart contracts (PuyaPy)
  - `algorand-interaction` — Blockchain interaction via MCP (wallet, transactions, swaps, NFD)
  - `algorand-x402-typescript` — x402 payments in TypeScript
  - `algorand-x402-python` — x402 payments in Python
  - `algorand-x402-payment` — Runtime x402 payment (agent as client)
  - `haystack-router-development` — DEX aggregator SDK integration
  - `haystack-router-interaction` — Best-price swaps via MCP tools
  - `alpha-arcade-interaction` — Prediction markets interaction

## Installation

```bash
openclaw plugins install @goplausible/openclaw-algorand-plugin
```

Or install from local path if you are running from source code:

```bash
openclaw plugins install ./path/to/openclaw-algorand-plugin
```

## Post-Installation Setup

After installing, run these commands:

```bash
# 1. Setup plugin (memory file + mcporter + interactive config)
openclaw algorand-plugin setup

# 2. Restart the gateway
openclaw gateway restart
```

## Commands

```bash
openclaw algorand-plugin setup       # Initialize + configure plugin (memory, mcporter, options)
openclaw algorand-plugin status      # Show plugin status (binary, mcporter, config)
openclaw algorand-plugin mcp-config  # Show MCP config snippet for external coding agents
```

## MCP Server

The plugin bundles [`@goplausible/algorand-mcp`](https://www.npmjs.com/package/@goplausible/algorand-mcp) as an npm dependency. It runs locally via stdio through [mcporter](https://www.npmjs.com/package/mcporter).

- **107 tools** across 13 categories (wallet, transactions, algod, indexer, NFD, Tinyman, Haystack Router, Pera verification, Alpha Arcade, TEAL, knowledge base, and more)
- **Multi-network**: `mainnet`, `testnet`, `localnet`
- **Secure wallet**: Per-transaction and daily spending limits, private keys never exposed to agents

## x402 Payment Protocol

When `enableX402` is enabled (default), the plugin registers the `x402_fetch` tool — an HTTP fetch with [x402](https://github.com/coinbase/x402) payment protocol support.

- Fetches URLs normally; on HTTP 402, returns structured `PaymentRequirements` with step-by-step instructions
- Agent builds payment using algorand-mcp wallet tools (atomic group with facilitator-sponsored fees)
- Agent retries with signed `PAYMENT-SIGNATURE` header to complete the payment and access the resource

## Headless Linux (Cloud VMs, Docker)

On headless Linux, the OS keyring defaults to in-memory storage — wallet keys created by `algorand-mcp` are **lost on reboot**. The setup wizard (`openclaw algorand-plugin setup`) automatically detects this and:

1. Installs `gnome-keyring`, `libsecret-tools`, `dbus-user-session`
2. Enables `loginctl linger` for D-Bus session persistence
3. Creates a persistent login keyring (auto-unlocked, no password)
4. Backs up and restores existing wallet mnemonics if upgrading

After setup, wallet keys persist across reboots with no user interaction needed. Agent wallets are hot wallets — keep funds minimal and use QR code top-ups.

## Configuration

Config is stored in `~/.openclaw/openclaw.json` under `plugins.entries.openclaw-algorand-plugin.config`:

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

## Skills Overview

| Skill | Purpose |
|-------|---------|
| `algorand-development` | AlgoKit CLI, project creation, general workflows |
| `algorand-typescript` | TypeScript smart contracts (PuyaTs) |
| `algorand-python` | Python smart contracts (PuyaPy) |
| `algorand-interaction` | MCP-based blockchain interaction (wallet, txns, DEX, NFD, x402) |
| `algorand-x402-typescript` | x402 payments in TypeScript |
| `algorand-x402-python` | x402 payments in Python |
| `haystack-router-development` | Haystack router development |
| `haystack-router-interaction` | Haystack router interaction |
| `alpha-arcade-interaction` | Alpha Arcade interaction |

## Links

- **GoPlausible**: https://goplausible.com
- **Algorand**: https://algorand.co
- **Algorand Developer Docs**: https://dev.algorand.co/
- **Algorand x402**: https://x402.goplausible.xyz
- **Algorand x402 test endpoints**: https://example.x402.goplausible.xyz/
- **Algorand x402 Facilitator**: https://facilitator.goplausible.xyz
- **OpenClaw**: https://openclaw.ai

## License

MIT © [GoPlausible](https://goplausible.com)
