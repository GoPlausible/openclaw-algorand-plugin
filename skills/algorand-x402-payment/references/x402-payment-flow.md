# x402 Runtime Payment Flow

Recipes for paying x402-protected resources from OpenClaw using the algorand-mcp x402 tools.

The MCP server handles transaction construction, signing, header assembly, and retry **internally**. Your job is to call the right tool with the right arguments. The 12-step manual flow (build fee-payer txn → build payment txn → assign group → sign payment → encode fee-payer → construct PAYMENT-SIGNATURE → base64-encode → retry) collapses to **one or two tool calls**.

---

## Pattern 1 — Direct call (fastest, trusted endpoint)

**When**: agent knows the endpoint URL, the cost is bounded by a sensible cap, the user has already opted into the payment asset.

```
make_http_request_with_x402 {
  baseURL: "https://example.x402.goplausible.xyz",
  path: "/avm/weather",
  method: "GET",
  preferredNetwork: "testnet",
  maxAmountPerRequest: 10000
}
```

**What happens internally** (you don't do any of this):
1. Tool sends a probe GET → server returns 402 with `payment-required` header
2. Tool parses `accepts[]`, filters to Algorand-payable entries
3. Tool picks the cheapest entry within `maxAmountPerRequest` on `preferredNetwork`
4. Tool reads the active wallet's secret key from `wallet.db`
5. Tool builds the atomic 2-transaction group:
   - Index 0: facilitator fee-payer (sender=facilitator, amount=0, fee=2000 µAlgo, flatFee=true)
   - Index 1: payment (sender=wallet, amount=requirement.amount, fee=0, flatFee=true)
6. Tool signs index 1 with the wallet (index 0 stays unsigned — facilitator signs server-side)
7. Tool encodes the group + chosen `accepts[]` entry into the PAYMENT-SIGNATURE JSON, base64-encodes it
8. Tool retries the request with the `PAYMENT-SIGNATURE` header
9. Tool returns the resource body plus a `paid` summary

**Returns**:
```json
{
  "result": { "report": { "weather": "sunny", "temperature": 70 } },
  "status": 200,
  "paymentResponse": { ... },
  "paid": { "network": "testnet", "asset": "10458941", "amount": "1000", "payTo": "MPY5..." },
  "_atomicUnitsNote": "USDC amounts are expressed in atomic units. 1,000,000 atomic units = $1.00 USDC (USDC has 6 decimals)."
}
```

---

## Pattern 2 — Discover, then pay (recommended default)

**When**: agent wants to see the cost before committing, OR multiple `accepts[]` entries exist and you want to pick deliberately.

### Step 1 — Probe the endpoint

```
x402_discover_payment_requirements {
  baseURL: "https://example.x402.goplausible.xyz",
  path: "/avm/weather",
  method: "GET"
}
```

Returns:
```json
{
  "result": {
    "status": 402,
    "x402": true,
    "x402Version": 2,
    "accepts": [
      {
        "scheme": "exact",
        "network": "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
        "amount": "1000",
        "asset": "10458941",
        "payTo": "MPY54CLPH2OKEGC6S5N2LDAFDNO5BVNV532NBZ5VD6GOND3STPNXZYXOFE",
        "maxTimeoutSeconds": 300,
        "extra": { "name": "USDC", "decimals": 6, "feePayer": "ZMFK..." }
      }
    ]
  }
}
```

If `x402: false`, the endpoint is not x402-protected. Use a normal HTTP tool instead.

### Step 2 — Inspect and confirm

Compute the USD cost in your reasoning: `amount / 10^decimals`. For the example above: `1000 / 10^6 = $0.001`.

On mainnet, present the cost, payTo, and resource description to the user and wait for explicit confirmation before step 3.

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

Passing `paymentRequirements` from step 1 skips the internal re-probe (one HTTP round-trip instead of two).

---

## Pattern 3 — Bazaar discovery, then pay (find-then-pay)

**When**: user describes what they want (e.g. "find me a paid weather API") but you don't know the URL.

### Step 1 — Search the Bazaar catalog

```
bazaar_search {
  query: "weather",
  network: "algorand-mainnet",
  maxUsdPrice: 0.10,
  limit: 5
}
```

Returns a `count` and `items[]`. Each item is a compact summary:
```json
{
  "resourceUrl": "https://api.iomarkets.ai/v1/proof/price",
  "method": "GET",
  "description": "Signed point-in-time price attestation",
  "algorandPayable": true,
  "algorandAccepts": [{
    "network": "algorand:wGHE2Pw...",
    "mcpNetwork": "mainnet",
    "scheme": "exact",
    "amount": "10000",
    "asset": "31566704",
    "payTo": "DZUL...",
    "usdPrice": 0.01
  }],
  "totalAcceptedNetworks": 1,
  "popularity": { "verifyCount": 1, "settleCount": 2 },
  "firstSeen": "...",
  "lastSeen": "..."
}
```

Items with `algorandPayable: false` are skipped by this MCP — they only accept non-Algorand networks.

### Step 2 — Confirm with user

Show the user: the resource URL, description, USD price, payTo, and network. Wait for explicit confirmation.

### Step 3 — Fetch full details (optional, but recommended)

The `algorandAccepts` in the search summary strips non-Algorand entries and renames fields. To get the verbatim `accepts[]` that you can pass to `make_http_request_with_x402`:

```
bazaar_get_resource_details {
  resource: "https://api.iomarkets.ai/v1/proof/price"
}
```

Returns the full verbatim record with the complete `accepts[]` array.

### Step 4 — Pay

```
make_http_request_with_x402 {
  baseURL: "https://api.iomarkets.ai",
  path: "/v1/proof/price",
  method: "GET",
  paymentRequirements: <accepts[] from step 3>,
  preferredNetwork: "mainnet",
  maxAmountPerRequest: 100000
}
```

You can also call `make_http_request_with_x402` directly without step 3 — the tool will re-probe the endpoint to get fresh requirements. Skipping step 3 trades a slightly slower call (extra round-trip) for less agent reasoning.

---

## Bazaar tools — what each one does

### bazaar_list — browse the whole catalog

```
bazaar_list {
  network: "algorand-mainnet",   // optional; friendly or CAIP-2
  method: "GET",                 // optional
  merchantId: "...",             // optional
  limit: 50,                     // default 50, max 100
  offset: 0,                     // pagination
  full: false                    // default false (summary); true for verbatim
}
```

**Network values**: friendly names (`"algorand-mainnet"`, `"algorand-testnet"`, `"algorand-localnet"`, or bare `"mainnet"`/`"testnet"`/`"localnet"`) are translated to CAIP-2 server-side; raw CAIP-2 strings pass through unchanged.

### bazaar_search — keyword search with filters

```
bazaar_search {
  query: "...",                  // required, min 1 char
  limit: 10,                     // 1..20, default 10
  network: "algorand-mainnet",   // optional
  includeTestnets: false,        // default false (mainnet-only)
  scheme: "exact",               // optional client filter
  maxUsdPrice: 0.10,             // optional client filter
  asset: "31566704",             // optional client filter
  payTo: "ALGO_ADDRESS",         // optional client filter
  extensions: "bazaar"           // optional client filter
}
```

Server-side: `query`, `network`. Client-side post-filters: `includeTestnets`, `scheme`, `maxUsdPrice`, `asset`, `payTo`, `extensions`. `maxUsdPrice` is computed from `amount + extra.decimals` (assumes USDC-like pricing).

### bazaar_get_resource_details — fetch one by exact URL

```
bazaar_get_resource_details {
  resource: "https://api.iomarkets.ai/v1/proof/price"
}
```

Returns the verbatim record. Throws `-32600 No Bazaar resource found with resourceUrl=...` if no exact match.

---

## Common Errors

| Error | Cause | Recovery |
|-------|-------|----------|
| `Endpoint did not return an x402 payment requirement (status N)` | URL isn't x402-protected, or 402 was malformed | Use a normal HTTP tool, or pass `paymentRequirements` explicitly |
| `No payment requirement is satisfiable on Algorand. Endpoint accepts networks: [...]` | Endpoint only accepts non-Algorand chains (Base/Solana) | Use a different endpoint, or tell user the resource isn't Algorand-payable |
| `All Algorand payment requirements exceed maxAmountPerRequest=N. Cheapest: M` | Endpoint costs more than your budget cap | Raise `maxAmountPerRequest` (mainnet: confirm with user) or skip |
| `paymentRequirements[N] must be an OBJECT (got string: "preferredNetwork")` | Sibling argument got placed inside the array | Move `preferredNetwork` / `maxAmountPerRequest` to top-level; keep `paymentRequirements` as `[ {...} ]` |
| `paymentRequirements[N] is missing required string field(s): ...` | Hand-crafted entry is missing `scheme`/`network`/`payTo`/`asset`/`amount` | Pass the `accepts[]` array verbatim from discover or bazaar_get_resource_details |
| `Payment requirement is missing extra.feePayer` | Server's `accepts[]` entry is missing the facilitator address | Server-side misconfiguration; contact the resource provider |
| `Payment rejected by server: <snippet>` | Facilitator rejected the signed payment — usually expired window, insufficient balance, or not opted in | Inspect the snippet; do NOT retry blindly |
| `No active account` / `Could not load active account` | No wallet account configured | `wallet_get_info` → if empty, `wallet_add_account` |
| `Asset hasn't been opted in` | Wallet not opted into the payment ASA | `wallet_optin_asset { assetId: 10458941, network: "testnet" }` |
| `No Bazaar resource found with resourceUrl=...` | `bazaar_get_resource_details` couldn't find an exact match | Use `bazaar_search` with a URL substring, or call `make_http_request_with_x402` directly (it can pay endpoints not in the Bazaar) |
| `Bazaar request failed (5xx) for /discovery/...` | Facilitator is down or degraded | Retry; if persistent, fall back to direct `make_http_request_with_x402` calls |

---

## Worked Example — Pay for testnet weather

```
1. make_http_request_with_x402 {
     baseURL: "https://example.x402.goplausible.xyz",
     path: "/avm/weather",
     method: "GET",
     preferredNetwork: "testnet",
     maxAmountPerRequest: 10000
   }

2. Tool returns:
   {
     "result": { "report": { "weather": "sunny", "temperature": 70 } },
     "status": 200,
     "paid": { "network": "testnet", "asset": "10458941", "amount": "1000", "payTo": "MPY5..." }
   }

3. Tell user: "Paid $0.001 USDC on testnet for the weather data. It's sunny and 70°F."
```

One tool call. The MCP did the discovery, transaction construction, signing, header construction, and retry internally.

---

## Migration note (from the old manual flow)

Previously this skill documented a 12-step recipe (`curl` → parse 402 → `wallet_get_info` → `make_payment_txn` × 2 → `assign_group_id` → `wallet_sign_transaction` → `encode_unsigned_transaction` → hand-construct PAYMENT-SIGNATURE → base64-encode → `curl -H`). That flow still works but is **superseded by `make_http_request_with_x402`**, which does all of it internally with proper validation and error handling.

The manual flow's main use cases now are:
- Educational understanding (see [x402-payment-reference.md](x402-payment-reference.md) for what the MCP tool does under the hood)
- Building x402 payment apps **outside** OpenClaw (e.g., a server-side facilitator or paywall) where the algorand-mcp tools aren't available

Inside OpenClaw with algorand-mcp loaded, always prefer `make_http_request_with_x402`.
