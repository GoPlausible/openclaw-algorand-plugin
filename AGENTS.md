# AGENTS.md

## Overview

This project develops Algorand blockchain applications including smart contracts, frontend interfaces and x402 applications. When working here, always leverage the available skills and MCP tools before writing code—they provide canonical syntax, examples, and documentation that prevent errors and save time.

## Creating New Projects

Before initializing any AlgoKit project:

1. **Load the skill**: Use `algorand-development` skill (create-project topic)
2. **For TypeScript**: `algokit init -n <name> -t typescript --answer preset_name production --defaults`
3. **For Python**: `algokit init -n <name> -t python --answer preset_name production --defaults`

## Writing Smart Contracts

Before writing ANY Algorand contract code:

1. **Load the skill first**: Use `algorand-typescript` or `algorand-python` skill (build-smart-contracts topic)
2. **Search docs**: Call `kapa_search_algorand_knowledge_sources` for concepts
3. **Get examples**: Use `github_get_file_contents` from:
   - `algorandfoundation/devportal-code-examples`
   - `algorandfoundation/puya-ts` (TypeScript) or `algorandfoundation/puya` (Python)
4. **Write code** following skill guidance
5. **Build/test**: `algokit project run build && algokit project run test`

## Deploying & Calling Contracts

Use the **CLI and generated typed clients** for deployment and interaction.

### Workflow

1. **Load the skill**: Use `algorand-typescript` skill (call-smart-contracts topic) or `algorand-python` skill
2. **Start localnet**: `algokit localnet start`
3. **Build contracts**: `algokit project run build`
4. **Deploy to localnet**: `algokit project deploy localnet`
   - This runs `deploy-config.ts` which uses the generated client
   - Handles idempotent deployment (safe to re-run)
   - Note the App ID from the deployment output

### Contract Interaction

After deployment, interact with contracts using the generated typed client:

1. **Write interaction scripts** in `deploy-config.ts` or separate scripts
2. **Use the typed client** generated from the ARC-56 app spec
3. **Run scripts**: `npx tsx scripts/call-contract.ts`

See the `algorand-typescript` skill (call-smart-contracts topic) for detailed patterns and examples.

## Building React Frontends

Before building a React frontend that interacts with Algorand contracts:

1. **Load the skill**: Use `algorand-typescript` skill (deploy-react-frontend topic)
2. **Prerequisites**: Deployed contract with known App ID, ARC-56 app spec
3. **Generate typed client**: `algokit generate client MyContract.arc56.json --output src/contracts/MyContractClient.ts`
4. **Install deps**: `npm install @algorandfoundation/algokit-utils @txnlab/use-wallet-react algosdk`
5. **Follow the "signer handoff" pattern**:
   - Set up `WalletProvider` with `@txnlab/use-wallet-react`
   - Get `transactionSigner` from `useWallet()` hook
   - Register signer: `algorand.setSigner(activeAddress, transactionSigner)`
   - Create typed client with `defaultSender: activeAddress`

## Available Skills

Six skills cover Algorand development, x402 payments, and blockchain interaction. Each skill has a single `SKILL.md` router plus a `references/` folder with all implementation guides and API references.

| Task                              | Skill                      |
| --------------------------------- | -------------------------- |
| CLI, examples, general workflows  | `algorand-development`     |
| TypeScript contracts & tools      | `algorand-typescript`      |
| Python contracts & tools          | `algorand-python`          |
| Blockchain interaction via MCP    | `algorand-interaction`     |
| TypeScript x402 development       | `algorand-x402-typescript` |
| Python x402 development           | `algorand-x402-python`     |

**Skill structure:**
```
algorand-development/           algorand-typescript/            algorand-python/
├── SKILL.md  (router)          ├── SKILL.md  (router)          ├── SKILL.md  (router)
└── references/                 └── references/                 └── references/
    ├── use-algokit-cli.md          ├── algorand-typescript-         ├── build-smart-contracts-
    ├── search-algorand-                syntax.md                        decorators.md
    │   examples.md                 ├── test-smart-contracts.md      ├── build-smart-contracts-
    ├── create-project.md           ├── call-smart-contracts.md          storage.md
    ├── build-smart-contracts.md    ├── deploy-react-frontend.md     ├── use-algokit-utils-
    ├── implement-arc-standards.md  ├── use-algokit-utils.md             reference.md
    └── troubleshoot-errors.md      └── ...                          └── ...
```

**algorand-development topics:** `use-algokit-cli`, `search-algorand-examples`, `create-project`, `build-smart-contracts`, `implement-arc-standards`, `troubleshoot-errors`

