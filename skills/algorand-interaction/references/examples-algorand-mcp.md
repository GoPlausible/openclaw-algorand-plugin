# Algorand MCP — Workflow Examples

> All examples use `network: "testnet"` unless noted. For mainnet, change to `"mainnet"` and confirm with user.
> USDC ASA ID: 31566704 (6 decimals). 1 ALGO = 1,000,000 microAlgos.

---

## Session Start

### Step 1: Verify wallet
```
wallet_get_info { "network": "testnet" }
```

### Step 2: If no account exists
```
wallet_add_account {
  "nickname": "my-wallet"
}
```

### Step 3: If account needs funding
```
generate_algorand_qrcode {
  "address": "[wallet_address]",
  "amount": 5000000,
  "note": "Fund testnet account"
}
```
Or direct user to: https://lora.algokit.io/testnet/fund

### Step 4: If account needs USDC funding
```
generate_algorand_qrcode {
  "address": "[wallet_address]",
  "asset": 10458941, // USDC on testnet
  "amount": 1000000, // 1 USDC with 6 decimals
  "note": "Fund testnet account with USDC"
}
```
Or direct user to: https://faucet.circle.com/

---

## ALGO Payment Workflow

### Step 1: Get wallet info
```
wallet_get_info { "network": "testnet" }
```

### Step 2: Create payment transaction
```
make_payment_txn {
  "from": "[sender_address]",
  "to": "[receiver_address]",
  "amount": 1000000,
  "note": "Payment of 1 ALGO",
  "network": "testnet"
}
```
> Amount in microAlgos: 1 ALGO = 1,000,000

### Step 3: Sign the transaction
```
wallet_sign_transaction {
  "transaction": { "...transaction object from step 2..." },
  "network": "testnet"
}
```

### Step 4: Submit the transaction
```
send_raw_transaction {
  "signedTxns": ["[base64_blob_from_step_3]"],
  "network": "testnet"
}
```

### Step 5: Present transaction ID to user

**ALWAYS** show the transaction ID with the correct explorer link:

- **Mainnet**: `https://allo.info/tx/{txId}`
- **Testnet**: `https://lora.algokit.io/testnet/transaction/{txId}`

Example (testnet):
> Transaction confirmed! `[txID_from_step_4]`
> View on explorer: https://lora.algokit.io/testnet/transaction/[txID_from_step_4]

Optionally verify on-chain:
```
api_indexer_lookup_transaction_by_id {
  "txId": "[txID_from_step_4]",
  "network": "testnet"
}
```

---

## Asset Opt-In Workflow (One-Step)

The simplest way to opt-in to an asset:

```
wallet_optin_asset {
  "assetId": 31566704,
  "network": "testnet"
}
```

This creates, signs, and submits the opt-in transaction in a single call. Present the returned txID with explorer link.

---

## Asset Opt-In Workflow (Manual)

### Step 1: Check if already opted in
```
api_algod_get_account_asset_info {
  "address": "[sender_address]",
  "assetId": 31566704,
  "network": "testnet"
}
```

### Step 2: Create opt-in transaction (0-amount self-transfer)
```
make_asset_transfer_txn {
  "from": "[sender_address]",
  "to": "[sender_address]",
  "assetIndex": 31566704,
  "amount": 0,
  "network": "testnet"
}
```

### Step 3: Sign
```
wallet_sign_transaction {
  "transaction": { "...transaction from step 2..." },
  "network": "testnet"
}
```

### Step 4: Submit
```
send_raw_transaction {
  "signedTxns": ["[base64_blob_from_step_3]"],
  "network": "testnet"
}
```

### Step 5: Present transaction ID to user

Show the txID with explorer link:
- **Testnet**: `https://lora.algokit.io/testnet/transaction/{txId}`
- **Mainnet**: `https://allo.info/tx/{txId}`

---

## Asset Transfer Workflow (USDC Example)

### Step 1: Get wallet info
```
wallet_get_info { "network": "testnet" }
```

### Step 2: Get asset info (verify decimals)
```
api_algod_get_asset_by_id {
  "assetId": 31566704,
  "network": "testnet"
}
```

