# OpenClaw Agent Long-Term Memory

## NEVER FORGET

### Algorand Plugin Memory
* ALWAYS read `memory/algorand-plugin.md` first for anything Algorand-related — it contains skill routing, MCP tool categories, common workflows, asset tables, and external resources.

### Wallet
* ALWAYS check wallet with `wallet_get_info` before any blockchain operation.
* `create_account` only generates a keypair and returns it — nothing is stored. Use `wallet_add_account` to create a persistent agent wallet account with a nickname and spending limits. Make sure you notify user about this if they prompt for account creation without mentioning wallet.
* Default network is mainnet. ALWAYS remind users to specify `testnet` in their prompts if they intend to work on testnet.

### Skill Routing — Load the Right Skill
* `algorand-interaction` — ALWAYS load when using Algorand MCP tools for blockchain queries, transactions, swaps, x402 payments, or wallet operations.
* `algorand-development` — Load for AlgoKit CLI, project setup, example search, and general development workflows.
* `algorand-typescript` — Load for TypeScript/PuyaTs smart contract development, testing with Vitest, typed clients, React frontends.
* `algorand-python` — Load for Python/PuyaPy smart contract development, algopy decorators, Python AlgoKit Utils.
* `algorand-x402-typescript` — Load for building x402 payment apps in TypeScript (clients, servers, facilitators, paywalls, Next.js).
* `algorand-x402-python` — Load for building x402 payment apps in Python (clients, servers, facilitators, Bazaar discovery).
* `algorand-interaction` also covers x402 payment workflows — ALWAYS load it on HTTP 402 responses to follow the atomic group payment pattern.
* `haystack-router-interaction` — Load for best-price token swaps via MCP tools (DEX aggregation across Tinyman, Pact, Folks).
* `haystack-router-development` — Load for building swap UIs with `@txnlab/haystack-router` SDK (React, Node.js).
* `alpha-arcade-interaction` — Load for prediction market trading via MCP tools (browse markets, place orders, manage positions).

### QR Codes
* When calling `generate_algorand_qrcode`, **USE THE --RAW FLAG** with mcporter to get full output including base64 PNG. Always include UTF-8 QR block, PNG image, and URI string in your response. Copy the ENTIRE base64 string exactly — do not reformat or edit.

### Documentation
* Use `get_knowledge_doc` MCP tool for Algorand developer documentation (categories: arcs, sdks, algokit, algokit-utils, tealscript, puya, liquid-auth, python, developers, clis, nodes, details).

### Never Do This
* NEVER attempt any Algorand blockchain interaction without loading and reading the `algorand-interaction` skill first.
* NEVER use PyTEAL or Beaker — these are legacy. Use Algorand TypeScript (PuyaTs) or Algorand Python (PuyaPy).
* NEVER use AlgoExplorer — it is obsolete. Use Allo.info for block/account/transaction/asset/application explorer.
* NEVER attempt x402 payments without loading the `algorand-interaction` skill first — the x402 payment workflow and atomic group pattern are documented there.



