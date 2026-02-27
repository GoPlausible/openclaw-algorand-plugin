# Algorand Remote MCP Lite - Tool Reference

> **Network**: Algorand Mainnet
> **Server**: https://algorandmcplite.goplausible.xyz/sse
> **Signing**: Server-side (no private keys needed from agent)

## Table of Contents

1. [Wallet Management Tools](#wallet-management-tools)
2. [Account Information Tools](#account-information-tools)
3. [Transaction Generation Tools](#transaction-generation-tools)
4. [Transaction Submission Tools](#transaction-submission-tools)
5. [Asset Management Tools](#asset-management-tools)
6. [Verified Asset Tools](#verified-asset-tools)
7. [NFD API Tools](#nfd-api-tools)
8. [Utility Tools](#utility-tools)
9. [QR Code Tools](#qr-code-tools)
10. [Receipt Tools](#receipt-tools)
11. [AP2 Mandate Tools](#ap2-mandate-tools)

---

## Wallet Management Tools

### wallet_get_info
- **Purpose**: Verify wallet exists and is configured
- **Parameters**: `{}`
- **Use**: FIRST tool in EVERY session
- **Note**: If error, inform user wallet configuration is missing

### wallet_sign_transaction
- **Purpose**: Sign a single transaction
- **Parameters**: `{ "encodedTxn": string }`

### wallet_sign_atomic_group
- **Purpose**: Sign multiple transactions as atomic group
- **Parameters**: `{ "encodedTxns": string[], "keyName": string[] }`

### wallet_get_assets
- **Purpose**: Get assets held by wallet
- **Parameters**: `{}`

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
- **Use**: Verify opt-in before transfers

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
- **Note**: Amount in microAlgos (1 ALGO = 1,000,000)

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
- **Purpose**: Assign group ID to transactions for atomic execution
- **Parameters**: `{ "encodedTxns": string[] }`
- **Effect**: All transactions succeed or all fail

---

## Transaction Submission Tools

### sdk_submit_transaction
- **Purpose**: Submit signed transaction
- **Parameters**: `{ "signedTxn": string }`
- **Returns**: Transaction ID

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
- **Purpose**: Get asset configuration details
- **Parameters**: `{ "assetId": number }`

---

## Verified Asset Tools

### pera_verified_asset_query
- **Purpose**: Check asset verification status and details
- **Parameters**: `{ "assetId": number }`
- **Use**: Verify asset is not a scam before interacting

### pera_verified_assets_search
- **Purpose**: Search for verified assets
- **Parameters**: `{ "query": string }`

---

## NFD API Tools

### api_nfd_get_nfd
- **Purpose**: Get NFD (.algo name) info
- **Parameters**:
```json
{
  "name": "example.algo",
  "view": "brief" | "full",
  "includeSales": boolean
}
```
- **⚠️ CRITICAL**: Use `depositAccount` field for transactions, NOT other addresses!

### api_nfd_get_nfds_for_address
- **Purpose**: Get all NFDs owned by address
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
- **Purpose**: Validate Algorand address format
- **Parameters**: `{ "address": string }`

---

## QR Code Tools

### generate_algorand_qrcode
- **Purpose**: Generate ARC-26 payment QR code for top-ups
- **Parameters**:
```json
{
  "address": "wallet_address",
  "amount": 1100000,
  "assetId": 31566704,
  "note": "Top-up for transaction"
}
```
- **Use**: When balance insufficient, generate for PeraWallet scanning

---

## Receipt Tools

### generate_algorand_receipt
- **Purpose**: Generate receipt after successful transaction
- **Parameters**: Transaction details

---

## AP2 Mandate Tools

### generate_ap2_mandate
- **Purpose**: Generate AP2 payment mandates for agentic checkout flows
- **Parameters**: Intent/cart/payment details

---

## Error Reference

| Error | Cause | Solution |
|-------|-------|----------|
| `No active agent wallet configured` | Missing wallet | Inform user, retry |
| `Error fetching account info` | Network/invalid address | Check address format |
| `Transaction would result in negative balance` | Insufficient funds | Check MBR + fees |
| `Asset hasn't been opted in` | Missing opt-in | Opt-in first |
| `Overspend` | Fee + amount > balance | Reduce or add funds |
