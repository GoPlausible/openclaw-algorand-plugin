# AGENTS.md

## Overview

This is an Algorand plugin that enables three core capabilities equally:

1. **Blockchain Interaction** — Interact with Algorand directly via the Algorand MCP server (99 tools): wallet management, ALGO/ASA transactions, smart contracts, NFD lookups, Tinyman swaps, TEAL compilation, and developer knowledge base
2. **Algorand Development** — Build smart contracts, typed clients, React frontends, and deploy applications using AlgoKit CLI and skills (TypeScript via PuyaTs, Python via PuyaPy)
3. **x402 Payment Protocol** — Build HTTP-native payment applications using the x402 protocol with Algorand as a first-class chain (clients, servers, facilitators, paywalls)

Always leverage skills and MCP tools before writing code — they provide canonical syntax, examples, and documentation that prevent errors and save time.

## Available Skills

Six skills cover all three capabilities. Each skill has a `SKILL.md` router plus a `references/` folder with implementation guides and API references.

| Capability | Task | Skill |
|------------|------|-------|
| **Interaction** | Blockchain interaction via MCP | `algorand-interaction` |
| **Development** | CLI, examples, general workflows | `algorand-development` |
| **Development** | TypeScript contracts & tools | `algorand-typescript` |
| **Development** | Python contracts & tools | `algorand-python` |
| **x402** | TypeScript x402 development | `algorand-x402-typescript` |
| **x402** | Python x402 development | `algorand-x402-python` |

## Knowledge & Examples

Before writing code, search for documentation and examples:

1. **Algorand MCP knowledge base**: Use `get_knowledge_doc` for Algorand developer docs (ARCs, SDKs, AlgoKit, Puya, etc.)
2. **GitHub examples**: Use WebFetch with raw GitHub URLs from priority repos:
   - `https://raw.githubusercontent.com/algorandfoundation/devportal-code-examples/main/`
   - `https://raw.githubusercontent.com/algorandfoundation/puya-ts/main/examples/` (TypeScript)
   - `https://raw.githubusercontent.com/algorandfoundation/puya/main/examples/` (Python)
3. **x402 resources**: Use WebFetch with x402-avm GitHub repos and documentation
4. **Load the relevant skill** for step-by-step guidance

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.

---

## Algorand Development

Smart contracts, typed clients, frontends, and deployment using AlgoKit CLI and language-specific skills.

### Creating Projects

1. **Load the skill**: Use `algorand-development` skill (create-project topic)
2. **TypeScript**: `algokit init -n <name> -t typescript --answer preset_name production --defaults`
3. **Python**: `algokit init -n <name> -t python --answer preset_name production --defaults`

### Writing Smart Contracts

1. **Load the skill**: Use `algorand-typescript` or `algorand-python` skill (build-smart-contracts topic)
2. **Search docs**: Use `get_knowledge_doc` from the Algorand MCP for conceptual guidance
3. **Get examples**: Use WebFetch with raw GitHub URLs (see Knowledge & Examples above)
4. **Write code** following skill guidance
5. **Build/test**: `algokit project run build && algokit project run test`

### Deploying & Calling Contracts

1. **Load the skill**: Use `algorand-typescript` skill (call-smart-contracts topic) or `algorand-python` skill
2. **Start localnet**: `algokit localnet start`
3. **Build**: `algokit project run build`
4. **Deploy**: `algokit project deploy localnet` — uses generated typed client, idempotent
5. **Interact**: Write scripts using the typed client generated from the ARC-56 app spec

### Building React Frontends

1. **Load the skill**: Use `algorand-typescript` skill (deploy-react-frontend topic)
2. **Prerequisites**: Deployed contract with known App ID, ARC-56 app spec
3. **Generate typed client**: `algokit generate client MyContract.arc56.json --output src/contracts/MyContractClient.ts`
4. **Install deps**: `npm install @algorandfoundation/algokit-utils @txnlab/use-wallet-react algosdk`
5. **Follow the "signer handoff" pattern** with `WalletProvider` + `useWallet()` hook

### Development Skill Topics

**algorand-development:** `use-algokit-cli`, `search-algorand-examples`, `create-project`, `build-smart-contracts`, `implement-arc-standards`, `troubleshoot-errors`

