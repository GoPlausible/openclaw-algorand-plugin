# Algorand Remote MCP (Full) - Tool Reference

> **Network**: Algorand Mainnet
> **Server**: https://algorandmcp.goplausible.xyz/sse
> **Signing**: Server-side (no private keys needed from agent)

## Table of Contents

1. [Wallet Management Tools](#wallet-management-tools)
2. [Account Information Tools](#account-information-tools)
3. [Transaction Generation Tools](#transaction-generation-tools)
4. [Transaction Submission Tools](#transaction-submission-tools)
5. [Asset Management Tools](#asset-management-tools)
6. [Verified Asset Tools](#verified-asset-tools)
7. [Application Management Tools](#application-management-tools)
8. [NFD API Tools](#nfd-api-tools)
9. [Utility Tools](#utility-tools)
10. [Knowledge Tools](#knowledge-tools)
11. [QR Code Tools](#qr-code-tools)

---

## Wallet Management Tools

### wallet_get_info
- **Purpose**: Verify wallet exists and is configured
- **Parameters**: `{}`
- **Use**: FIRST tool in EVERY session

### wallet_get_address
- **Purpose**: Get wallet address
- **Parameters**: `{}`

### wallet_get_publickey
- **Purpose**: Get wallet public key
- **Parameters**: `{}`

### wallet_sign_transaction
- **Purpose**: Sign a single transaction
- **Parameters**: `{ "encodedTxn": string }`

### wallet_sign_atomic_group
- **Purpose**: Sign multiple transactions as atomic group
- **Parameters**: `{ "encodedTxns": string[], "keyName": string[] }`

### wallet_get_assets
- **Purpose**: Get assets held by wallet
- **Parameters**: `{}`

### wallet_reset_account
- **Purpose**: ⚠️ DANGEROUS - Delete keys and create new ones
- **Parameters**: `{}`
- **Warning**: ALL FUNDS LOST! Transfer funds first! Confirm with user!

---

## Account Information Tools

### algod_get_account_info
- **Purpose**: Get full account information
- **Parameters**: `{ "address": string }`

### sdk_check_account_balance
- **Purpose**: Check ALGO balance
- **Parameters**: `{ "address": string }`

### algod_get_account_asset_info
- **Purpose**: Check if account holds specific asset
- **Parameters**: `{ "address": string, "assetId": number }`

---

## Transaction Generation Tools

### sdk_txn_payment_transaction
- **Purpose**: Create ALGO payment
- **Parameters**:
```json
{
  "sender": "address",
  "receiver": "address",
  "amount": 1000000,
  "note": "optional note"
}
```

### sdk_txn_asset_optin
- **Purpose**: Opt-in to receive an asset
- **Parameters**:
```json
{
  "address": "sender_address",
  "assetID": 31566704
}
```

### sdk_txn_transfer_asset
- **Purpose**: Transfer ASA tokens
- **Parameters**:
```json
{
  "sender": "address",
  "receiver": "address",
  "assetID": 31566704,
  "amount": 1000000
}
```

### sdk_create_atomic_group
- **Purpose**: Create atomic transaction group
- **Parameters**:
```json
{
  "transactions": [
    { "type": "pay", "params": {...} },
    { "type": "axfer", "params": {...} }
  ]
}
```

### sdk_assign_group_id
- **Purpose**: Assign group ID to transactions
- **Parameters**: `{ "encodedTxns": string[] }`

---

## Transaction Submission Tools

### sdk_submit_transaction
- **Purpose**: Submit signed transaction
- **Parameters**: `{ "signedTxn": string }`

### sdk_submit_atomic_group
- **Purpose**: Submit signed atomic group
- **Parameters**: `{ "signedTxns": string[] }`

### indexer_lookup_transaction_by_id
- **Purpose**: Look up transaction details
- **Parameters**: `{ "txid": string }`

### indexer_lookup_account_transactions
- **Purpose**: Get account transaction history
- **Parameters**: `{ "address": string }`

---

## Asset Management Tools

### algod_get_asset_info
- **Purpose**: Get asset configuration
- **Parameters**: `{ "assetId": number }`

### algod_get_asset_holding
- **Purpose**: Get asset holding for address
- **Parameters**: `{ "address": string, "assetId": number }`

---

## Verified Asset Tools

### pera_asset_verification_status
- **Purpose**: Check if asset is verified
- **Parameters**: `{ "assetId": number }`

### pera_verified_asset_details
- **Purpose**: Get detailed verified asset info
- **Parameters**: `{ "assetId": number }`

### pera_verified_asset_search
- **Purpose**: Search verified assets
- **Parameters**: `{ "query": string }`

---

## Application Management Tools

### sdk_txn_create_application
- **Purpose**: Deploy smart contract
- **Parameters**: Application creation params

### sdk_txn_call_application
- **Purpose**: Call smart contract method
- **Parameters**: Application call params

### sdk_txn_update_application
- **Purpose**: Update smart contract
- **Parameters**: Application update params

---

## NFD API Tools

### api_nfd_get_nfd
- **Purpose**: Get NFD info
- **Parameters**:
```json
{
  "name": "example.algo",
  "view": "brief" | "full",
  "includeSales": boolean
}
```
- **⚠️ CRITICAL**: Use `depositAccount` for transactions!

### api_nfd_get_nfds_for_address
- **Purpose**: Get NFDs owned by address
- **Parameters**:
```json
{
  "address": "ALGO_ADDRESS",
  "view": "brief" | "full",
  "limit": number,
  "offset": number
}
```

---

## Utility Tools

### sdk_validate_address
- **Purpose**: Validate Algorand address
- **Parameters**: `{ "address": string }`

### sdk_encode_obj
- **Purpose**: Encode object to msgpack
- **Parameters**: `{ "obj": any }`

### sdk_decode_obj
- **Purpose**: Decode msgpack to object
- **Parameters**: `{ "bytes": string }`

### sdk_compile_teal
- **Purpose**: Compile TEAL program
- **Parameters**: `{ "source": string }`

---

## Knowledge Tools

### list_knowledge_docs
- **Purpose**: List knowledge documents by category prefix
- **Parameters**: `{ "prefix": string }`
- **Categories**:
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

### get_knowledge_doc
- **Purpose**: Get specific knowledge document
- **Parameters**: `{ "name": string }`
- **Example**: `"arcs:specs:arc-0003.md"` or `"algokit:cli:features:tasks:analyze.md"`

---

## QR Code Tools

### generate_algorand_qrcode
- **Purpose**: Generate ARC-26 payment QR for top-ups
- **Parameters**:
```json
{
  "address": "wallet_address",
  "amount": 1100000,
  "assetId": 31566704,
  "note": "Top-up"
}
```

---

## Error Reference

| Error | Cause | Solution |
|-------|-------|----------|
| `No active agent wallet configured` | Missing wallet | Inform user |
| `Error fetching account info` | Network/invalid address | Check format |
| `Transaction would result in negative balance` | Insufficient funds | Check MBR |
| `Asset hasn't been opted in` | No opt-in | Opt-in first |
| `Cannot access knowledge resources` | R2 misconfiguration | Check setup |
| `Overspend` | Fee + amount > balance | Add funds |