### Step 3: Check sender's asset balance
```
api_algod_get_account_asset_info {
  "address": "[sender_address]",
  "assetId": 31566704,
  "network": "testnet"
}
```

### Step 4: Verify recipient has opted in
```
api_algod_get_account_asset_info {
  "address": "[recipient_address]",
  "assetId": 31566704,
  "network": "testnet"
}
```

### Step 5: Create transfer (1 USDC = 1,000,000 with 6 decimals)
```
make_asset_transfer_txn {
  "from": "[sender_address]",
  "to": "[recipient_address]",
  "assetIndex": 31566704,
  "amount": 1000000,
  "network": "testnet"
}
```

### Step 6: Sign
```
wallet_sign_transaction {
  "transaction": { "...transaction from step 5..." },
  "network": "testnet"
}
```

### Step 7: Submit
```
send_raw_transaction {
  "signedTxns": ["[base64_blob_from_step_6]"],
  "network": "testnet"
}
```

### Step 8: Present transaction ID to user

Show the txID with explorer link:
- **Testnet**: `https://lora.algokit.io/testnet/transaction/{txId}`
- **Mainnet**: `https://allo.info/tx/{txId}`

---

## Atomic Group Transaction Workflow

### Step 1: Build individual transactions
```
make_payment_txn {
  "from": "[address_A]",
  "to": "[address_B]",
  "amount": 1000000,
  "network": "testnet"
}
```
```
make_asset_transfer_txn {
  "from": "[address_B]",
  "to": "[address_A]",
  "assetIndex": 31566704,
  "amount": 500000,
  "network": "testnet"
}
```

### Step 2: Assign group ID
```
assign_group_id {
  "transactions": [txn1_from_step1, txn2_from_step1]
}
```

### Step 3: Sign group with wallet
```
wallet_sign_transaction_group {
  "transactions": [grouped_txn1, grouped_txn2],
  "network": "testnet"
}
```

### Step 4: Submit
```
send_raw_transaction {
  "signedTxns": ["[blob1]", "[blob2]"],
  "network": "testnet"
}
```

> Atomic groups are all-or-nothing: either all transactions succeed or none do.

### Step 5: Present transaction IDs to user

Show all txIDs from the group with explorer links:
- **Testnet**: `https://lora.algokit.io/testnet/transaction/{txId}`
- **Mainnet**: `https://allo.info/tx/{txId}`

---

## Create an ASA (Algorand Standard Asset)

### Step 1: Create the asset
```
make_asset_create_txn {
  "from": "[creator_address]",
  "total": 1000000000,
  "decimals": 6,
  "defaultFrozen": false,
  "unitName": "MYT",
  "assetName": "My Token",
  "assetURL": "https://example.com/my-token",
  "manager": "[creator_address]",
  "reserve": "[creator_address]",
  "freeze": "[creator_address]",
  "clawback": "[creator_address]",
  "network": "testnet"
}
```

### Step 2: Sign
```
wallet_sign_transaction {
  "transaction": { "...transaction from step 1..." },
  "network": "testnet"
}
```

### Step 3: Submit
```
send_raw_transaction {
  "signedTxns": ["[base64_blob]"],
  "network": "testnet"
}
```

### Step 4: Look up the created asset
```
api_algod_get_pending_transaction {
  "txId": "[txID_from_step_2]",
  "network": "testnet"
}
```
> The `asset-index` field in the response contains the new ASA ID.

### Step 5: Present transaction ID to user

Show the txID with explorer link:
- **Testnet**: `https://lora.algokit.io/testnet/transaction/{txId}`
- **Mainnet**: `https://allo.info/tx/{txId}`

---

## Deploy a Smart Contract

### Step 1: Compile approval program
```
compile_teal {
  "source": "#pragma version 10\nint 1\nreturn",
  "network": "testnet"
}
```

### Step 2: Compile clear program
```
compile_teal {
  "source": "#pragma version 10\nint 1\nreturn",
  "network": "testnet"
}
```

