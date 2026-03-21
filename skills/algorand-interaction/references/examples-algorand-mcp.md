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
  "nickname": "my-wallet",
  "allowance": 5000000,
  "dailyAllowance": 10000000
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

### Step 5: Verify (optional)
```
api_indexer_lookup_transaction_by_id {
  "txId": "[txID_from_step_3]",
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

This creates, signs, and submits the opt-in transaction in a single call.

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

When `x402_fetch` returns a 402 response, follow these steps to pay for the resource.

### Understanding the 402 Response

The 402 response contains an `accepts` array. Each entry has:
- `scheme` — payment scheme (e.g., `"exact"`)
- `network` — CAIP-2 network identifier
- `maxAmountRequired` — amount to pay (in base units)
- `asset` — `"0"` for native ALGO, or ASA ID as string
- `payTo` — recipient address
- `extra.feePayer` — facilitator address that pays transaction fees

### CAIP-2 Network Mapping

| CAIP-2 Identifier | Network |
|--------------------|---------|
| `algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=` | `testnet` |
| `algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=` | `mainnet` |

### Step 1: Check wallet
```
wallet_get_info { "network": "<network>" }
```

### Step 2: Build fee payer transaction

The facilitator sponsors fees for the entire group. The fee payer's `fee` must equal **N × 1000 µAlgo** (N = total transactions in group). For a 2-txn group: fee = 2 × 1000 = **2000**. NEVER set fee=0 on the fee payer.

```
make_payment_txn {
  "from": "<feePayer>",
  "to": "<feePayer>",
  "amount": 0,
  "fee": 2000,
  "flatFee": true,
  "network": "<network>"
}
```

### Step 3: Build payment transaction

The payment transaction fee is 0 since the facilitator covers it.

**For native ALGO (asset = "0"):**
```
make_payment_txn {
  "from": "<your_address>",
  "to": "<payTo>",
  "amount": <maxAmountRequired>,
  "fee": 0,
  "flatFee": true,
  "network": "<network>"
}
```

**For ASA (asset is an ASA ID):**
```
make_asset_transfer_txn {
  "from": "<your_address>",
  "to": "<payTo>",
  "assetIndex": <asset>,
  "amount": <maxAmountRequired>,
  "fee": 0,
  "flatFee": true,
  "network": "<network>"
}
```

### Step 4: Group the transactions
```
assign_group_id {
  "transactions": [fee_payer_txn, payment_txn]
}
```

### Step 5: Sign ONLY the payment transaction (index 1)
```
wallet_sign_transaction {
  "transaction": <grouped_payment_txn>,
  "network": "<network>"
}
```
> Leave the fee payer transaction (index 0) unsigned — the facilitator signs it server-side.

### Step 6: Encode the unsigned fee payer transaction

Convert the grouped fee payer transaction (index 0) to base64 bytes:
```
encode_unsigned_transaction {
  "transaction": <grouped_fee_payer_txn>
}
```
> This produces the canonical `algosdk.encodeUnsignedTransaction()` base64 encoding needed for the PAYMENT-SIGNATURE payload.

### Step 7: Construct the PAYMENT-SIGNATURE payload

Build this JSON string:
```json
{
  "x402Version": 2,
  "scheme": "exact",
  "network": "<CAIP-2 network identifier from accepts>",
  "payload": {
    "paymentGroup": ["<base64 from encode_unsigned_transaction>", "<base64 from wallet_sign_transaction>"],
    "paymentIndex": 1
  },
  "accepted": <the exact accepts[] entry you chose to pay with — copy it verbatim as an object>
}
```

> **Critical**: The `accepted` field is REQUIRED. It must be an exact copy of the `accepts[]` entry you chose (including all fields: scheme, network, price, payTo, asset, maxAmountRequired, extra, etc.). Without it, the server cannot match your payment to a requirement and will reject with 402.

> **CRITICAL — Base64 blob handling**: When building the `paymentGroup` array, you MUST use the EXACT `bytes` value from `encode_unsigned_transaction` and the EXACT `blob` value from `wallet_sign_transaction`. NEVER manually re-type, truncate, or partially copy these base64 strings. Even a single character corruption (e.g., `5` → `4`) causes "signature does not match sender" errors. Copy each complete blob verbatim — do not attempt to reconstruct or abbreviate them.

### Step 8: Retry with payment

Call `x402_fetch` again with `paymentHeader` set to the JSON string from Step 7.
The `x402_fetch` tool will base64-encode it and send it as the `PAYMENT-SIGNATURE` header.
The server verifies the payment, submits the transaction group, and returns the resource.

> **Important**: The `paymentGroup` array order must match: index 0 = unsigned fee payer txn, index 1 = signed payment txn. The `paymentIndex` indicates which transaction carries the actual payment.

### Common x402 Errors

| Error | Cause | Solution |
|-------|-------|---------|
| `Payment transaction signature does not match sender` | Base64 blob was corrupted when constructing `paymentHeader` JSON | Use EXACT `bytes`/`blob` values from tool responses — never re-type or partially copy base64 strings |
| `402` returned despite payment header | Missing `accepted` field in payload, or `accepted` doesn't match an `accepts[]` entry exactly | Copy the chosen `accepts[]` entry verbatim into the `accepted` field |
| `402` with expired transactions | Too much time between building transactions and sending payment | Rebuild transactions immediately before sending — `firstValid`/`lastValid` window is ~1000 rounds |
| `Simulation failed` | Insufficient balance, asset not opted in, or group structure wrong | Check USDC/ALGO balance, verify opt-in, ensure group order is [feePayer, payment] |
