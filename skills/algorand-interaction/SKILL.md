---
name: algorand-interaction
description: Interact with Algorand blockchain via the Algorand MCP server — wallet operations, ALGO/ASA transactions, smart contracts, account info, NFD lookups, atomic groups, Tinyman swaps, Haystack Router DEX-aggregated swaps, TEAL compilation, knowledge base. Use when user asks about Algorand wallet, balances, sending ALGO or tokens, asset opt-in, transactions, NFD names, DEX swaps, smart contracts, or account details.
---

# Algorand MCP Interaction

Interact with Algorand blockchain through the Algorand MCP server (104+ tools across 13 categories).

## Key Characteristics

- **Secure signing** — use `wallet_*` tools to sign; private keys are never available to you
- **Multi-network** — supports `mainnet`, `testnet`, and `localnet`
- **Spending limits** — per-transaction (`allowance`) and daily (`dailyAllowance`) limits enforced by wallet

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
2. **If no accounts**: Guide user to create one with `wallet_add_account` (sets nickname and spending limits)
3. **If needs funding**: Generate ARC-26 QR with `generate_algorand_qrcode` or direct to testnet faucet: https://lora.algokit.io/testnet/fund
4. **If needs USDC funding**: Generate ARC-26 QR with `generate_algorand_qrcode` or direct to testnet faucet: https://faucet.circle.com/
5. **Confirm network**: Always confirm which network (`mainnet`, `testnet`, `localnet`) before transactions

## Network Selection

Every tool that touches the blockchain accepts a `network` parameter:

| Value | Description |
|-------|-------------|
| `mainnet` | Algorand mainnet (default) — **real value, exercise caution** |
| `testnet` | Algorand testnet — safe for development |
| `localnet` | Local dev network (requires `ALGORAND_LOCALNET_URL` env var) |

Default to `testnet` during development.

## Pre-Transaction Validation

Before ANY transaction:

1. **MBR Check**: Account needs 0.1 ALGO base + 0.1 per asset/app opt-in
2. **Asset Opt-In**: Verify with `api_algod_get_account_asset_info` before ASA transfers
3. **Fees**: Every txn costs 0.001 ALGO (1,000 microAlgos) minimum
4. **Balance Check**: Fetch current balance with `wallet_get_info` or `api_algod_get_account_info`
5. **Spending Limits**: Wallet enforces per-transaction (`allowance`) and daily (`dailyAllowance`) limits. Setting either to `0` means **unlimited**
6. **Order**: Fund account with ALGO first, then asset transactions

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
| 4 | `wallet_sign_transaction` | Sign with active wallet account (enforces limits) |
| 5 | `send_raw_transaction` | Submit signed transaction to network |
| 6 | Query tools | Verify result on-chain |

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

## Atomic Group Transaction Workflow

For atomic (all-or-nothing) multi-transaction groups:

| Step | Tool | Purpose |
|------|------|---------|
| 1 | `make_*_txn` (multiple) | Build each transaction |
| 2 | `assign_group_id` | Assign group ID to all transactions |
| 3 | `wallet_sign_transaction_group` | Sign all transactions in group with wallet |
| 4 | `send_raw_transaction` | Submit all signed transactions |

## Tool Categories

**Wallet** (10): `wallet_add_account`, `wallet_remove_account`, `wallet_list_accounts`, `wallet_switch_account`, `wallet_get_info`, `wallet_get_assets`, `wallet_sign_transaction`, `wallet_sign_transaction_group`, `wallet_sign_data`, `wallet_optin_asset`

**Account** (8): `create_account`, `rekey_account`, `mnemonic_to_mdk`, `mdk_to_mnemonic`, `secret_key_to_mnemonic`, `mnemonic_to_secret_key`, `seed_from_mnemonic`, `mnemonic_from_seed`

**Utility** (13): `ping`, `validate_address`, `encode_address`, `decode_address`, `get_application_address`, `bytes_to_bigint`, `bigint_to_bytes`, `encode_uint64`, `decode_uint64`, `verify_bytes`, `sign_bytes`, `encode_obj`, `decode_obj`

**Transaction Building** (16): `make_payment_txn`, `make_keyreg_txn`, `make_asset_create_txn`, `make_asset_config_txn`, `make_asset_destroy_txn`, `make_asset_freeze_txn`, `make_asset_transfer_txn`, `make_app_create_txn`, `make_app_update_txn`, `make_app_delete_txn`, `make_app_optin_txn`, `make_app_closeout_txn`, `make_app_clear_txn`, `make_app_call_txn`, `assign_group_id`, `sign_transaction`

**Algod** (5): `compile_teal`, `disassemble_teal`, `send_raw_transaction`, `simulate_raw_transactions`, `simulate_transactions`

**Algod API** (13): `api_algod_get_account_info`, `api_algod_get_account_application_info`, `api_algod_get_account_asset_info`, `api_algod_get_application_by_id`, `api_algod_get_application_box`, `api_algod_get_application_boxes`, `api_algod_get_asset_by_id`, `api_algod_get_pending_transaction`, `api_algod_get_pending_transactions_by_address`, `api_algod_get_pending_transactions`, `api_algod_get_transaction_params`, `api_algod_get_node_status`, `api_algod_get_node_status_after_block`