### Step 3: Create the application
```
make_app_create_txn {
  "from": "[creator_address]",
  "approvalProgram": "[base64_from_step_1]",
  "clearProgram": "[base64_from_step_2]",
  "numGlobalByteSlices": 1,
  "numGlobalInts": 1,
  "numLocalByteSlices": 0,
  "numLocalInts": 0,
  "network": "testnet"
}
```

### Step 4: Sign and submit
```
wallet_sign_transaction {
  "transaction": { "...transaction from step 3..." },
  "network": "testnet"
}
```
```
send_raw_transaction {
  "signedTxns": ["[base64_blob]"],
  "network": "testnet"
}
```

### Step 5: Present transaction ID to user

Show the txID with explorer link:
- **Testnet**: `https://lora.algokit.io/testnet/transaction/{txId}`
- **Mainnet**: `https://allo.info/tx/{txId}`

---

## NFD Lookup

### Look up an NFD name
```
api_nfd_get_nfd {
  "nameOrID": "example.algo",
  "view": "full",
  "network": "mainnet"
}
```

### Get NFDs for an address
```
api_nfd_get_nfds_for_addresses {
  "address": ["ALGO_ADDRESS"],
  "view": "brief",
  "network": "mainnet"
}
```

> **CRITICAL**: When sending to an NFD, always use the `depositAccount` field from the response, NOT other address fields.

---

## Tinyman Swap Quote

### Get a swap quote (ALGO → USDC)
```
api_tinyman_get_swap_quote {
  "asset1Id": 0,
  "asset2Id": 31566704,
  "amount": 1000000,
  "network": "mainnet"
}
```
> Asset ID 0 = ALGO

### Get pool info
```
api_tinyman_get_pool {
  "asset1Id": 0,
  "asset2Id": 31566704,
  "version": "v2",
  "network": "mainnet"
}
```

---

## Haystack Router Swap (DEX-Aggregated)

Best-price swap across multiple DEXes (Tinyman V2, Pact, Folks). For detailed reference, see the **haystack-router-interaction** skill.

### CRITICAL: fixed-input vs fixed-output

| User says | type | amount is | fromASAID | toASAID |
|-----------|------|-----------|-----------|---------|
| "Swap 10 ALGO for USDC" | `fixed-input` | 10000000 (input — spend exactly 10 ALGO) | 0 (ALGO) | 31566704 (USDC) |
| "Buy 10 ALGO with USDC" | `fixed-output` | 10000000 (output — receive exactly 10 ALGO) | 31566704 (USDC) | 0 (ALGO) |

- **"Buy X of Y"** → `fixed-output`, amount = X in base units of Y, toASAID = Y
- **"Swap/sell/use X of Y"** → `fixed-input`, amount = X in base units of Y, fromASAID = Y

### Step 1: Check wallet
```
wallet_get_info { "network": "mainnet" }
```

### Step 2: Check opt-in (if swapping to an ASA)
```
api_haystack_needs_optin {
  "address": "[wallet_address]",
  "assetId": 31566704,
  "network": "mainnet"
}
```
If `needsOptIn: true`:
```
wallet_optin_asset { "assetId": 31566704, "network": "mainnet" }
```

### Step 3: Get a quote (show user before executing)

**Example A — "Swap 10 ALGO for USDC" (fixed-input):**
```
api_haystack_get_swap_quote {
  "fromASAID": 0,
  "toASAID": 31566704,
  "amount": 10000000,
  "type": "fixed-input",
  "address": "[wallet_address]",
  "network": "mainnet"
}
```

**Example B — "Buy 10 ALGO with USDC" (fixed-output):**
```
api_haystack_get_swap_quote {
  "fromASAID": 31566704,
  "toASAID": 0,
  "amount": 10000000,
  "type": "fixed-output",
  "address": "[wallet_address]",
  "network": "mainnet"
}
```
> Present to user: expected output (or estimated input), USD values, route, price impact.

### Step 4: Execute swap (after user confirms)

Use the **same `type`, `fromASAID`, `toASAID`, and `amount`** as the quote:
```
api_haystack_execute_swap {
  "fromASAID": 0,
  "toASAID": 31566704,
  "amount": 10000000,
  "type": "fixed-input",
  "slippage": 1,
  "network": "mainnet"
}
```
> Signs via wallet, submits, and confirms atomically. Returns confirmed round and tx IDs.

