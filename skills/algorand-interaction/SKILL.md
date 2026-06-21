---
name: algorand-interaction
description: Interact with Algorand blockchain via the Algorand MCP server — wallet operations, ALGO/ASA transactions, smart contracts, account info, NFD lookups, atomic groups, Tinyman swaps, Haystack Router DEX-aggregated swaps, TEAL compilation, knowledge base. Use when user asks about Algorand wallet, balances, sending ALGO or tokens, asset opt-in, transactions, NFD names, DEX swaps, smart contracts, or account details.
---

# Algorand MCP Interaction

Interact with Algorand blockchain through the Algorand MCP server (126 tools across 16 categories, including x402 payments and Bazaar discovery).

## Key Characteristics

- **Secure signing** — use `wallet_*` tools to sign; private keys are never available to you
- **Multi-network** — supports `mainnet`, `testnet`, and `localnet`

## mcporter Syntax (Critical)

When calling Algorand MCP tools via mcporter, use the correct syntax:

**Correct:**
```bash
mcporter call algorand-mcp.tool_name --args '{"param": "value", "network": "testnet"}'
```

**Also correct (flag-style):**
```bash
mcporter call algorand-mcp.tool_name param=value network=testnet
```

**Wrong — args not sent properly:**
```bash
mcporter call algorand-mcp tool_name '{"param": "value"}'  # Space instead of dot, missing --args
```

Key points:
- Use `server.tool` (dot notation), NOT `server tool` (space)
- Use `--args '{"json"}'` for JSON payloads
- Or use `param=value` / `param:value` flag syntax

## Session Start Checklist

**At EVERY session start:**

1. **Check wallet**: `wallet_get_info` with target `network` — verify an account exists and is active
2. **If no accounts**: Guide user to create one with `wallet_add_account` (sets nickname)
3. **If needs funding**: Generate ARC-26 QR with `generate_algorand_qrcode` or direct to testnet faucet: https://lora.algokit.io/testnet/fund
4. **If needs USDC funding**: Generate ARC-26 QR with `generate_algorand_qrcode` or direct to testnet faucet: https://faucet.circle.com/
5. **Confirm network**: Always confirm which network (`mainnet`, `testnet`, `localnet`) before transactions

## Network Selection

Every tool that touches the blockchain accepts a `network` parameter:

| Value | Description |
|-------|-------------|
| `testnet` | Algorand testnet — **default if omitted** (algorand-mcp 4.2.5+), safe for development |
| `mainnet` | Algorand mainnet — **real value, exercise caution**. Pass only when the user explicitly names mainnet |
| `localnet` | Local dev network (requires `ALGORAND_LOCALNET_URL` env var) |

Mainnet is never implicit. If the user does not name a network, use testnet. Switch to mainnet only on an explicit user instruction, and confirm the full action (amount, asset, sender, receiver, network) before signing.

## Pre-Transaction Validation

Before ANY transaction:

1. **MBR Check**: Account needs 0.1 ALGO base + 0.1 per asset/app opt-in
2. **Asset Opt-In**: Verify with `api_algod_get_account_asset_info` before ASA transfers
3. **Fees**: Every txn costs 0.001 ALGO (1,000 microAlgos) minimum
4. **Balance Check**: Fetch current balance with `wallet_get_info` or `api_algod_get_account_info`
5. **Order**: Fund account with ALGO first, then asset transactions

## Common Mainnet Assets

| Asset | ASA ID | Decimals |
|-------|--------|----------|
| ALGO | native | 6 |
| USDC | 31566704 | 6 |
| USDT | 312769 | 6 |
| goETH | 386192725 | 8 |
| goBTC | 386195940 | 8 |

> Always verify asset IDs on-chain — scam tokens use similar names.

## Amounts and Decimals

| Asset | Unit | 1 Whole Token = |
|-------|------|-----------------|
| ALGO | microAlgos | 1,000,000 |
| USDC (ASA 31566704) | micro-units | 1,000,000 (6 decimals) |
| Custom ASAs | base units | Depends on `decimals` field |

Always check asset's `decimals` field with `api_algod_get_asset_by_id` before computing amounts.

## Transaction Types

- **pay**: ALGO transfers → `make_payment_txn`
- **axfer**: Asset transfers, opt-in, clawback → `make_asset_transfer_txn`
- **acfg**: Asset create/configure/destroy → `make_asset_create_txn`, `make_asset_config_txn`, `make_asset_destroy_txn`
- **afrz**: Asset freeze/unfreeze → `make_asset_freeze_txn`
- **appl**: Smart contract calls → `make_app_create_txn`, `make_app_call_txn`, `make_app_update_txn`, `make_app_delete_txn`, `make_app_optin_txn`, `make_app_closeout_txn`, `make_app_clear_txn`
- **keyreg**: Consensus key registration → `make_keyreg_txn`

