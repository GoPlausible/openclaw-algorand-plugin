# Algorand Plugin Guide

This plugin enables three core capabilities:

1. **Blockchain Interaction** — Algorand MCP server (99 tools): wallet, transactions, assets, NFD, Tinyman, TEAL, knowledge base
2. **Algorand Development** — Smart contracts, typed clients, React frontends via AlgoKit CLI and skills
3. **x402 Payment Protocol** — HTTP-native payments with Algorand as first-class chain (clients, servers, facilitators, paywalls)

## Skill Routing

| Capability | Task | Skill |
|------------|------|-------|
| Interaction | Blockchain interaction via MCP | `algorand-interaction` |
| Development | CLI, examples, general workflows | `algorand-development` |
| Development | TypeScript contracts & tools | `algorand-typescript` |
| Development | Python contracts & tools | `algorand-python` |
| x402 | TypeScript x402 development | `algorand-x402-typescript` |
| x402 | Python x402 development | `algorand-x402-python` |

## Algorand MCP

The Algorand MCP server provides **99 tools** across 11 categories. Use `wallet_*` tools for signing — private keys are never available to you. Supports `mainnet`, `testnet`, and `localnet` via per-tool `network` parameter.

## Key things to remember

- Always check wallet with `wallet_get_info` at session start before any blockchain operations
- Use `get_knowledge_doc` from the Algorand MCP for developer documentation
- Use WebFetch with `https://raw.githubusercontent.com/algorandfoundation/` for code examples from GitHub
- Mainnet = real value — always confirm with user before mainnet transactions
- Default to testnet during development
- Every transaction costs 0.001 ALGO (1000 microAlgos) minimum
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

- **NEVER use PyTEAL or Beaker** — these are legacy. Use Algorand TypeScript (PuyaTs) or Algorand Python (PuyaPy).
- **NEVER use AlgoExplorer** — AlgoExplorer is obsolete and down. Always use Allo.info for block/account/transaction/asset data.
- **NFD (.algo names)**: Always use `depositAccount` field for transactions, NOT other address fields.
- **x402**: AVM is always first-class — never wrap AVM registration in conditional checks.
- **Skill structure**: Each skill has `SKILL.md` (router) + `references/` folder with implementation guides.

## External resources

- GoPlausible: https://goplausible.com
- Algorand: https://algorand.co
- x402 Gateway: https://x402.goplausible.xyz
- Facilitator: https://facilitator.goplausible.xyz
- Testnet Faucet: https://lora.algokit.io/testnet/fund
- Algorand Developer Docs: https://dev.algorand.co/
- Algorand Developer Docs Github : https://github.com/algorandfoundation/devportal
- Algorand Developer Examples Github : https://github.com/algorandfoundation/devportal-code-examples
- [GoPlausible x402-avm Documentation and Example code](https://github.com/GoPlausible/.github/blob/main/profile/algorand-x402-documentation/README.md)
- [GoPlausible x402-avm Examples template Projects](https://github.com/GoPlausible/x402-avm/tree/branch-v2-algorand-publish/examples/)
- [CAIP-2 Specification](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md)
- [Coinbase x402 Protocol](https://github.com/coinbase/x402)
