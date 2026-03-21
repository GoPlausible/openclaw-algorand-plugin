# Algorand Plugin Guide

This plugin enables four core capabilities:

1. **Algorand Development** — Smart contracts, typed clients, React frontends via AlgoKit CLI and skills
2. **Blockchain Interaction** — Algorand MCP server (107 tools) via mcporter (includes Pera asset verification)
3. **x402 Payment Protocol** — HTTP-native payments with Algorand as first-class chain
4. **Haystack Router** — DEX aggregator/smart order routing on Algorand (Tinyman V2, Pact, Folks)
5. **Alpha Arcade** — On-chain prediction markets on Algorand (USDC-denominated, binary/multi-choice)

## Skill Routing

| Capability | Task | Skill |
|------------|------|-------|
| Development | CLI, examples, general workflows | `algorand-development` |
| Development | TypeScript contracts & tools | `algorand-typescript` |
| Development | Python contracts & tools | `algorand-python` |
| Interaction | Blockchain interaction via MCP | `algorand-interaction` |
| x402 | TypeScript x402 development | `algorand-x402-typescript` |
| x402 | Python x402 development | `algorand-x402-python` |
| x402 | Runtime x402 payment (Claude as client) | `algorand-x402-payment` |
| Haystack | Build swap apps with SDK | `haystack-router-development` |
| Haystack | Execute swaps via MCP tools | `haystack-router-interaction` |
| Alpha Arcade | Prediction markets via MCP tools | `alpha-arcade-interaction` |

## Using Algorand MCP Tools

The Algorand MCP server is configured in **mcporter** as `algorand-mcp`. Call tools like this:

```bash
# List all tools
mcporter list algorand-mcp

# Call a tool
mcporter call algorand-mcp.wallet_get_info
mcporter call algorand-mcp.generate_algorand_qrcode address=XXXXX network=testnet asset=0 amount=1000000
mcporter call algorand-mcp.search_assets name=USDC network=mainnet
```

## MCP Tool Categories (107 tools)

- **Wallet** (10) — `wallet_add_account`, `wallet_remove_account`, `wallet_list_accounts`, `wallet_switch_account`, `wallet_get_info`, `wallet_get_assets`, `wallet_sign_transaction`, `wallet_sign_transaction_group`, `wallet_sign_data`, `wallet_optin_asset`
- **Account Management** (8) — `create_account`, `rekey_account`, `mnemonic_to_mdk`, `mdk_to_mnemonic`, `secret_key_to_mnemonic`, `mnemonic_to_secret_key`, `seed_from_mnemonic`, `mnemonic_from_seed`
- **Utility** (13) — `ping`, `validate_address`, `encode_address`, `decode_address`, `get_application_address`, `bytes_to_bigint`, `bigint_to_bytes`, `encode_uint64`, `decode_uint64`, `verify_bytes`, `sign_bytes`, `encode_obj`, `decode_obj`
- **Transaction** (18) — `make_payment_txn`, `make_keyreg_txn`, `make_asset_create_txn`, `make_asset_config_txn`, `make_asset_destroy_txn`, `make_asset_freeze_txn`, `make_asset_transfer_txn`, `make_app_create_txn`, `make_app_update_txn`, `make_app_delete_txn`, `make_app_optin_txn`, `make_app_closeout_txn`, `make_app_clear_txn`, `make_app_call_txn`, `assign_group_id`, `sign_transaction`, `encode_unsigned_transaction`, `decode_signed_transaction`
- **Algod** (5) — `compile_teal`, `disassemble_teal`, `send_raw_transaction`, `simulate_raw_transactions`, `simulate_transactions`
- **Algod API** (13) — `api_algod_get_account_info`, `api_algod_get_account_application_info`, `api_algod_get_account_asset_info`, `api_algod_get_application_by_id`, `api_algod_get_application_box`, `api_algod_get_application_boxes`, `api_algod_get_asset_by_id`, `api_algod_get_pending_transaction`, `api_algod_get_pending_transactions_by_address`, `api_algod_get_pending_transactions`, `api_algod_get_transaction_params`, `api_algod_get_node_status`, `api_algod_get_node_status_after_block`
- **Indexer API** (17) — `api_indexer_lookup_account_by_id`, `api_indexer_lookup_account_assets`, `api_indexer_lookup_account_app_local_states`, `api_indexer_lookup_account_created_applications`, `api_indexer_search_for_accounts`, `api_indexer_lookup_applications`, `api_indexer_lookup_application_logs`, `api_indexer_search_for_applications`, `api_indexer_lookup_application_box`, `api_indexer_lookup_application_boxes`, `api_indexer_lookup_asset_by_id`, `api_indexer_lookup_asset_balances`, `api_indexer_lookup_asset_transactions`, `api_indexer_search_for_assets`, `api_indexer_lookup_transaction_by_id`, `api_indexer_lookup_account_transactions`, `api_indexer_search_for_transactions`
- **NFDomains** (6) — `api_nfd_get_nfd`, `api_nfd_get_nfds_for_addresses`, `api_nfd_get_nfd_activity`, `api_nfd_get_nfd_analytics`, `api_nfd_browse_nfds`, `api_nfd_search_nfds`
- **Tinyman AMM** (9) — `api_tinyman_get_pool`, `api_tinyman_get_pool_analytics`, `api_tinyman_get_pool_creation_quote`, `api_tinyman_get_liquidity_quote`, `api_tinyman_get_remove_liquidity_quote`, `api_tinyman_get_swap_quote`, `api_tinyman_get_asset_optin_quote`, `api_tinyman_get_validator_optin_quote`, `api_tinyman_get_validator_optout_quote`
- **Haystack Router** (3) — `api_haystack_get_swap_quote`, `api_haystack_execute_swap`, `api_haystack_needs_optin`
- **Pera Asset Verification** (3) — `api_pera_asset_verification_status`, `api_pera_verified_asset_details`, `api_pera_verified_asset_search`
- **Alpha Arcade** (15) — Read: `alpha_get_live_markets`, `alpha_get_reward_markets`, `alpha_get_market`, `alpha_get_orderbook`, `alpha_get_open_orders`, `alpha_get_positions`. Trade: `alpha_create_limit_order`, `alpha_create_market_order`, `alpha_cancel_order`, `alpha_amend_order`, `alpha_propose_match`, `alpha_split_shares`, `alpha_merge_shares`, `alpha_claim`
- **ARC-26 URI** (1) — `generate_algorand_qrcode`
- **Knowledge** (1) — `get_knowledge_doc` (categories: `arcs`, `sdks`, `algokit`, `algokit-utils`, `tealscript`, `puya`, `liquid-auth`, `python`, `developers`, `clis`, `nodes`, `details`)

