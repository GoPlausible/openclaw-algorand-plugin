# Algorand Remote MCP (Full) - Workflow Examples

> All examples use Algorand Mainnet. USDC ASA ID: 31566704

## ALGO Payment Workflow

### Step 1: Get wallet info
```
use_tool: wallet_get_info
parameters: {}
```

### Step 2: Create payment transaction
```
use_tool: sdk_txn_payment_transaction
parameters: {
  "sender": "[sender_address]",
  "receiver": "[receiver_address]",
  "amount": 1000000,
  "note": "Payment note (optional)"
}
```
> Amount in microAlgos: 1 ALGO = 1,000,000 microAlgos

### Step 3: Sign the transaction
```
use_tool: wallet_sign_transaction
parameters: {
  "encodedTxn": "[encoded_transaction_from_step_2]"
}
```

### Step 4: Submit the transaction
```
use_tool: sdk_submit_transaction
parameters: {
  "signedTxn": "[signed_transaction_from_step_3]"
}
```

---

## Asset Opt-In Workflow

### Step 1: Get wallet info
```
use_tool: wallet_get_info
parameters: {}
```

### Step 2: Check if already opted in (optional)
```
use_tool: algod_get_account_asset_info
parameters: {
  "address": "[sender_address]",
  "assetId": 31566704
}
```

### Step 3: Create opt-in transaction
```
use_tool: sdk_txn_asset_optin
parameters: {
  "address": "[sender_address]",
  "assetID": 31566704
}
```

### Step 4: Sign
```
use_tool: wallet_sign_transaction
parameters: {
  "encodedTxn": "[encoded_transaction_from_step_3]"
}
```

### Step 5: Submit
```
use_tool: sdk_submit_transaction
parameters: {
  "signedTxn": "[signed_transaction_from_step_4]"
}
```

---

## Asset Transfer Workflow

### Step 1: Get wallet info
```
use_tool: wallet_get_info
parameters: {}
```

### Step 2: Check asset verification (recommended)
```
use_tool: pera_asset_verification_status
parameters: {
  "assetId": 31566704
}
```

### Step 3: Get detailed asset info (optional)
```
use_tool: pera_verified_asset_details
parameters: {
  "assetId": 31566704
}
```

### Step 4: Check sender's asset balance
```
use_tool: algod_get_account_asset_info
parameters: {
  "address": "[sender_address]",
  "assetId": 31566704
}
```

### Step 5: Verify recipient has opted in
```
use_tool: algod_get_account_asset_info
parameters: {
  "address": "[recipient_address]",
  "assetId": 31566704
}
```

### Step 6: Create asset transfer
```
use_tool: sdk_txn_transfer_asset
parameters: {
  "sender": "[sender_address]",
  "receiver": "[recipient_address]",
  "assetID": 31566704,
  "amount": 1000000
}
```

### Step 7: Sign
```
use_tool: wallet_sign_transaction
parameters: {
  "encodedTxn": "[transaction_from_step_6]"
}
```

### Step 8: Submit
```
use_tool: sdk_submit_transaction
parameters: {
  "signedTxn": "[signed_transaction_from_step_7]"
}
```

---

## USDC Opt-In Example

### Step 1: Get wallet info
```
use_tool: wallet_get_info
parameters: {}
```

### Step 2: Check if already opted in
```
use_tool: algod_get_account_asset_info
parameters: {
  "address": "[sender_address]",
  "assetId": 31566704
}
```

### Step 3: Create USDC opt-in (if not opted in)
```
use_tool: sdk_txn_asset_optin
parameters: {
  "address": "[sender_address]",
  "assetID": 31566704
}
```

### Step 4: Sign
```
use_tool: wallet_sign_transaction
parameters: {
  "encodedTxn": "[transaction_from_step_3]"
}
```

### Step 5: Submit
```
use_tool: sdk_submit_transaction
parameters: {
  "signedTxn": "[signed_transaction_from_step_4]"
}
```

### Step 6: Inform user
User can now receive USDC on Algorand.

---

## USDC Transfer Example

### Step 1: Get wallet info
```
use_tool: wallet_get_info
parameters: {}
```

### Step 2: Check sender's USDC balance
```
use_tool: algod_get_account_asset_info
parameters: {
  "address": "[sender_address]",
  "assetId": 31566704
}
```

### Step 3: Verify recipient opted in
```
use_tool: algod_get_account_asset_info
parameters: {
  "address": "[recipient_address]",
  "assetId": 31566704
}
```

### Step 4: Create transfer (6 decimals)
```
use_tool: sdk_txn_transfer_asset
parameters: {
  "sender": "[sender_address]",
  "receiver": "[recipient_address]",
  "assetID": 31566704,
  "amount": 1000000
}
```

### Step 5: Sign
```
use_tool: wallet_sign_transaction
parameters: {
  "encodedTxn": "[transaction_from_step_4]"
}
```

### Step 6: Submit
```
use_tool: sdk_submit_transaction
parameters: {
  "signedTxn": "[signed_transaction_from_step_5]"
}
```

---

## Atomic Transaction Group Workflow

### Step 1: Create atomic group
```
use_tool: sdk_create_atomic_group
parameters: {
  "transactions": [
    { "type": "pay", "params": {...} },
    { "type": "axfer", "params": {...} }
  ]
}
```

### Step 2: Sign group
```
use_tool: wallet_sign_atomic_group
parameters: {
  "encodedTxns": ["txn1", "txn2"],
  "keyName": ["key1", "key2"]
}
```

### Step 3: Submit group
```
use_tool: sdk_submit_atomic_group
parameters: {
  "signedTxns": ["signedTxn1", "signedTxn2"]
}
```

> For manual grouping, use `sdk_assign_group_id` before signing.

---

## Using Knowledge Base (Full MCP Only)

### List documents in category
```
use_tool: list_knowledge_docs
parameters: {
  "prefix": "arcs"
}
```

### Get specific document
```
use_tool: get_knowledge_doc
parameters: {
  "name": "arcs:specs:arc-0003.md"
}
```

### Knowledge Categories
- `arcs`: Algorand Request for Comments
- `sdks`: Software Development Kits
- `algokit`: AlgoKit
- `algokit-utils`: AlgoKit Utils
- `tealscript`: TEALScript
- `puya`: Puya
- `liquid-auth`: Liquid Auth
- `python`: Python Development
- `developers`: Developer Documentation
- `clis`: CLI Tools
- `nodes`: Node Management
- `details`: Developer Details

---

## Compile TEAL (Full MCP Only)

```
use_tool: sdk_compile_teal
parameters: {
  "source": "#pragma version 8\nint 1\nreturn"
}
```

---

## Encode/Decode Objects (Full MCP Only)

### Encode to msgpack
```
use_tool: sdk_encode_obj
parameters: {
  "obj": { "key": "value" }
}
```

### Decode from msgpack
```
use_tool: sdk_decode_obj
parameters: {
  "bytes": "[base64_msgpack_string]"
}
```

---

## Top-Up QR Code (Insufficient Funds)

When balance is insufficient:

```
use_tool: generate_algorand_qrcode
parameters: {
  "address": "[wallet_address]",
  "amount": 1100000,
  "assetId": 31566704,
  "note": "Top-up for transaction"
}
```

Provide QR link to user for PeraWallet scanning.