---

## Verify an Asset (Pera)

Check if an asset is legitimate before transacting — mainnet only.

### Check verification status
```
api_pera_asset_verification_status { "assetId": 31566704 }
```
> Returns: `{ asset_id: 31566704, verification_tier: "verified", explorer_url: "..." }`
> Tiers: `verified` (highest), `trusted`, `suspicious`, `unverified`

### Get detailed asset info with USD value
```
api_pera_verified_asset_details { "assetId": 31566704 }
```
> Returns: name, unit name, decimals, total supply, USD value, logo, verification tier

### Search for verified assets
```
api_pera_verified_asset_search { "query": "USDC", "verifiedOnly": true }
```
> Returns array of matching assets filtered to verified/trusted only

---

## Using the Knowledge Base

### Get a specific document
```
get_knowledge_doc {
  "documents": ["arcs:specs:arc-0003.md"]
}
```

### Knowledge categories
- `arcs` — Algorand Request for Comments
- `sdks` — Software Development Kits
- `algokit` — AlgoKit
- `algokit-utils` — AlgoKit Utils
- `tealscript` — TEALScript
- `puya` — Puya compiler
- `liquid-auth` — Liquid Auth
- `python` — Python Development
- `developers` — Developer Documentation
- `clis` — CLI Tools
- `nodes` — Node Management
- `details` — Developer Details

---

## Compile and Disassemble TEAL

### Compile TEAL
```
compile_teal {
  "source": "#pragma version 10\nint 1\nreturn",
  "network": "testnet"
}
```

### Disassemble TEAL bytecode
```
disassemble_teal {
  "bytecode": "[base64_bytecode_from_compile]",
  "network": "testnet"
}
```

---

## Encode/Decode Objects (msgpack)

### Encode to msgpack
```
encode_obj {
  "obj": { "key": "value", "num": 42 }
}
```

### Decode from msgpack
```
decode_obj {
  "bytes": "[base64_msgpack_string]"
}
```

---

## Using External Keys (Non-Wallet Signing)

When a user provides their own secret key instead of using the wallet:

### Step 1: Build transaction
```
make_payment_txn {
  "from": "[sender_address]",
  "to": "[receiver_address]",
  "amount": 1000000,
  "network": "testnet"
}
```

### Step 2: Sign with external key
```
sign_transaction {
  "transaction": { "...transaction from step 1..." },
  "sk": "[hex_encoded_secret_key]"
}
```

### Step 3: Submit
```
send_raw_transaction {
  "signedTxns": ["[base64_blob_from_step_2]"],
  "network": "testnet"
}
```

### Step 4: Present transaction ID to user

Show the txID with explorer link:
- **Testnet**: `https://lora.algokit.io/testnet/transaction/{txId}`
- **Mainnet**: `https://allo.info/tx/{txId}`

---

## Top-Up QR Code (Insufficient Funds)

When balance is insufficient, generate an ARC-26 QR code for easy funding:

```
generate_algorand_qrcode {
  "address": "[wallet_address]",
  "amount": 5000000,
  "note": "Fund account for transaction"
}
```

The response includes `qr` (UTF-8 text QR code), `uri` (the `algorand://` URI), `link` (shareable hosted QR URL via QRClaw), and `expires_in` (link validity period). Share the link or display the QR code for scanning with any Algorand-compatible wallet.

---

## Simulate Before Submitting

### Simulate a transaction to check for errors
```
simulate_transactions {
  "txnGroups": [ "...transaction group..." ],
  "allowEmptySignatures": true,
  "allowMoreLogging": true,
  "network": "testnet"
}
```

This lets you verify a transaction will succeed before actually submitting it.

---

## x402 Payment Workflow

Use the two algorand-mcp x402 tools to access x402-protected HTTP resources. The MCP tools handle transaction construction, signing, base64 encoding, and PAYMENT-SIGNATURE assembly internally — you do not build the payment payload manually.