## Wallet Transaction Workflow (Recommended)

| Step | Tool | Purpose |
|------|------|---------|
| 1 | `wallet_get_info` | Verify active account, check balance |
| 2 | Query tools | Get blockchain data (account info, asset info, etc.) |
| 3 | `make_*_txn` | Build the transaction |
| 4 | `wallet_sign_transaction` | Sign with active wallet account |
| 5 | `send_raw_transaction` | Submit signed transaction to network |
| 6 | **Present txID** | Show transaction ID with explorer link (see below) |

### Post-Transaction: Deliver Transaction ID

**ALWAYS** present the transaction ID to the user after any successful transaction submission. Use the correct explorer link based on the network:

| Network | Explorer Link Template |
|---------|----------------------|
| `mainnet` | `https://allo.info/tx/{txId}` |
| `testnet` | `https://lora.algokit.io/testnet/transaction/{txId}` |

Example output after a testnet transaction:
> Transaction confirmed! `TXID123...`
> View on explorer: https://lora.algokit.io/testnet/transaction/TXID123...

Example output after a mainnet transaction:
> Transaction confirmed! `TXID456...`
> View on explorer: https://allo.info/tx/TXID456...

This applies to ALL transaction types: payments, asset transfers, opt-ins, app calls, atomic groups, and any other operation that yields a transaction ID.

### One-Step Asset Opt-In

For asset opt-ins, use the shortcut:
```
wallet_optin_asset { assetId: 31566704, network: "testnet" }
```

## External Key Transaction Workflow

When the user provides their own secret key (not using the wallet):

| Step | Tool | Purpose |
|------|------|---------|
| 1 | `make_*_txn` | Build the transaction |
| 2 | `sign_transaction` | Sign with provided secret key hex |
| 3 | `send_raw_transaction` | Submit signed transaction |
| 4 | **Present txID** | Show transaction ID with explorer link |

## Atomic Group Transaction Workflow

For atomic (all-or-nothing) multi-transaction groups:

| Step | Tool | Purpose |
|------|------|---------|
| 1 | `make_*_txn` (multiple) | Build each transaction |
| 2 | `assign_group_id` | Assign group ID to all transactions |
| 3 | `wallet_sign_transaction_group` | Sign all transactions in group with wallet |
| 4 | `send_raw_transaction` | Submit all signed transactions |
| 5 | **Present txIDs** | Show all transaction IDs with explorer links |

## Tool Categories

**Wallet** (10): `wallet_add_account`, `wallet_remove_account`, `wallet_list_accounts`, `wallet_switch_account`, `wallet_get_info`, `wallet_get_assets`, `wallet_sign_transaction`, `wallet_sign_transaction_group`, `wallet_sign_data`, `wallet_optin_asset`

**Account** (8): `create_account`, `rekey_account`, `mnemonic_to_mdk`, `mdk_to_mnemonic`, `secret_key_to_mnemonic`, `mnemonic_to_secret_key`, `seed_from_mnemonic`, `mnemonic_from_seed`

**Utility** (13): `ping`, `validate_address`, `encode_address`, `decode_address`, `get_application_address`, `bytes_to_bigint`, `bigint_to_bytes`, `encode_uint64`, `decode_uint64`, `verify_bytes`, `sign_bytes`, `encode_obj`, `decode_obj`

**Transaction Building** (18): `make_payment_txn`, `make_keyreg_txn`, `make_asset_create_txn`, `make_asset_config_txn`, `make_asset_destroy_txn`, `make_asset_freeze_txn`, `make_asset_transfer_txn`, `make_app_create_txn`, `make_app_update_txn`, `make_app_delete_txn`, `make_app_optin_txn`, `make_app_closeout_txn`, `make_app_clear_txn`, `make_app_call_txn`, `assign_group_id`, `sign_transaction`, `encode_unsigned_transaction`, `decode_signed_transaction`

**Algod** (5): `compile_teal`, `disassemble_teal`, `send_raw_transaction`, `simulate_raw_transactions`, `simulate_transactions`

**Algod API** (13): `api_algod_get_account_info`, `api_algod_get_account_application_info`, `api_algod_get_account_asset_info`, `api_algod_get_application_by_id`, `api_algod_get_application_box`, `api_algod_get_application_boxes`, `api_algod_get_asset_by_id`, `api_algod_get_pending_transaction`, `api_algod_get_pending_transactions_by_address`, `api_algod_get_pending_transactions`, `api_algod_get_transaction_params`, `api_algod_get_node_status`, `api_algod_get_node_status_after_block`