**algorand-typescript:** `algorand-typescript-syntax`, `algorand-ts-migration`, `test-smart-contracts`, `call-smart-contracts`, `deploy-react-frontend`, `create-project`, `build-smart-contracts`, `use-algokit-utils`, `implement-arc-standards`, `troubleshoot-errors`

**algorand-python:** `create-project`, `build-smart-contracts`, `use-algokit-utils`, `implement-arc-standards`, `troubleshoot-errors`

---

## Algorand MCP Interaction

The `algorand-interaction` skill provides direct blockchain interaction via the Algorand MCP server — wallet management, transactions, asset transfers, DEX swaps, NFD lookups, smart contract deployment, TEAL compilation, and developer knowledge base.

The Algorand MCP server provides **99 tools** across 11 categories. Use `wallet_*` tools for signing — private keys are never available to you. Per-transaction and daily spending limits are enforced by the wallet.

### Network Selection

Every tool that interacts with the blockchain accepts a `network` parameter:

| Value | Description |
|-------|-------------|
| `mainnet` | Algorand mainnet (default if omitted) — **real value, exercise caution** |
| `testnet` | Algorand testnet — safe for development and testing |
| `localnet` | Local development network (requires `ALGORAND_LOCALNET_URL` env var) |

Always confirm with the user which network to use before transactions. Default to `testnet` during development.

### Session Start Checklist

**At EVERY session start:**

1. **Check wallet**: Call `wallet_get_info` with target network to verify a wallet account exists and is active
2. **If no accounts**: Guide user to create one with `wallet_add_account` (sets nickname and spending limits)
3. **If needs funding**: Generate ARC-26 QR with `generate_algorand_uri` or direct to testnet faucet: https://lora.algokit.io/testnet/fund
4. **If needs USDC funding**: Generate ARC-26 QR with `generate_algorand_uri` or direct to testnet faucet: https://faucet.circle.com/
5. **Confirm network**: Always confirm which network before transactions

### Pre-Transaction Validation

Before ANY transaction:

1. **MBR**: Account needs 0.1 ALGO base + 0.1 per asset/app opt-in
2. **Asset Opt-In**: Verify with `api_algod_get_account_asset_info` before ASA transfers
3. **Fees**: Every txn costs 0.001 ALGO (1,000 microAlgos) minimum
4. **Balance Check**: Fetch current balance with `wallet_get_info` or `api_algod_get_account_info`
5. **Spending Limits**: Wallet enforces per-transaction and daily limits
6. **Order**: Fund account with ALGO first, then asset transactions

### Common Mainnet Assets

| Asset | ASA ID | Decimals |
|-------|--------|----------|
| ALGO | native | 6 |
| USDC | 31566704 | 6 |
| USDT | 312769 | 6 |
| goETH | 386192725 | 8 |
| goBTC | 386195940 | 8 |

> Always verify asset IDs on-chain — scam tokens use similar names.

### Amounts and Decimals

| Asset | Unit | 1 Whole Token = |
|-------|------|-----------------|
| ALGO | microAlgos | 1,000,000 |
| USDC (ASA 31566704) | micro-units | 1,000,000 (6 decimals) |
| Custom ASAs | base units | Depends on `decimals` field |

Always check the asset's `decimals` field with `api_algod_get_asset_by_id` before computing amounts.

### Wallet Transaction Workflow (Recommended)

| Step | Tool | Purpose |
|------|------|---------|
| 1 | `wallet_get_info` | Verify active account, check balance |
| 2 | Query tools | Get blockchain data (account info, asset info, etc.) |
| 3 | `make_*_txn` | Build the transaction |
| 4 | `wallet_sign_transaction` | Sign with active wallet account (enforces limits) |
| 5 | `send_raw_transaction` | Submit signed transaction to network |
| 6 | Query tools | Verify result on-chain |

#### One-Step Asset Opt-In

For asset opt-ins, use the shortcut:
```
wallet_optin_asset { assetId: 31566704, network: "testnet" }
```

### External Key Transaction Workflow

When the user provides their own secret key (not using the wallet):

| Step | Tool | Purpose |
|------|------|---------|
| 1 | `make_*_txn` | Build the transaction |
| 2 | `sign_transaction` | Sign with provided secret key hex |
| 3 | `send_raw_transaction` | Submit signed transaction |

### Atomic Group Transaction Workflow