### Step 1 — Discover (probe; no payment)

```
x402_discover_payment_requirements {
  baseURL: "https://example.x402.goplausible.xyz",
  path: "/avm/weather",
  method: "GET"
}
```

Returns the server's `accepts[]` array. Each entry has:
- `scheme` — payment scheme (e.g., `"exact"`)
- `network` — CAIP-2 network identifier (`algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=` for testnet, `algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=` for mainnet)
- `amount` (V2) or `maxAmountRequired` (V1) — amount to pay in atomic units
- `asset` — `"0"` for native ALGO, or ASA ID as string (USDC: `"10458941"` testnet / `"31566704"` mainnet)
- `payTo` — recipient address
- `extra.feePayer` — facilitator address that sponsors transaction fees

May also include `extensions` (e.g., Bazaar resource metadata).

### Step 2 — Select and confirm

Read the response. Pick the `accepts[]` entry you'll pay with:
- Filter to Algorand-satisfiable entries (CAIP-2 network starts with `algorand:`)
- Prefer the network the user expects (`testnet` for development, `mainnet` for production)
- Pick the cheapest affordable entry — compare against your budget cap
- **On mainnet: confirm the cost with the user** before proceeding

USDC amounts are in atomic units. 1,000,000 atomic units = $1.00 (USDC has 6 decimals).

### Step 3 — Pay and fetch

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

| Argument | Purpose |
|---|---|
| `baseURL`, `path`, `method` | Same as step 1 — the request to retry with payment |
| `paymentRequirements` | Pre-fetched `accepts[]` from step 1; skips re-discovery |
| `preferredNetwork` | `"mainnet"` / `"testnet"` / `"localnet"` — narrows requirement selection to this network. If omitted, the tool picks the cheapest affordable Algorand requirement across all networks in `accepts[]`. |
| `maxAmountPerRequest` | Hard budget cap in atomic units; tool refuses if cheapest requirement exceeds |
| `correlationId` | Optional — forwarded as `X-Correlation-ID` header |
| `headers`, `body`, `queryParams` | Optional — extra HTTP request bits |
| `extensions` | Optional — passed through verbatim into the response's `extensions` field for traceability. Useful when the agent already fetched Bazaar metadata via `bazaar_get_resource_details` and wants to attach it to the payment record. |

The tool runs internally:
1. Selects the requirement (by `preferredNetwork` if given, otherwise cheapest Algorand entry within `maxAmountPerRequest`)
2. Looks up the active wallet account + secret key
3. Builds a 2-txn atomic group: facilitator fee-payer (fee = N × 1000) + wallet payment (fee = 0)
4. Signs the payment leg with the active wallet — leaves fee-payer unsigned (facilitator signs server-side)
5. Encodes the unsigned fee-payer + signed payment as base64, assembles the PAYMENT-SIGNATURE JSON, base64-encodes it for the header
6. Resends the request with `PAYMENT-SIGNATURE` set
7. On 200: parses the settlement readback from `payment-response` header
8. On 402-rejection: throws `InvalidRequest` with a snippet of the server's rejection body

### Response shape

```json
{
  "result": <parsed JSON body from the protected resource>,
  "status": 200,
  "paymentResponse": { "tx": "TXID...", ... },
  "paid": {
    "network": "testnet",
    "asset": "10458941",
    "amount": "1000",
    "payTo": "ABC..."
  },
  "extensions": <whatever was passed in>
}
```

### Faster unsupervised pattern

Skip step 1. Call `make_http_request_with_x402 { baseURL, path, method }` directly and let it discover internally. The tool picks the cheapest affordable Algorand requirement automatically. **Always pass `maxAmountPerRequest`** as a budget guardrail; pass `preferredNetwork` to pin testnet/mainnet.

### Common x402 Errors