**Indexer API** (17): `api_indexer_lookup_account_by_id`, `api_indexer_lookup_account_assets`, `api_indexer_lookup_account_app_local_states`, `api_indexer_lookup_account_created_applications`, `api_indexer_lookup_account_transactions`, `api_indexer_search_for_accounts`, `api_indexer_lookup_applications`, `api_indexer_lookup_application_logs`, `api_indexer_lookup_application_box`, `api_indexer_lookup_application_boxes`, `api_indexer_search_for_applications`, `api_indexer_lookup_asset_by_id`, `api_indexer_lookup_asset_balances`, `api_indexer_lookup_asset_transactions`, `api_indexer_search_for_assets`, `api_indexer_lookup_transaction_by_id`, `api_indexer_search_for_transactions`

**NFDomains** (6): `api_nfd_get_nfd`, `api_nfd_get_nfds_for_addresses`, `api_nfd_get_nfd_activity`, `api_nfd_get_nfd_analytics`, `api_nfd_browse_nfds`, `api_nfd_search_nfds`

**Tinyman DEX** (9): `api_tinyman_get_pool`, `api_tinyman_get_pool_analytics`, `api_tinyman_get_pool_creation_quote`, `api_tinyman_get_liquidity_quote`, `api_tinyman_get_remove_liquidity_quote`, `api_tinyman_get_swap_quote`, `api_tinyman_get_asset_optin_quote`, `api_tinyman_get_validator_optin_quote`, `api_tinyman_get_validator_optout_quote`

**Haystack Router** (3): `api_haystack_get_swap_quote`, `api_haystack_execute_swap`, `api_haystack_needs_optin` — DEX-aggregated swaps across Tinyman V2, Pact, Folks with optimal routing. See the **haystack-router-interaction** skill for detailed workflows and reference docs.

**Pera Asset Verification** (3): `api_pera_asset_verification_status`, `api_pera_verified_asset_details`, `api_pera_verified_asset_search` — mainnet asset verification (verified/trusted/suspicious/unverified), detailed asset info with USD value, and search by name/keyword

**ARC-26 URI** (1): `generate_algorand_qrcode`

**Knowledge Base** (1): `get_knowledge_doc`

**x402 Payments** (2): `x402_discover_payment_requirements`, `make_http_request_with_x402` — probe an x402-protected endpoint for payment requirements, then pay-and-fetch in one call. See the **x402 Payment Workflow** section below for the supervised pattern.

**x402 Bazaar Discovery** (3): `bazaar_list`, `bazaar_search`, `bazaar_get_resource_details` — browse and search the Bazaar discovery directory hosted by the configured facilitator (`facilitator.goplausible.xyz` by default) to find paid resources cataloged across the x402 ecosystem before calling `make_http_request_with_x402`. See the **x402 Bazaar Discovery** section below for the recommended pattern.

## Pagination

API responses are paginated. All API tools accept optional `itemsPerPage` (default 10) and `pageToken` parameters. Pass `pageToken` from a previous response to fetch the next page.

## x402 Payment Workflow for OpenClaw agents

Use the two algorand-mcp x402 tools to access x402-protected HTTP resources. The MCP tools handle transaction construction, signing, base64 encoding, and PAYMENT-SIGNATURE assembly internally — you only orchestrate the discovery → selection → paid-request flow.

### Recommended supervised pattern

1. **Probe** the endpoint to read what it costs:
   ```
   x402_discover_payment_requirements {
     baseURL: "https://example.x402.goplausible.xyz",
     path: "/avm/weather",
     method: "GET"
   }
   ```

2. **Inspect** the returned `accepts[]` array. Pick the entry you'll pay with — usually the cheapest Algorand entry on the network you want, within budget. On mainnet, confirm the cost with the user before continuing.

3. **Pay and fetch** in one call, passing the pre-fetched requirements back so the tool doesn't re-probe:
   ```
   make_http_request_with_x402 {
     baseURL: "https://example.x402.goplausible.xyz",
     path: "/avm/weather",
     method: "GET",
     paymentRequirements: <accepts[] from step 1>,
     preferredNetwork: "testnet",
     maxAmountPerRequest: 10000
   }
   ```

### Faster unsupervised pattern (testnet, known endpoints)

Skip step 1. Call `make_http_request_with_x402 { baseURL, path, method }` — it discovers, selects the cheapest affordable Algorand requirement, builds the atomic group, signs the payment leg with the active wallet, retries, and returns the resource. Always pass `maxAmountPerRequest` as a guardrail; pass `preferredNetwork` to pin testnet/mainnet.