For atomic (all-or-nothing) multi-transaction groups:

| Step | Tool | Purpose |
|------|------|---------|
| 1 | `make_*_txn` (multiple) | Build each transaction |
| 2 | `assign_group_id` | Assign group ID to all transactions |
| 3 | `wallet_sign_transaction_group` | Sign all transactions in group with wallet |
| 4 | `send_raw_transaction` | Submit all signed transactions |

### Tool Categories

**Wallet** (10 tools): `wallet_add_account`, `wallet_remove_account`, `wallet_list_accounts`, `wallet_switch_account`, `wallet_get_info`, `wallet_get_assets`, `wallet_sign_transaction`, `wallet_sign_transaction_group`, `wallet_sign_data`, `wallet_optin_asset`

**Account** (8 tools): `create_account`, `rekey_account`, `mnemonic_to_mdk`, `mdk_to_mnemonic`, `secret_key_to_mnemonic`, `mnemonic_to_secret_key`, `seed_from_mnemonic`, `mnemonic_from_seed`

**Utility** (13 tools): `ping`, `validate_address`, `encode_address`, `decode_address`, `get_application_address`, `bytes_to_bigint`, `bigint_to_bytes`, `encode_uint64`, `decode_uint64`, `verify_bytes`, `sign_bytes`, `encode_obj`, `decode_obj`

**Transaction Building** (16 tools): `make_payment_txn`, `make_keyreg_txn`, `make_asset_create_txn`, `make_asset_config_txn`, `make_asset_destroy_txn`, `make_asset_freeze_txn`, `make_asset_transfer_txn`, `make_app_create_txn`, `make_app_update_txn`, `make_app_delete_txn`, `make_app_optin_txn`, `make_app_closeout_txn`, `make_app_clear_txn`, `make_app_call_txn`, `assign_group_id`, `sign_transaction`

**Algod** (5 tools): `compile_teal`, `disassemble_teal`, `send_raw_transaction`, `simulate_raw_transactions`, `simulate_transactions`

**Algod API** (13 tools): `api_algod_get_account_info`, `api_algod_get_account_application_info`, `api_algod_get_account_asset_info`, `api_algod_get_application_by_id`, `api_algod_get_application_box`, `api_algod_get_application_boxes`, `api_algod_get_asset_by_id`, `api_algod_get_pending_transaction`, `api_algod_get_pending_transactions_by_address`, `api_algod_get_pending_transactions`, `api_algod_get_transaction_params`, `api_algod_get_node_status`, `api_algod_get_node_status_after_block`

**Indexer API** (17 tools): `api_indexer_lookup_account_by_id`, `api_indexer_lookup_account_assets`, `api_indexer_lookup_account_app_local_states`, `api_indexer_lookup_account_created_applications`, `api_indexer_search_for_accounts`, `api_indexer_lookup_applications`, `api_indexer_lookup_application_logs`, `api_indexer_search_for_applications`, `api_indexer_lookup_application_box`, `api_indexer_lookup_application_boxes`, `api_indexer_lookup_asset_by_id`, `api_indexer_lookup_asset_balances`, `api_indexer_lookup_asset_transactions`, `api_indexer_search_for_assets`, `api_indexer_lookup_transaction_by_id`, `api_indexer_lookup_account_transactions`, `api_indexer_search_for_transactions`

**NFDomains** (6 tools): `api_nfd_get_nfd`, `api_nfd_get_nfds_for_addresses`, `api_nfd_get_nfd_activity`, `api_nfd_get_nfd_analytics`, `api_nfd_browse_nfds`, `api_nfd_search_nfds`

**Tinyman AMM** (9 tools): `api_tinyman_get_pool`, `api_tinyman_get_pool_analytics`, `api_tinyman_get_pool_creation_quote`, `api_tinyman_get_liquidity_quote`, `api_tinyman_get_remove_liquidity_quote`, `api_tinyman_get_swap_quote`, `api_tinyman_get_asset_optin_quote`, `api_tinyman_get_validator_optin_quote`, `api_tinyman_get_validator_optout_quote`

**ARC-26 URI** (1 tool): `generate_algorand_uri`

**Knowledge Base** (1 tool): `get_knowledge_doc` — categories: `arcs`, `sdks`, `algokit`, `algokit-utils`, `tealscript`, `puya`, `liquid-auth`, `python`, `developers`, `clis`, `nodes`, `details`

