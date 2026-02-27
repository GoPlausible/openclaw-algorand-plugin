# OpenClaw Algorand Plugin

🔷 Algorand blockchain integration for [OpenClaw](https://openclaw.ai) — by [GoPlausible](https://goplausible.com)

## Features

- **MCP Integration**: Connect to Algorand Remote MCP servers for blockchain operations
- **Interactive Setup**: Guided wizard for configuration and OAuth authentication
- **Skills Included** (6 skills):
  - `algorand-development` — CLI, examples, general workflows
  - `algorand-typescript` — TypeScript contracts & tools
  - `algorand-python` — Python contracts & tools
  - `algorand-interaction` — Blockchain interaction via MCP (wallet, transactions, swaps, NFD)
  - `algorand-x402-typescript` — TypeScript x402 micropayments
  - `algorand-x402-python` — Python x402 micropayments
- **AGENTS.md**: Comprehensive documentation for all Algorand skills

## Installation

```bash
openclaw plugins install openclaw-algorand-plugin
```

Or install from local path:

```bash
openclaw plugins install ./path/to/openclaw-algorand-plugin
```

## Post-Installation Setup

After installing, run these commands:

```bash
# 1. Copy AGENTS.md to your workspace (contains skill documentation)
openclaw algorand-plugin init

# 2. Run interactive setup (choose MCP server, authenticate)
openclaw algorand-plugin setup
```

## Commands

```bash
openclaw algorand-plugin init      # Copy AGENTS.md to workspace
openclaw algorand-plugin setup     # Run interactive setup wizard
openclaw algorand-plugin auth      # Authenticate with Algorand MCP (OAuth)
openclaw algorand-plugin status    # Show current configuration
openclaw algorand-plugin use lite  # Switch to MCP Lite (wallet edition)
openclaw algorand-plugin use full  # Switch to full MCP
```

## MCP Servers

| Server | URL | Features |
|--------|-----|----------|
| **Full** | `https://algorandmcp.goplausible.xyz/sse` | Complete Algorand tooling: wallet, transactions, smart contracts, TEAL, indexer, knowledge base |
| **Lite** | `https://algorandmcplite.goplausible.xyz/sse` | Agentic wallet: payments, transfers, swaps, NFD, QR codes, receipts |

**Authentication**: OAuth + OIDC with HashiCorp Vault for secure keypair management
**Network**: Mainnet only (testnet support coming soon)

## Configuration

Config is stored in OpenClaw's config under `plugins.entries.openclaw-algorand-plugin.config`:

```json5
{
  plugins: {
    entries: {
      algorand: {
        enabled: true,
        config: {
          mcpServer: "lite",
          mcpServerUrl: "https://algorandmcplite.goplausible.xyz/sse",
          enableX402: true,
          authenticated: true
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
| `algorand-typescript` | TypeScript smart contracts (TEALScript/Puya-TS) |
| `algorand-python` | Python smart contracts (Puya) |
| `algorand-interaction` | MCP-based blockchain interaction (wallet, txns, DEX) |
| `algorand-x402-typescript` | x402 micropayments in TypeScript |
| `algorand-x402-python` | x402 micropayments in Python |

## Links

- **GoPlausible**: https://goplausible.com
- **x402 Gateway**: https://x402.goplausible.xyz
- **Facilitator**: https://facilitator.goplausible.xyz
- **OpenClaw**: https://openclaw.ai

## License

MIT © [GoPlausible](https://goplausible.com)
