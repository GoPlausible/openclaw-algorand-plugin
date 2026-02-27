---
name: algorand-interaction
description: Interact with Algorand blockchain via GoPlausible Remote MCP servers — wallet operations, ALGO/ASA transactions, account info, NFD lookups, atomic groups, Tinyman swaps. Use when user asks about Algorand wallet, balances, sending ALGO or tokens, asset opt-in, transactions, NFD names, DEX swaps, or account details. Supports both MCP Lite (wallet-focused) and Full MCP (includes smart contracts, indexer, knowledge base).
metadata: {"openclaw": {"requires": {"bins": ["mcporter"]}, "emoji": "🔷"}}
---

# Algorand Remote MCP Interaction (GoPlausible)

Interact with Algorand Mainnet via MCP servers.

## MCP Server Selection

| Server | URL | Use For |
|--------|-----|---------|
| **Lite** | `https://algorandmcplite.goplausible.xyz/sse` | Wallet ops, payments, assets, NFD, swaps |
| **Full** | `https://algorandmcp.goplausible.xyz/sse` | + Smart contracts, indexer, TEAL, knowledge docs |

**Network:** Mainnet only (testnet support coming soon)

## Session Start Checklist

**At EVERY session start:**

1. **Check wallet**: `wallet_get_info` — verify wallet exists and is configured
2. **Show quick reference**: Common assets table + workflow steps to user

## Pre-Transaction Validation

Before ANY transaction:

1. **MBR Check**: Account needs 0.1 ALGO minimum + 0.1 per asset/app opt-in
2. **Asset Opt-In**: Verify with `algod_get_account_asset_info` before transfers
3. **Fees**: Every txn costs 0.001 ALGO (1000 microAlgos)
4. **Balance Check**: Always fetch current balance before signing
5. **Top-up QR**: If funds insufficient, use `generate_algorand_qrcode` for PeraWallet top-up
6. **Order**: ALGO funding first, then asset transactions

## Common Mainnet Assets

| Asset | ID | Decimals |
|-------|-----|----------|
| USDC | 31566704 | 6 |
| USDT | 312769 | 6 |
| ALGO | N/A | 6 |
| goETH | 386192725 | 8 |
| goBTC | 386195940 | 8 |

> Always verify asset IDs — scam tokens use similar names.

## Transaction Types

- **pay**: ALGO transfers
- **axfer**: Asset transfers, opt-in, clawback
- **acfg**: Asset create/configure/destroy
- **appl**: Smart contract calls
- **afrz**: Asset freeze/unfreeze
- **keyreg**: Consensus key registration

## Single Transaction Workflow

| Step | Tool | Purpose |
|------|------|---------|
| 1 | `wallet_get_info` | Verify wallet |
| 2 | Query tools | Get blockchain data |
| 3 | `sdk_txn_*` tools | Create transaction |
| 4 | `wallet_sign_transaction` | Sign |
| 5 | `sdk_submit_transaction` | Submit |
| 6 | Query tools | Verify result |

## Atomic Group Transaction Workflow

| Step | Tool | Purpose |
|------|------|---------|
| 1 | `wallet_get_info` | Verify wallet |
| 2 | Query tools | Get blockchain data |
| 3 | `sdk_create_atomic_group` | Create grouped txns (auto-assigns group ID) |
| 4 | `wallet_sign_atomic_group` | Sign all txns in group |
| 5 | `sdk_submit_atomic_group` | Submit (all-or-nothing) |
| 6 | Query tools | Verify result |

## Tool Categories

**Wallet**: `wallet_get_info`, `wallet_sign_transaction`, `wallet_sign_atomic_group`, `wallet_get_assets`

**Account**: `algod_get_account_info`, `sdk_check_account_balance`, `algod_get_account_asset_info`

**Transactions**: `sdk_txn_payment_transaction`, `sdk_txn_asset_optin`, `sdk_txn_transfer_asset`, `sdk_create_atomic_group`, `sdk_assign_group_id`

**Submit**: `sdk_submit_transaction`, `sdk_submit_atomic_group`

**Assets**: `algod_get_asset_info`, `pera_verified_asset_query`, `pera_verified_assets_search`

**NFD**: `api_nfd_get_nfd`, `api_nfd_get_nfds_for_address`

**Utility**: `sdk_validate_address`, `generate_algorand_qrcode`, `generate_algorand_receipt`, `generate_ap2_mandate`

**DEX**: `tinyman_*` — Tinyman swap tools

**Full MCP Only**: `sdk_compile_teal`, `sdk_encode_obj`, `sdk_decode_obj`, `list_knowledge_docs`, `get_knowledge_doc`

## References

For detailed tool documentation:
- **Lite MCP**: See [references/algorand-remote-mcp-lite.md](references/algorand-remote-mcp-lite.md)
- **Full MCP**: See [references/algorand-remote-mcp.md](references/algorand-remote-mcp.md)

For workflow examples:
- **Lite Examples**: See [references/examples-algorand-remote-mcp-lite.md](references/examples-algorand-remote-mcp-lite.md)
- **Full Examples**: See [references/examples-algorand-remote-mcp.md](references/examples-algorand-remote-mcp.md)

## NFD Important Note

When using NFD (`.algo` names), always use `depositAccount` field for transactions, NOT other address fields.

## Security

- **Mainnet = real value** — double-check everything
- Private keys stored in HashiCorp Vault (server-side signing via OAuth+OIDC)
- Never expose mnemonics or keys
- Verify recipient addresses (transactions are irreversible)

## Links

- GoPlausible: https://goplausible.com
- x402: https://x402.goplausible.xyz
- Facilitator: https://facilitator.goplausible.xyz