### Skill Structure

```
algorand-interaction/
├── SKILL.md  (router)
└── references/
    ├── algorand-mcp.md            # Tool reference
    └── examples-algorand-mcp.md   # Workflow examples
```

### Pagination

API responses are paginated. Every API tool accepts optional `itemsPerPage` (default 10) and `pageToken` parameters. Pass `pageToken` from a previous response to fetch the next page.

### Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `No active account` | No wallet account configured | Guide user to `wallet_add_account` |
| `Invalid Algorand address format` | Bad address | Check with `validate_address` |
| `Spending limit exceeded` | Transaction exceeds `allowance` or `dailyAllowance` | Inform user, adjust limits |
| `Asset hasn't been opted in` | Recipient not opted in to ASA | Opt-in first with `wallet_optin_asset` |
| `Overspend` / negative balance | Insufficient funds for amount + fee + MBR | Add funds or reduce amount |

### NFD Important Note

When using NFD (`.algo` names) for transactions, always use the `depositAccount` field from the NFD data response — NOT other address fields.

### Security

- **Mainnet = real value** — always confirm with user before mainnet transactions
- Never log, display, or store mnemonics or secret keys — use `wallet_*` tools for signing
- Verify addresses with `validate_address` — transactions are irreversible
- Verify asset IDs on-chain — scam tokens use similar names
- Respect wallet spending limits — if rejected, inform user rather than bypassing

### Links

- GoPlausible: https://goplausible.com
- Algorand: https://algorand.co
- Testnet Faucet: https://lora.algokit.io/testnet/fund
- Testnet USDC Faucet: https://faucet.circle.com/
- Algorand Developer Docs: https://dev.algorand.co/
- Algorand Developer Docs Github: https://github.com/algorandfoundation/devportal
- Algorand Developer Examples Github: https://github.com/algorandfoundation/devportal-code-examples

---

## X402 Payment Protocol

x402 is an HTTP-native payment protocol built on the HTTP 402 "Payment Required" status code. Three components work together: **Client** requests a protected resource, **Server** responds with 402 and structured payment requirements, and **Facilitator** verifies and settles the payment on-chain. The client signs a transaction, retries the request with an `PAYMENT-SIGNATURE` header, and the server forwards it to the facilitator for verification and settlement before granting access.

Algorand (AVM) is a **first-class citizen** alongside EVM (Ethereum) and SVM (Solana) — never conditional, always registered unconditionally. It uses CAIP-2 network identifiers and supports fee abstraction (facilitator pays transaction fees), ASA payments (USDC, ALGO), atomic transaction groups, and 3.3-second finality.

### Payment Flow

```
Client                  Resource Server           Facilitator           Algorand
  |                          |                        |                    |
  | 1. GET /api/data         |                        |                    |
  |------------------------->|                        |                    |
  | 2. 402 + requirements    |                        |                    |
  |<-------------------------|                        |                    |
  | 3. Build + sign txn      |                        |                    |
  | 4. GET + PAYMENT-SIGNATURE header|                        |                    |
  |------------------------->| 5. verify(payload)     |                    |
  |                          |----------------------->| 6. simulate_group  |
  |                          |                        |------------------->|
  |                          |                        |<-------------------|
  |                          |<-----------------------| {isValid: true}    |
  |                          | 7. settle(payload)     |                    |
  |                          |----------------------->| 8. sign + send     |
  |                          |                        |------------------->|
  |                          |                        |<-------------------| txId
  |                          |<-----------------------|                    |
  | 9. 200 + data            |                        |                    |
  |<-------------------------|                        |                    |
```

**Detailed flow:**
1. Client makes `GET /api/data` — server returns `402` with `PaymentRequirements`
2. `PaymentRequirements` contain: scheme (`exact`), network (CAIP-2), asset (ASA ID), amount (atomic units), payTo (Algorand address), extra (feePayer, decimals)
3. Client builds a transaction group, signs its own transactions, encodes as base64
4. Client retries with `PAYMENT-SIGNATURE` header containing `{ x402Version, scheme, network, payload: { paymentGroup, paymentIndex } }`
5. Server forwards to facilitator — facilitator verifies, simulates, settles
6. Server returns 200 with the protected resource