**algorand-typescript topics:** `algorand-typescript-syntax`, `algorand-ts-migration`, `test-smart-contracts`, `call-smart-contracts`, `deploy-react-frontend`, `create-project`, `build-smart-contracts`, `use-algokit-utils`, `implement-arc-standards`, `troubleshoot-errors`

**algorand-python topics:** `create-project`, `build-smart-contracts`, `use-algokit-utils`, `implement-arc-standards`, `troubleshoot-errors`

## MCP Tools

**Important:** These tools are provided by MCP servers. If a tool isn't available when you try to use it, the MCP server may not be configured. Check for a `.mcp.json` (Claude Code) or `opencode.json` (OpenCode) file in the project root. If the config exists but tools still aren't available, restart your coding agent.

**Note:** MCP tool names may have different prefixes depending on your coding agent. For example:
- Claude Code: `mcp__kapa__search_algorand_knowledge_sources`
- Other agents may use: `kapa_search_algorand_knowledge_sources`

The tool functionality is the same regardless of prefix.

### Documentation Search (Kapa)

| Tool                                      | Purpose                       |
| ----------------------------------------- | ----------------------------- |
| `kapa_search_algorand_knowledge_sources` | Search official Algorand docs |

### GitHub (Code Examples)

| Tool                         | Purpose                          |
| ---------------------------- | -------------------------------- |
| `github_get_file_contents`   | Retrieve example code from repos |
| `github_search_code`         | Find code patterns across repos  |
| `github_search_repositories` | Discover repos by topic/name     |

## Troubleshooting

### MCP Tools Not Available

If MCP tools aren't available, use these fallbacks:

| Missing Tool                              | Fallback                                                        |
| ----------------------------------------- | --------------------------------------------------------------- |
| `kapa_search_algorand_knowledge_sources` | Use web search for "site:dev.algorand.co {query}"               |
| `github_get_file_contents`                | Use web search or browse GitHub directly                        |
| `github_search_code`                      | Use web search for "site:github.com algorandfoundation {query}" |

**To fix MCP configuration:**

1. **Check config exists**: Look for `.mcp.json` (Claude Code), `opencode.json` (OpenCode), or `.cursor/mcp.json` (Cursor)
2. **Verify server entries**: Config should include `kapa` and `github` MCP servers
3. **Restart the agent**: MCP tools load at startup; restart after config changes

**Note:** You can always proceed without MCPs by:

- Using web search for documentation (dev.algorand.co)
- Browsing GitHub repos directly (algorandfoundation/puya-ts, algorandfoundation/devportal-code-examples)
- Using CLI commands for all deployment and testing

### Localnet Connection Errors

If localnet commands fail with "network unreachable" or connection errors:

1. **Start localnet**: `algokit localnet start`
2. **Verify it's running**: `algokit localnet status`
3. **Reset if needed**: `algokit localnet reset`

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.

## X402 Development

x402 is an HTTP-native payment protocol built on the HTTP 402 "Payment Required" status code. Three components work together: **Client** requests a protected resource, **Server** responds with 402 and structured payment requirements, and **Facilitator** verifies and settles the payment on-chain. The client signs a transaction, retries the request with an `X-PAYMENT` header, and the server forwards it to the facilitator for verification and settlement before granting access.

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
  | 4. GET + X-PAYMENT header|                        |                    |
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
4. Client retries with `X-PAYMENT` header containing `{ x402Version, scheme, network, payload: { paymentGroup, paymentIndex } }`
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

**Client** — Wraps HTTP clients (fetch/axios/httpx/requests) to automatically handle 402 responses. Builds Algorand transaction groups using `ClientAvmSigner`, signs them, encodes as `X-PAYMENT` header, and retries the request.

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

Two aggregated skills cover all x402 development. Each skill has a single `SKILL.md` that acts as a router, plus a `references/` folder containing all implementation guides, API references, and code examples as named files.

| Task                        | Skill                      |
| --------------------------- | -------------------------- |
| TypeScript x402 development | `algorand-x402-typescript` |
| Python x402 development     | `algorand-x402-python`     |

**Skill structure:**
```
algorand-x402-typescript/          algorand-x402-python/
├── SKILL.md  (router)             ├── SKILL.md  (router)
└── references/                    └── references/
    ├── {topic}.md                     ├── {topic}.md
    ├── {topic}-reference.md           ├── {topic}-reference.md
    └── {topic}-examples.md            └── {topic}-examples.md
```