| Error | Cause | Solution |
|-------|-------|---------|
| `paymentRequirements[N] must be an OBJECT (got ...)` | A non-object value (string, array, null) was placed inside the `paymentRequirements` array — usually because a sibling argument like `preferredNetwork` was mistakenly inserted into the array | Pass the `accepts[]` entries verbatim from step 1. Keep `preferredNetwork`, `maxAmountPerRequest`, etc. as top-level siblings of `paymentRequirements`, not array members |
| `paymentRequirements[N] is missing required string field(s): ...` | An object inside `paymentRequirements` doesn't have one of the required fields (`network`, `payTo`, `asset`, and `amount` or `maxAmountRequired`) | Make sure each array entry is an unmodified `accepts[]` object from `x402_discover_payment_requirements`. Don't synthesize or hand-edit these entries |
| `Endpoint did not return an x402 payment requirement` | The URL isn't x402-protected, or the server's 402 response was malformed | Verify the endpoint with `x402_discover_payment_requirements` first; if it returns `x402: false`, use a non-x402 HTTP tool |
| `No payment requirement is satisfiable on Algorand` | The endpoint only accepts non-Algorand networks (e.g., Base/Solana) | Use a different endpoint, or check whether the user expected this to be Algorand-payable |
| `All Algorand payment requirements exceed maxAmountPerRequest=N` | The cheapest cost exceeds your budget cap | Either raise `maxAmountPerRequest` (after confirming with the user on mainnet), or skip the resource |
| `Payment requirement is missing extra.feePayer` | Server's `accepts[]` entry is missing the facilitator address | Server-side misconfiguration; contact the resource provider |
| `Payment rejected by server: <snippet>` | Facilitator rejected the signed payment — usually expired transaction window or stale `suggestedParams` | Retry once with a fresh call; if still failing, inspect the snippet for the specific reason |
| `Active wallet not found` / `Could not load active account` | No active account in `wallet.db` or no mnemonic in the keychain | Run `wallet_get_info`; if no account, `add_account` or `import_account` |

---

## x402 Bazaar Discovery Workflow

Three read-only tools that query the discovery directory hosted by the configured facilitator (`facilitator.goplausible.xyz` by default; override on the MCP server with the `BAZAAR_BASE_URL` env var). Use them to find paid resources cataloged across the x402 ecosystem before calling `make_http_request_with_x402`.

### Step 1 — Browse or search

**Browse the whole catalog filtered by network:**
```
bazaar_list {
  network: "algorand-mainnet",
  limit: 20
}
```

**Keyword search with a budget cap:**
```
bazaar_search {
  query: "weather",
  network: "algorand-mainnet",
  maxUsdPrice: 0.10,
  limit: 10
}
```

**Both** return a `count` plus an `items[]` array. Each item is a summary by default:
```json
{
  "resourceUrl": "https://api.iomarkets.ai/v1/proof/price",
  "method": "GET",
  "description": "Signed point-in-time price attestation",
  "merchantId": "RFpVTDdKQVBRVVZUMllEWEc0S1RPQ09T",
  "algorandPayable": true,
  "algorandAccepts": [
    {
      "network": "algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=",
      "mcpNetwork": "mainnet",
      "scheme": "exact",
      "amount": "10000",
      "asset": "31566704",
      "payTo": "DZUL...",
      "usdPrice": 0.01
    }
  ],
  "totalAcceptedNetworks": 1,
  "otherNetworks": [],
  "hasDiscoveryInfo": true,
  "popularity": { "verifyCount": 1, "settleCount": 2 },
  "firstSeen": "2026-06-20T22:04:55.570Z",
  "lastSeen": "2026-06-20T22:12:00.420Z",
  "id": "R0VUOmh0dHBzOi8v..."
}
```

Pass `full: true` to `bazaar_list` to get the verbatim facilitator response (full `accepts[]` plus `discoveryInfo` with input/output JSON schema). Larger, useful when you need the schema to construct a correct request.

### Step 2 — Confirm with the user (mainnet)

Show the user: the resource URL, description, USD price, payTo, and network. Wait for explicit confirmation before paying.

### Step 3 — Pay using the chosen resource

Two options:

**A. Pay using the URL only** (`make_http_request_with_x402` re-probes the endpoint):
```
make_http_request_with_x402 {
  baseURL: "https://api.iomarkets.ai",
  path: "/v1/proof/price",
  method: "GET",
  preferredNetwork: "mainnet",
  maxAmountPerRequest: 10000
}
```