### CAIP-2 Network Identifiers

x402 V2 uses [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md) identifiers based on genesis hashes:

| Network            | Identifier                                               |
| ------------------ | -------------------------------------------------------- |
| Algorand Testnet   | `algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=` |
| Algorand Mainnet   | `algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=`  |

V1 legacy identifiers (`algorand-mainnet`, `algorand-testnet`) are still supported via automatic mapping.

### X402 Components

**Client** — Wraps HTTP clients (fetch/axios/httpx/requests) to automatically handle 402 responses. Builds Algorand transaction groups using `ClientAvmSigner`, signs them, encodes as `PAYMENT-SIGNATURE` header, and retries the request.

**Resource Server** — Middleware for Express/Hono/Next.js/FastAPI/Flask that intercepts requests to protected routes. Returns 402 with `PaymentRequirements` (scheme, network, payTo, price, asset) when no payment header is present. Forwards valid payments to facilitator for verification and settlement.

**Facilitator** — On-chain payment processor implementing `FacilitatorAvmSigner` protocol: `simulate_group()` to verify transaction structure, `sign_group()` for fee abstraction (signs fee payer transactions), `send_group()` to submit atomic groups, and `confirm_transaction()` to wait for finality. Public facilitator: `https://facilitator.goplausible.xyz`

**Paywall** — Browser UI component (`@x402-avm/paywall`) for manual payment when automatic client payment isn't available. Renders a payment form and handles wallet interaction.

**Bazaar Extension** — Discovery extension (`@x402-avm/extensions` / `x402-avm[extensions]`) that registers facilitator and server capabilities for API cataloging. Clients can query available facilitators, their supported networks, and pricing through standardized endpoints.

### Algorand-Specific Features

**Fee Abstraction** — Algorand's atomic transaction groups enable fee abstraction. The facilitator pays transaction fees on behalf of the client through a 2-transaction group:
1. Transaction 0 (fee payer): Self-payment by facilitator, amount=0, fee covers both txns
2. Transaction 1 (payment): ASA transfer from client to payTo, fee=0
Both transactions share an atomic group ID — they execute all-or-nothing.

**ASA Support:**

| Asset | Testnet ASA ID | Mainnet ASA ID | Decimals |
|-------|---------------|----------------|----------|
| USDC  | `10458941`    | `31566704`     | 6        |
| ALGO  | `0` (native)  | `0` (native)   | 6        |

**Atomic Groups** — Payment groups can include up to 16 transactions, enabling composability — additional smart contract calls or opt-ins alongside the payment.

**Fast Finality** — Algorand transactions finalize in ~3.3 seconds with no reorgs or rollbacks.

### Signer Protocols (Core Architecture)

Protocol definitions live in the SDK; implementations are provided by users/examples:

| Protocol                | Role         | Key Methods                                                               |
| ----------------------- | ------------ | ------------------------------------------------------------------------- |
| `ClientAvmSigner`       | Client-side  | `address`, `sign_transactions(unsigned_txns, indexes_to_sign)`            |
| `FacilitatorAvmSigner`  | Facilitator  | `get_addresses`, `sign_transaction`, `sign_group`, `simulate_group`, `send_group`, `confirm_transaction` |

### Packages

**TypeScript** (npm):

| Package               | Purpose                              |
| --------------------- | ------------------------------------ |
| `@x402-avm/core`      | Base protocol (client, server, facilitator, types) |
| `@x402-avm/avm`       | Algorand mechanism + constants       |
| `@x402-avm/evm`       | Ethereum mechanism                   |
| `@x402-avm/svm`       | Solana mechanism                     |
| `@x402-avm/express`   | Express.js server middleware         |
| `@x402-avm/hono`      | Hono server middleware               |
| `@x402-avm/next`      | Next.js middleware (paymentProxy)    |
| `@x402-avm/fetch`     | Fetch API client wrapper             |
| `@x402-avm/axios`     | Axios client wrapper                 |
| `@x402-avm/paywall`   | Browser paywall UI                   |
| `@x402-avm/extensions`| Extensions (Bazaar discovery)        |

**Python** (pip) — single package `x402-avm` with extras:

| Install Extra          | Purpose                              |
| ---------------------- | ------------------------------------ |
| `x402-avm[avm]`        | Algorand mechanism + constants       |
| `x402-avm[evm]`        | Ethereum mechanism                   |
| `x402-avm[svm]`        | Solana mechanism                     |
| `x402-avm[fastapi]`    | FastAPI server middleware            |
| `x402-avm[flask]`      | Flask server middleware              |
| `x402-avm[httpx]`      | Async HTTP client (httpx)            |
| `x402-avm[requests]`   | Sync HTTP client (requests)          |
| `x402-avm[extensions]` | Extensions (Bazaar discovery)        |
| `x402-avm[all]`        | Everything                           |

### Important Rules

1. **AVM is always first-class** — never wrap AVM registration in conditional checks
2. **Use CAIP-2 identifiers** — `algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=` for testnet
3. **Signer separation** — protocol definitions live in the SDK, implementations live in examples
4. **Raw bytes protocol** — the SDK passes raw msgpack bytes between methods; algosdk conversions happen at boundaries
5. **Private key format** — `AVM_PRIVATE_KEY` is Base64-encoded, 64 bytes (32-byte seed + 32-byte pubkey)
6. **Address derivation** — `encode_address(secret_key[32:])` in both Python and TypeScript

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `402 Payment Required` with no payment options | AVM scheme not registered on server | Call `registerExactAvmScheme(server)` |
| `Invalid network` | Using V1 identifier where V2 expected | Use CAIP-2 format: `algorand:SGO1...` |
| `Simulation failed` | Transaction would fail on-chain | Check balances, ASA opt-in, group structure |
| `Invalid key length` | Wrong private key format | Key must be 64 bytes, Base64-encoded |
| `No signer for address` | Facilitator does not manage that address | Check `getAddresses()` returns the fee payer |
| `Group ID mismatch` | Transactions not properly grouped | Use `algosdk.assignGroupID()` before encoding |
| `Amount mismatch` | Payment amount differs from requirements | Use atomic units matching `paymentRequirements.amount` |

### X402 Skills

Two skills cover all x402 development. Each has a `SKILL.md` router plus a `references/` folder with implementation guides, API references, and code examples.

| Task                        | Skill                      |
| --------------------------- | -------------------------- |
| TypeScript x402 development | `algorand-x402-typescript` |
| Python x402 development     | `algorand-x402-python`     |

**TypeScript topics:** `explain-algorand-x402-typescript`, `create-typescript-x402-client`, `create-typescript-x402-server`, `create-typescript-x402-nextjs`, `create-typescript-x402-facilitator`, `create-typescript-x402-paywall`, `use-typescript-x402-core-avm`

**Python topics:** `explain-algorand-x402-python`, `create-python-x402-client`, `create-python-x402-server`, `create-python-x402-facilitator`, `use-python-x402-core-avm`

### Building X402 Applications

1. **Pick language**: TypeScript (`@x402-avm/*` packages) or Python (`x402-avm[extras]`)
2. **Load the parent skill**: `algorand-x402-typescript` or `algorand-x402-python`
3. **Choose components**: Client, server, facilitator, paywall — or a subset
4. **Read the SKILL.md** router to find the right reference files for your component
5. **Implement signers**: `ClientAvmSigner` for clients, `FacilitatorAvmSigner` for facilitators — protocol definitions are in the SDK, implementations in your code

### x402 Algorand Environment Variables

| Variable          | Purpose                                      |
| ----------------- | -------------------------------------------- |
| `AVM_PRIVATE_KEY` | Base64-encoded 64-byte key (32 seed + 32 pub)|
| `ALGOD_SERVER`    | Custom Algod node URL (optional, defaults to AlgoNode) |
| `ALGOD_TOKEN`     | Algod node API token (optional)              |
| `PAY_TO`          | Algorand address to receive payments (server)|

### External Algorand x402 Resources

- x402 Gateway: https://x402.goplausible.xyz
- Facilitator: https://facilitator.goplausible.xyz
- [GoPlausible x402-avm Documentation and Example code](https://github.com/GoPlausible/.github/blob/main/profile/algorand-x402-documentation/README.md)
- [GoPlausible x402-avm Examples template Projects](https://github.com/GoPlausible/x402-avm/tree/branch-v2-algorand-publish/examples/)
- [Coinbase x402 Protocol](https://github.com/coinbase/x402)
- [CAIP-2 Specification](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md)