Each topic has three reference files:
- **`{topic}.md`** — Step-by-step implementation guide (formerly the sub-skill's SKILL.md)
- **`{topic}-reference.md`** — API details and type signatures
- **`{topic}-examples.md`** — Complete, runnable code samples

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

- [GoPlausible x402-avm Documentation](https://github.com/GoPlausible/.github/blob/main/profile/algorand-x402-documentation/README.md)
- [GoPlausible x402-avm Examples](https://github.com/GoPlausible/x402-avm/tree/branch-v2-algorand-publish/examples/)
- [Coinbase x402 Protocol](https://github.com/coinbase/x402)
- [CAIP-2 Specification](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md)


## Algorand Remote MCP Interaction

The `algorand-interaction` skill provides direct blockchain interaction via GoPlausible's Remote MCP servers. This skill is for **runtime operations** — wallet management, transactions, asset transfers, DEX swaps, NFD lookups — as opposed to the development skills which focus on building applications.

### MCP Servers

**Algorand Remote MCP (Full)** — Complete Algorand tooling for advanced users, developers, and agents needing full blockchain capabilities.

**Algorand Remote MCP Lite (Wallet Edition)** — Subset of tools for agents that just need an agentic wallet with basic interactions (payments, transfers, swaps) without advanced development tools.

| Server | URL | Use Case |
|--------|-----|----------|
| **Full** | `https://algorandmcp.goplausible.xyz/sse` | Full Algorand tooling: wallet, transactions, smart contracts, TEAL, indexer, knowledge base |
| **Lite** | `https://algorandmcplite.goplausible.xyz/sse` | Agentic wallet: payments, transfers, swaps, NFD, QR codes, receipts |

**Network:** Mainnet only (testnet support coming soon)

### Authentication & Security

- **OAuth + OIDC** authentication for secure access
- **HashiCorp Vault** for wallet keypair storage and management
- **Server-side signing** — no private keys needed from agent
- Private keys never leave the vault; cryptographic operations happen within

### Session Start Checklist

**At EVERY session start:**

1. **Check wallet**: Call `wallet_get_info` to verify wallet exists and is configured
2. **Show references**: Present common assets table + workflow quick reference to user

### Pre-Transaction Validation

Before ANY transaction:

1. **MBR**: Account needs 0.1 ALGO minimum + 0.1 per asset/app opt-in
2. **Asset Opt-In**: Verify with `algod_get_account_asset_info` before transfers
3. **Fees**: Every txn costs 0.001 ALGO (1000 microAlgos)
4. **Balance**: Always fetch current balance before signing
5. **Top-up QR**: If funds insufficient, use `generate_algorand_qrcode` for PeraWallet top-up
6. **Order**: ALGO funding first, then asset transactions

### Common Mainnet Assets

| Asset | ID | Decimals |
|-------|-----|----------|
| USDC | 31566704 | 6 |
| USDT | 312769 | 6 |
| ALGO | N/A (native) | 6 |
| goETH | 386192725 | 8 |
| goBTC | 386195940 | 8 |

> Always verify asset IDs with `pera_verified_asset_*` tools — scam tokens use similar names.

### Single Transaction Workflow

| Step | Tool | Purpose |
|------|------|---------|
| 1 | `wallet_get_info` | Verify wallet configuration |
| 2 | Query tools | Get account/asset data |
| 3 | `sdk_txn_*` | Create unsigned transaction |
| 4 | `wallet_sign_transaction` | Sign the transaction |
| 5 | `sdk_submit_transaction` | Submit to network |
| 6 | `indexer_lookup_transaction_by_id` | Verify result |

### Atomic Group Transaction Workflow

| Step | Tool | Purpose |
|------|------|---------|
| 1 | `wallet_get_info` | Verify wallet configuration |
| 2 | Query tools | Get account/asset data |
| 3 | `sdk_create_atomic_group` | Create grouped transactions (auto-assigns group ID) |
| 4 | `wallet_sign_atomic_group` | Sign all transactions in group |
| 5 | `sdk_submit_atomic_group` | Submit atomic group (all-or-nothing) |
| 6 | `indexer_lookup_transaction_by_id` | Verify result |

**Manual grouping alternative:** Create individual transactions with `sdk_txn_*`, then use `sdk_assign_group_id` to assign group ID before signing.

---

### Algorand Remote MCP Lite (Wallet Edition) — Tool Categories

**Wallet Management**
| Tool | Purpose |
|------|---------|
| `wallet_get_info` | Verify wallet exists and is configured (use FIRST every session) |
| `wallet_get_assets` | Get assets held by wallet |
| `wallet_sign_transaction` | Sign a single transaction |
| `wallet_sign_atomic_group` | Sign multiple transactions as atomic group |

**Account Information**
| Tool | Purpose |
|------|---------|
| `algod_get_account_info` | Get full account information |
| `algod_get_account_asset_info` | Check if account holds specific asset (verify opt-in) |
| `sdk_check_account_balance` | Check ALGO balance |

**Transaction Creation**
| Tool | Purpose |
|------|---------|
| `sdk_txn_payment_transaction` | Create ALGO payment |
| `sdk_txn_asset_optin` | Opt-in to receive an asset |
| `sdk_txn_transfer_asset` | Transfer ASA tokens |
| `sdk_create_atomic_group` | Create atomic transaction group |
| `sdk_assign_group_id` | Assign group ID for atomic execution |

**Transaction Submission & Lookup**
| Tool | Purpose |
|------|---------|
| `sdk_submit_transaction` | Submit signed transaction |
| `sdk_submit_atomic_group` | Submit signed atomic group |
| `indexer_lookup_transaction_by_id` | Look up transaction details |
| `indexer_lookup_account_transactions` | Get account transaction history |

**Asset Information**
| Tool | Purpose |
|------|---------|
| `algod_get_asset_info` | Get asset configuration details |
| `pera_verified_asset_query` | Check asset verification status and details |
| `pera_verified_assets_search` | Search for verified assets |

**NFD (Algorand Name Service)**
| Tool | Purpose |
|------|---------|
| `api_nfd_get_nfd` | Get NFD (.algo name) info — use `depositAccount` for transactions! |
| `api_nfd_get_nfds_for_address` | Get all NFDs owned by an address |

**Utility & Extras**
| Tool | Purpose |
|------|---------|
| `sdk_validate_address` | Validate Algorand address format |
| `generate_algorand_qrcode` | Generate ARC-26 QR code for instant top-ups (PeraWallet) |
| `generate_algorand_receipt` | Generate transaction receipt with QR code |
| `generate_ap2_mandate` | Generate AP2 payment mandates for agentic checkout |

**Tinyman DEX**
| Tool | Purpose |
|------|---------|
| `tinyman_*` | Tinyman DEX swap tools for token exchanges |

---

### Algorand Remote MCP (Full) — Tool Categories

*Includes all Lite tools plus the following:*

**Extended Wallet Management**
| Tool | Purpose |
|------|---------|
| `wallet_get_address` | Get wallet address |
| `wallet_get_publickey` | Get wallet public key |
| `wallet_reset_account` | ⚠️ DANGEROUS: Delete keys and create new (transfer funds first!) |

**Extended Asset Information**
| Tool | Purpose |
|------|---------|
| `algod_get_asset_holding` | Get asset holding for specific address |
| `pera_asset_verification_status` | Check if asset is verified |
| `pera_verified_asset_details` | Get detailed verified asset info |
| `pera_verified_asset_search` | Search verified assets |

**Smart Contract / Application Management**
| Tool | Purpose |
|------|---------|
| `sdk_txn_create_application` | Deploy smart contract |
| `sdk_txn_call_application` | Call smart contract method |
| `sdk_txn_update_application` | Update smart contract |

**Developer Utilities**
| Tool | Purpose |
|------|---------|
| `sdk_compile_teal` | Compile TEAL program |
| `sdk_encode_obj` | Encode object to msgpack |
| `sdk_decode_obj` | Decode msgpack to object |

**Knowledge Base**
| Tool | Purpose |
|------|---------|
| `list_knowledge_docs` | List knowledge documents by category prefix |
| `get_knowledge_doc` | Get specific knowledge document (ARCs, SDKs, AlgoKit, etc.) |

**Knowledge Categories:** `arcs`, `sdks`, `algokit`, `algokit-utils`, `tealscript`, `puya`, `liquid-auth`, `python`, `developers`, `clis`, `nodes`, `details`

---

### Skill Structure

```
algorand-interaction/
├── SKILL.md  (router)
└── references/
    ├── algorand-remote-mcp-lite.md          # Lite MCP tool reference
    ├── algorand-remote-mcp.md               # Full MCP tool reference
    ├── examples-algorand-remote-mcp-lite.md # Lite workflows & examples
    └── examples-algorand-remote-mcp.md      # Full workflows & examples
```

### NFD Important Note

When using NFD (`.algo` names) for transactions, always use the `depositAccount` field from the NFD data response — NOT other address fields.

### Security

- **Mainnet = real value** — double-check everything
- Private keys stored in HashiCorp Vault (server-side signing)
- Never expose mnemonics or keys
- Verify recipient addresses (transactions are irreversible)

### Links

- GoPlausible: https://goplausible.com
- x402 Gateway: https://x402.goplausible.xyz
- Facilitator: https://facilitator.goplausible.xyz