## QR Code Display (ARC-26 URI)

When generating QR codes with `generate_algorand_qrcode`, the tool returns:
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

## Key things to remember

- Always check wallet with `wallet_get_info` before blockchain operations
- Use `get_knowledge_doc` for Algorand developer documentation
- Mainnet = real value — always confirm with user before mainnet transactions
- Default to testnet during development
- Every transaction costs 0.001 ALGO minimum
- Account needs 0.1 ALGO base + 0.1 per asset/app opt-in (MBR)
- **CRITICAL — x402 Base64 blob handling**: When constructing the `paymentHeader` JSON for `x402_fetch`, NEVER manually re-type or partially copy base64 blob strings. Use the EXACT `bytes` value from `encode_unsigned_transaction` and the EXACT `blob` value from `wallet_sign_transaction` — copy each value in full. Even a single character corruption (e.g., `5` → `4`) causes "signature does not match sender" errors and the payment will be rejected.

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
- **Alpha Arcade prices are microunits**: `yesProb`/`noProb` range 0–1,000,000 (NOT percentages). $0.50 = 500,000. Orders require both ALGO (MBR) and USDC (collateral).

## External resources

- GoPlausible: https://goplausible.com
- Algorand: https://algorand.co
- Algorand x402: https://x402.goplausible.xyz
- Algorand x402 test endpoints: https://example.x402.goplausible.xyz/
- Algorand x402 Facilitator: https://facilitator.goplausible.xyz
- Testnet Faucet: https://lora.algokit.io/testnet/fund
- Testnet USDC Faucet: https://faucet.circle.com/
- Algorand Developer Docs: https://dev.algorand.co/
- Algorand Developer Docs Github: https://github.com/algorandfoundation/devportal
- Algorand Developer Examples Github: https://github.com/algorandfoundation/devportal-code-examples
- GoPlausible x402-avm Documentation and Example code: https://github.com/GoPlausible/.github/blob/main/profile/algorand-x402-documentation/README.md
- GoPlausible x402-avm Examples template Projects: https://github.com/GoPlausible/x402-avm/tree/branch-v2-algorand-publish/examples/
- CAIP-2 Specification: https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md
- Coinbase x402 Protocol: https://github.com/coinbase/x402
- Haystack Router: https://github.com/TxnLab/haystack-router
- Alpha Arcade: https://alphaarcade.com
- Alpha Arcade API: https://platform.alphaarcade.com