**Indexer API** (17): `api_indexer_lookup_account_by_id`, `api_indexer_lookup_account_assets`, `api_indexer_lookup_account_app_local_states`, `api_indexer_lookup_account_created_applications`, `api_indexer_search_for_accounts`, `api_indexer_lookup_applications`, `api_indexer_lookup_application_logs`, `api_indexer_search_for_applications`, `api_indexer_lookup_application_box`, `api_indexer_lookup_application_boxes`, `api_indexer_lookup_asset_by_id`, `api_indexer_lookup_asset_balances`, `api_indexer_lookup_asset_transactions`, `api_indexer_search_for_assets`, `api_indexer_lookup_transaction_by_id`, `api_indexer_lookup_account_transactions`, `api_indexer_search_for_transactions`

**NFDomains** (6): `api_nfd_get_nfd`, `api_nfd_get_nfds_for_addresses`, `api_nfd_get_nfd_activity`, `api_nfd_get_nfd_analytics`, `api_nfd_browse_nfds`, `api_nfd_search_nfds`

**Tinyman DEX** (9): `api_tinyman_get_pool`, `api_tinyman_get_pool_analytics`, `api_tinyman_get_pool_creation_quote`, `api_tinyman_get_liquidity_quote`, `api_tinyman_get_remove_liquidity_quote`, `api_tinyman_get_swap_quote`, `api_tinyman_get_asset_optin_quote`, `api_tinyman_get_validator_optin_quote`, `api_tinyman_get_validator_optout_quote`

**Haystack Router** (3): `api_haystack_get_swap_quote`, `api_haystack_execute_swap`, `api_haystack_needs_optin` — DEX-aggregated swaps across Tinyman V2, Pact, Folks with optimal routing. See the **haystack-router-interaction** skill for detailed workflows and reference docs.

**Pera Asset Verification** (3): `api_pera_asset_verification_status`, `api_pera_verified_asset_details`, `api_pera_verified_asset_search` — mainnet asset verification (verified/trusted/suspicious/unverified), detailed asset info with USD value, and search by name/keyword

**ARC-26 URI** (1): `generate_algorand_qrcode`

**Knowledge Base** (1): `get_knowledge_doc`

## Pagination

API responses are paginated. All API tools accept optional `itemsPerPage` (default 10) and `pageToken` parameters. Pass `pageToken` from a previous response to fetch the next page.

## x402 Payment Workflow for OpenClaw agents

When `x402_fetch` returns HTTP 402 with `PaymentRequirements`, use the atomic group transaction pattern to build the payment:

1. Build fee payer transaction: `make_payment_txn` with from=feePayer, to=feePayer, amount=0, **fee=N×1000** (N=group size, e.g. 2000 for 2 txns), **flatFee=true**
2. Build payment transaction: `make_payment_txn` or `make_asset_transfer_txn` to `payTo`, **fee=0**, **flatFee=true**
3. Group both transactions with `assign_group_id`
4. Sign only the payment transaction (index 1) with `wallet_sign_transaction` — leave fee payer unsigned
5. Encode the unsigned fee payer transaction (index 0) with `encode_unsigned_transaction`
6. Construct PAYMENT-SIGNATURE JSON payload — **must include `accepted` field** (the exact `accepts[]` entry chosen) — and retry with `x402_fetch`

> **IMPORTANT: Fee Abstraction** — Pass `fee` and `flatFee` directly as input parameters to `make_*_txn` tools. Fee payer: `fee=N×1000`, `flatFee=true`. Payment: `fee=0`, `flatFee=true`. NEVER set fee=0 on the fee payer — this causes "txgroup had 0 in fees" errors.

**Critical**: The `accepted` field is REQUIRED. It must be an exact copy of the `accepts[]` entry you chose to pay with (including all fields: scheme, network, price, payTo, asset, maxAmountRequired, extra, etc.). Without it, the server cannot match your payment and will reject with 402.

**Critical — Base64 blob handling**: When constructing the `paymentHeader` JSON string for `x402_fetch`, NEVER manually re-type or partially copy base64 blob strings. Use the EXACT `bytes` value from `encode_unsigned_transaction` and the EXACT `blob` value from `wallet_sign_transaction` — copy each complete value verbatim into the `paymentGroup` array. Even a single character corruption (e.g., `5` → `4`) causes "signature does not match sender" errors and the payment will be rejected.

Map CAIP-2 network identifiers from `accepts[].network` to `testnet` or `mainnet`.

See [references/examples-algorand-mcp.md](references/examples-algorand-mcp.md) for the full step-by-step workflow.

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

After calling the tool, **extract and paste the QR code directly in your response**.
**Always include all of these in your reply:**

1. **UTF-8 QR block** — Unicode block characters from `qr`. Paste inside a code block.
2. **URI string** — always show this, users need it for wallet deep links.
3. **Shareable link** — the hosted QR URL from `link`, so users can share or open it in a browser.

### Steps to include QR code in reply:
1. Call the tool and capture output
2. Extract `qr`, `uri`, and `link` from the response
3. Include in your reply:

```
[paste UTF-8 QR here]
```

URI: `algorand://...`

Shareable QR: [link URL]

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
- Respect wallet spending limits — if rejected, inform user rather than bypassing

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
