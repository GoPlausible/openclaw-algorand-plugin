# Algorand Plugin Guide

This plugin enables three core capabilities:

1. **Algorand Development** — Smart contracts, typed clients, React frontends via AlgoKit CLI and skills
2. **Blockchain Interaction** — Algorand MCP server (99 tools) via mcporter
3. **x402 Payment Protocol** — HTTP-native payments with Algorand as first-class chain

## Skill Routing

| Capability | Task | Skill |
|------------|------|-------|
| Development | CLI, examples, general workflows | `algorand-development` |
| Development | TypeScript contracts & tools | `algorand-typescript` |
| Development | Python contracts & tools | `algorand-python` |
| Interaction | Blockchain interaction via MCP | `algorand-interaction` |
| x402 | TypeScript x402 development | `algorand-x402-typescript` |
| x402 | Python x402 development | `algorand-x402-python` |

## Using Algorand MCP Tools

The Algorand MCP server is configured in **mcporter** as `algorand-mcp`. Call tools like this:

```bash
# List all tools
mcporter list algorand-mcp

# Call a tool
mcporter call algorand-mcp.wallet_get_info
mcporter call algorand-mcp.get_account_info address=XXXXX network=testnet
mcporter call algorand-mcp.search_assets name=USDC network=mainnet
```

**Key tool categories:**
- `wallet_*` — Wallet operations (get_info, create, send transactions)
- `get_account_*` / `search_*` — Account and asset queries
- `algo_*` / `asa_*` — ALGO and ASA transfers
- `nfd_*` — NFD (.algo) name lookups
- `tinyman_*` — DEX swaps
- `get_knowledge_*` — Developer documentation

## Key things to remember

- Always check wallet with `wallet_get_info` before blockchain operations
- Use `get_knowledge_doc` for Algorand developer documentation
- Mainnet = real value — always confirm with user before mainnet transactions
- Default to testnet during development
- Every transaction costs 0.001 ALGO minimum
- Account needs 0.1 ALGO base + 0.1 per asset/app opt-in (MBR)

## Common Mainnet Assets

| Asset | ASA ID | Decimals |
|-------|--------|----------|
| ALGO | native (0) | 6 |
| USDC | 31566704 | 6 |
| USDT | 312769 | 6 |
| goETH | 386192725 | 8 |
| goBTC | 386195940 | 8 |

## Important patterns

- **NEVER use PyTEAL or Beaker** — these are legacy. Use Algorand TypeScript or Algorand Python.
- **NEVER use AlgoExplorer** — obsolete. Use Allo.info for block/account/transaction data.
- **NFD (.algo names)**: Always use `depositAccount` field for transactions.

## External resources

- GoPlausible: https://goplausible.com
- Algorand: https://algorand.co
- x402 Gateway: https://x402.goplausible.xyz
- Facilitator: https://facilitator.goplausible.xyz
- Testnet Faucet: https://lora.algokit.io/testnet/fund
- Algorand Developer Docs: https://dev.algorand.co/
- Algorand Developer Docs Github : https://github.com/algorandfoundation/devportal
- Algorand Developer Examples Github : https://github.com/algorandfoundation/devportal-code-examples
- GoPlausible x402-avm Documentation and Example code : https://github.com/GoPlausible/.github/blob/main/profile/algorand-x402-documentation/README.md
- GoPlausible x402-avm Examples template Projects : https://github.com/GoPlausible/x402-avm/tree/branch-v2-algorand-publish/examples/
- CAIP-2 Specification : https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md
- Coinbase x402 Protocol : https://github.com/coinbase/x402