### Always

- **Mainnet = real money** — confirm cost with the user before mainnet payments. Use `maxAmountPerRequest` as a budget cap.
- Amounts are in **atomic units**. USDC has 6 decimals: 1,000,000 atomic units = $1.00.
- `preferredNetwork` narrows requirement selection to a specific network (`"mainnet"` / `"testnet"` / `"localnet"`). If omitted, the tool picks the cheapest affordable Algorand requirement across all networks in `accepts[]`.

### Common pitfall

**Do not put `preferredNetwork` or `maxAmountPerRequest` inside the `paymentRequirements` array.** They are top-level sibling arguments. The MCP tool's 4.3.3+ schema validation rejects malformed arrays with `paymentRequirements[N] must be an OBJECT` or `paymentRequirements[N] is missing required string field(s)` — if you see those, your selected `accepts[]` entry got mixed with sibling args. Pass the `accepts[]` entries verbatim; keep the other knobs at the top level.

See [references/examples-algorand-mcp.md](references/examples-algorand-mcp.md) for the full workflow, response shape, and common errors.

## x402 Bazaar Discovery

Bazaar is the discovery directory hosted by the configured x402 facilitator (`facilitator.goplausible.xyz` by default, overridable via the `BAZAAR_BASE_URL` env var on the MCP server). It catalogs paid API resources across the x402 ecosystem. Use these three tools to find resources before calling `make_http_request_with_x402`.

### When to reach for Bazaar

- The user asks for paid data ("get me a weather report", "fetch a market price proof") and you don't know which endpoint serves it.
- You want to compare multiple paid providers by price, network, or asset before committing to one.
- You want to inspect a known resource's metadata (description, payment requirements, popularity) before deciding to call it.

### bazaar_list — browse cataloged resources

Browse all cataloged paid resources, with optional filters. Returns a compact summary per item by default (URL, description, Algorand-payable accepts only, popularity counters); pass `full: true` for the verbatim facilitator response including full `accepts[]` and `discoveryInfo`.

```
bazaar_list {
  network: "algorand-mainnet",    // optional; friendly name OR raw CAIP-2
  method: "GET",                  // optional; filter by HTTP method
  merchantId: "...",              // optional
  limit: 20,                      // optional, default 50, max 100
  offset: 0,                      // optional
  full: false                     // default false (summary); true for verbatim
}
```

**Network values:** accepts friendly names (`"algorand-mainnet"`, `"algorand-testnet"`, `"algorand-localnet"`, or bare `"mainnet"`/`"testnet"`/`"localnet"`) and translates them to CAIP-2 before the request. Raw CAIP-2 strings (`"algorand:wGHE2Pw…"`, `"eip155:84532"`, `"solana:EtWT…"`) pass through unchanged.

### bazaar_search — keyword search

Search resources by keyword in URL and description, with optional client-side filters.

```
bazaar_search {
  query: "weather",               // required; min 1 char
  limit: 10,                      // 1..20, default 10
  network: "algorand-mainnet",    // optional; friendly or CAIP-2
  includeTestnets: false,         // default false (mainnet-only)
  scheme: "exact",                // optional; "exact" or "upto"
  maxUsdPrice: 0.10,              // optional; USD cap (computed from amount + decimals)
  asset: "31566704",              // optional; ASA id or token contract
  payTo: "ALGO_ADDRESS_OR_0x…",   // optional; recipient filter
  extensions: "bazaar"            // optional; require discoveryInfo / bazaar metadata
}
```

The server only supports `query` + `network` natively; the other filters are applied client-side after the response. `maxUsdPrice` is computed from `amount` and `extra.decimals` (assumes USDC-like pricing).

### bazaar_get_resource_details — fetch one by URL

```
bazaar_get_resource_details {
  resource: "https://api.iomarkets.ai/v1/proof/price"
}
```

Returns the verbatim resource record (full `accepts[]`, `discoveryInfo`, popularity counters). Throws a clear `-32600` if no exact match is found, with the number of partial matches for context.

### Recommended discover → pay flow

1. `bazaar_search { query: "<what user asked for>", maxUsdPrice: <budget>, network: "algorand-mainnet" }` — get a shortlist.
2. Show the user the top result(s): URL, description, cost in USD, payTo.
3. On user confirmation: call `make_http_request_with_x402` against the chosen resource's URL. You can pass the `accepts[]` from the Bazaar response directly as `paymentRequirements` to skip the per-endpoint discovery probe.

### Always