**B. Pay using the Bazaar-fetched accepts[]** (skips the per-endpoint discovery probe):
```
make_http_request_with_x402 {
  baseURL: "https://api.iomarkets.ai",
  path: "/v1/proof/price",
  method: "GET",
  paymentRequirements: <accepts[] from bazaar_get_resource_details>,
  preferredNetwork: "mainnet",
  maxAmountPerRequest: 10000
}
```

Option B is faster (one HTTP round-trip instead of two) when you already have the `accepts[]` from a Bazaar call. Get the full `accepts[]` from `bazaar_get_resource_details` (the summary returned by `bazaar_list` / `bazaar_search` strips non-Algorand entries — use the get-details tool when you need the full shape).

### bazaar_get_resource_details — fetch one by URL

```
bazaar_get_resource_details {
  resource: "https://api.iomarkets.ai/v1/proof/price"
}
```

Returns the verbatim resource record (full `accepts[]`, `discoveryInfo`, popularity counters). Throws `-32600 No Bazaar resource found with resourceUrl=…` if no exact match (with partial-match count for context).

### bazaar_list filters

| Argument | Purpose |
|---|---|
| `network` | Friendly name (`"algorand-mainnet"`, `"algorand-testnet"`, `"algorand-localnet"`, or bare `"mainnet"`/`"testnet"`/`"localnet"`) OR raw CAIP-2 (`"algorand:wGHE2Pw…"`, `"eip155:84532"`, `"solana:EtWT…"`). Friendly names are translated; raw CAIP-2 passes through. |
| `method` | Filter by HTTP method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`). |
| `merchantId` | Filter by merchant id. |
| `limit` | Results per page (default 50, max 100). |
| `offset` | Pagination offset. |
| `full` | `true` to return the verbatim facilitator response per item (large); `false` (default) for the compact summary. |

### bazaar_search filters

All bazaar_list params apply, plus:

| Argument | Server-side or client-side | Purpose |
|---|---|---|
| `query` (required) | server | Keyword (min 1 char) — matched against URL and description. |
| `limit` | server (forwarded), client (final cap) | 1..20, default 10. Tool over-fetches server-side to allow client-side filtering. |
| `includeTestnets` | client | Default `false` (mainnet-only). Set `true` to include testnet/devnet entries. |
| `scheme` | client | `"exact"` or `"upto"` — only return resources whose `accepts[]` includes this payment scheme. |
| `maxUsdPrice` | client | USD cap (computed from `amount` + `extra.decimals`, assumes USDC-like pricing). Excludes resources whose cheapest entry exceeds. |
| `asset` | client | Only return resources whose `accepts[]` includes this asset id. |
| `payTo` | client | Only return resources whose `accepts[]` includes this recipient. |
| `extensions` | client | Only return resources whose `discoveryInfo` / extensions object contains this key (e.g. `"bazaar"`, `"outputSchema"`). |

### Common Bazaar Errors

| Error | Cause | Solution |
|-------|-------|---------|
| `\`query\` is required and must be a non-empty string` | `bazaar_search` called without `query` or with empty string | Provide at least 1 char in `query` |
| `\`limit\` must be between 1 and 20` | `bazaar_search` `limit` out of range | Clamp the value or omit it (default is 10) |
| `\`resource\` is not a valid URL: …` | `bazaar_get_resource_details` got a non-URL string | Pass the exact resourceUrl as displayed in `bazaar_list` / `bazaar_search` results |
| `No Bazaar resource found with resourceUrl=…` | `bazaar_get_resource_details` couldn't find an exact match — the resource may not be cataloged in the Bazaar (e.g., test fixtures aren't always registered) | Use `bazaar_search` with a substring of the URL to find what IS cataloged, or call `make_http_request_with_x402` directly (it can pay endpoints that aren't in the Bazaar) |
| `Bazaar request failed (5xx) for /discovery/resources?...` | Facilitator is down or degraded | Retry; if persistent, the facilitator is having an outage — fall back to direct calls via `make_http_request_with_x402` if the agent already knows the endpoint URL |