- `bazaar_*` tools never sign or pay — they're pure discovery. The user is in no risk from these calls alone.
- Default mode is mainnet-only. Pass `includeTestnets: true` to see testnet/devnet entries.
- Items with `algorandPayable: false` (in the summary view) cannot be paid via this MCP — they only accept non-Algorand networks. Skip them or tell the user the endpoint isn't reachable from the Algorand wallet.

## Alpha Arcade Prediction Markets

Trade on-chain prediction markets (YES/NO outcomes) denominated in USDC via the Alpha Arcade integration (14 tools).

| Step | Tool | Purpose |
|------|------|---------|
| 1 | `wallet_get_info` | Verify active account, check ALGO + USDC balance |
| 2 | `alpha_get_live_markets` | Browse available markets |
| 3 | `alpha_get_orderbook` | Check liquidity and prices for a market |
| 4 | `alpha_create_market_order` or `alpha_create_limit_order` | Place an order |
| 5 | `alpha_get_positions` / `alpha_get_open_orders` | Check portfolio |

All prices and quantities use **microunits** (1,000,000 = $1.00 or 1 share). Orders require both ALGO (~0.957 per escrow) and USDC collateral.

> For detailed Alpha Arcade workflows (orderbook mechanics, multi-choice markets, split/merge shares, claiming, collateral model), load the `alpha-arcade-interaction` skill.

## QR Code Display (ARC-26 URI)

`generate_algorand_qrcode` generates an Algorand payment URI and QR code per ARC-26 specification via QRClaw service.

**Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `address` | Yes | Receiver Algorand address |
| `label` | No | Payment label |
| `amount` | No | Amount in microunits (e.g. 1000000 = 1 ALGO or 1 USDC) |
| `asset` | No | ASA ID for asset transfers; omit or 0 for ALGO |
| `note` | No | Payment note |
| `xnote` | No | Exclusive immutable note |

**Returns:**
- `qr` — UTF-8 text QR code (terminal-friendly)
- `uri` — the `algorand://` URI string
- `link` — shareable hosted QR URL (via QRClaw service)
- `expires_in` — link validity period

**Channel-Aware Output:**

After calling `generate_algorand_qrcode`, tailor output to the channel:

**TUI / Web channels** (terminal, web UI, canvas):
1. **UTF-8 QR block** — paste the Unicode block characters from `qr` inside a code fence
2. **URI string** — the `algorand://` URI for wallet deep links
3. **Shareable link** — the hosted QR URL from `link`

Example:
```
[paste UTF-8 QR here]
```
URI: `algorand://...`
Shareable QR: [link URL]

**Social channels** (Telegram, Discord, WhatsApp, Signal, Slack, IRC, etc.):
- **Skip** the UTF-8 QR block — too bulky for chat
- Show only:
  - **URI string** — for wallet deep links
  - **Shareable link** — renders nicely in-app as a clickable QR image

## References

For detailed tool documentation:
- **Tool Reference**: See [references/algorand-mcp.md](references/algorand-mcp.md)

For workflow examples (including x402 payment):
- **Examples**: See [references/examples-algorand-mcp.md](references/examples-algorand-mcp.md)

## NFD Important Note

When using NFD (`.algo` names), always use the `depositAccount` field from the NFD response for transactions, NOT other address fields.

## Security

- **Mainnet = real value** — always confirm with user before mainnet transactions
- Never log, display, or store mnemonics or secret keys — use `wallet_*` tools for signing
- Verify recipient addresses with `validate_address` — transactions are irreversible
- Verify asset IDs on-chain and check verification tier with `api_pera_asset_verification_status` — scam tokens use similar names

## Links

- GoPlausible: https://goplausible.com
- Algorand: https://algorand.co
- Algorand x402: https://x402.goplausible.xyz
- Algorand x402 test endpoints: https://example.x402.goplausible.xyz/
- Algorand x402 Facilitator: https://facilitator.goplausible.xyz
- Testnet Faucet: https://lora.algokit.io/testnet/fund
- Testnet USDC Faucet: https://faucet.circle.com/
- Algorand Developer Docs: https://dev.algorand.co/
- Algorand Developer Docs Github : https://github.com/algorandfoundation/devportal
- Algorand Developer Examples Github : https://github.com/algorandfoundation/devportal-code-examples
- [GoPlausible x402-avm Documentation and Example code](https://github.com/GoPlausible/.github/blob/main/profile/algorand-x402-documentation/README.md)
- [GoPlausible x402-avm Examples template Projects](https://github.com/GoPlausible/x402-avm/tree/branch-v2-algorand-publish/examples/)
- [CAIP-2 Specification](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md)
- [Coinbase x402 Protocol](https://github.com/coinbase/x402)
