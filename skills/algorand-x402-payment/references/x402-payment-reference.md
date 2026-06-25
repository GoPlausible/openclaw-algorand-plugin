# x402 Payment Protocol Reference

This document explains what the algorand-mcp x402 tools do internally. **You do not need to construct any of these structures by hand** — `make_http_request_with_x402` assembles them for you. The content here is for understanding the protocol, debugging unusual server responses, and building x402 services that aren't behind algorand-mcp.

## Algorand x402 V2 transport

When a client requests a paid resource without paying, the server returns:

- HTTP status **402 Payment Required**
- Response body: typically `{}` (empty JSON)
- **`payment-required` HTTP header**: base64-encoded `PaymentRequiredResponse` JSON (this is where the payment requirements actually live in V2)

The `x402_discover_payment_requirements` tool reads this header first, falls back to body-based payloads (used by older or non-Algorand x402 servers), and returns the parsed `accepts[]` array.

### PaymentRequiredResponse Schema (V2)

```json
{
  "x402Version": 2,
  "error": "Payment required",
  "resource": {
    "url": "/api/data",
    "description": "Premium weather data",
    "mimeType": "application/json"
  },
  "accepts": [
    {
      "scheme": "exact",
      "network": "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
      "amount": "1000",
      "asset": "10458941",
      "payTo": "ALGORAND_ADDRESS_58_CHARS",
      "maxTimeoutSeconds": 300,
      "extra": {
        "name": "USDC",
        "decimals": 6,
        "feePayer": "FACILITATOR_ADDRESS_58_CHARS"
      }
    }
  ],
  "extensions": {
    "bazaar": {
      "info": { "input": {...}, "output": {...} },
      "schema": { ... }
    }
  }
}
```

### accepts[] Entry Fields

| Field | Type | Description |
|-------|------|-------------|
| `scheme` | `string` | Payment scheme — `"exact"` for Algorand |
| `network` | `string` | CAIP-2 identifier for the target network |
| `amount` | `string` | V2 canonical: amount in atomic units (e.g., `"1000"` = 0.001 USDC). V1 used `maxAmountRequired`; the MCP tool accepts both. |
| `payTo` | `string` | 58-char Algorand address to receive payment |
| `asset` | `string` | `"0"` for native ALGO, or ASA ID as string |
| `maxTimeoutSeconds` | `number` | Transaction validity window in seconds |
| `extra.name` | `string` | Token name (e.g., `"USDC"`) |
| `extra.decimals` | `number` | Token decimals (e.g., `6`) |
| `extra.feePayer` | `string` | Facilitator address that sponsors transaction fees |

---

## PAYMENT-SIGNATURE Header (what the MCP tool builds for you)

When `make_http_request_with_x402` retries with payment, it sends an HTTP header named `PAYMENT-SIGNATURE` whose value is base64-encoded JSON of this shape:

```json
{
  "x402Version": 2,
  "scheme": "exact",
  "network": "<CAIP-2 network identifier>",
  "payload": {
    "paymentGroup": [
      "<base64 unsigned fee payer txn (index 0)>",
      "<base64 signed payment txn (index 1)>"
    ],
    "paymentIndex": 1
  },
  "accepted": { "<verbatim copy of the chosen accepts[] entry>" }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `x402Version` | `number` | `2` for V2 |
| `scheme` | `string` | `"exact"` for Algorand |
| `network` | `string` | CAIP-2 network identifier from the chosen `accepts[]` entry |
| `payload.paymentGroup` | `string[]` | Array of base64-encoded msgpack transaction bytes (unsigned fee-payer at [0], signed payment at [1]) |
| `payload.paymentIndex` | `number` | Index of the payment transaction in the group (`1`) |
| `accepted` | `object` | **Required.** Verbatim copy of the chosen `accepts[]` entry. The server rejects with 402 if missing. |

You do not build this. `make_http_request_with_x402` reads the active wallet's secret key, signs the payment leg, encodes everything, and writes the header.

---

## CAIP-2 Network Identifiers

[CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md) format: `algorand:<base64 genesis hash>`

| Network | CAIP-2 Identifier | MCP `network` param | Friendly aliases accepted by Bazaar tools |
|---------|-------------------|---------------------|-------------------------------------------|
| Testnet | `algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=` | `"testnet"` | `"algorand-testnet"`, `"testnet"` |
| Mainnet | `algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=` | `"mainnet"` | `"algorand-mainnet"`, `"mainnet"` |
| Localnet | `algorand:localnet` (not standard CAIP-2) | `"localnet"` | `"algorand-localnet"`, `"localnet"` |

The MCP tool translates between these representations automatically:
- `make_http_request_with_x402` takes friendly names (`preferredNetwork: "testnet"`) and matches them against CAIP-2 `accepts[].network` values internally
- `bazaar_list` / `bazaar_search` accept either friendly names or raw CAIP-2 — friendly names are translated before forwarding to the facilitator

V1 legacy identifiers (`algorand-testnet`, `algorand-mainnet`) appear in older catalog entries and are auto-mapped server-side.

---

## Asset Configuration

| Asset | Testnet ASA ID | Mainnet ASA ID | Decimals | 1 whole token = |
|-------|---------------|----------------|----------|-----------------|
| ALGO | `"0"` (native) | `"0"` (native) | 6 | 1,000,000 atomic units |
| USDC | `"10458941"` | `"31566704"` | 6 | 1,000,000 atomic units |

**`amount` is always in atomic units.** For USDC (6 decimals):
- `"1000"` = 0.001 USDC = $0.001
- `"10000"` = 0.01 USDC = $0.01
- `"1000000"` = 1.00 USDC = $1.00

Compute USD price as `Number(amount) / 10^extra.decimals`.

---

## Fee Abstraction (Atomic Transaction Group)

The x402 payment is an atomic 2-transaction group where the facilitator pays all fees:

| Index | Transaction | Sender | Receiver | Amount | Fee | Signed by |
|-------|------------|--------|----------|--------|-----|-----------|
| 0 | Fee payer | Facilitator | Facilitator | 0 | 2000 µAlgo (= N × 1000 for N=2 txns) | Facilitator (server-side, during settlement) |
| 1 | Payment | Client wallet | `accepts.payTo` | `accepts.amount` | 0 | Client wallet (via MCP tool) |

- Both transactions share the same `groupID` — they execute atomically (all-or-nothing on chain).
- **Fee formula**: fee-payer fee = **N × 1000 µAlgo** (N = total txns in group). The fee-payer pays for everyone; all other txns have fee=0.
- `flatFee: true` is set on both — without it, the SDK would override fees with min-fee defaults and break the abstraction.
- The client transmits the fee-payer **unsigned**; the facilitator signs it during settlement.

`make_http_request_with_x402` builds this group correctly every time. You only need to know about it when:
- Debugging a `txgroup had 0 in fees, which is less than the minimum 2 * 1000` error (probably means the server-side facilitator misbuilt the group)
- Implementing your own x402 facilitator (use the `@x402` libraries instead of recreating this from scratch)

---

## Facilitator

Default facilitator: `https://facilitator.goplausible.xyz`

Override on the MCP server with the `BAZAAR_BASE_URL` env var (affects which facilitator the `bazaar_*` tools query; payments still use whichever facilitator the endpoint's `accepts[].extra.feePayer` points to — that's per-resource, not configurable).

The facilitator's responsibilities:
1. Receive the payment group from the resource server
2. Simulate the atomic group to verify validity
3. Sign the fee-payer transaction (index 0)
4. Submit both transactions to the Algorand network
5. Confirm finality (~3.3 seconds on Algorand)
6. Return a settlement readback (via `payment-response` header on the 200 response, decoded into the `paymentResponse` field of the tool's return value)

---

## V1 vs V2 Differences

**You must use V2.** V1 is deprecated. The MCP tool requests V2 and rejects V1 responses.

| Aspect | V1 | V2 |
|--------|----|----|
| Network identifiers | `"algorand-testnet"` (short) | CAIP-2: `"algorand:SGO1..."` |
| `x402Version` | `1` | `2` |
| Amount field name | `maxAmountRequired` | `amount` |
| `accepted` field in payment header | Optional | **Required** |
| Response transport | Body only | Header (`payment-required`) primary, body fallback |
| `extensions` (e.g., Bazaar metadata) | Not standardized | Top-level field |

The MCP tool transparently handles both — it reads `amount` first, falls back to `maxAmountRequired`. You don't need to special-case which version a server speaks.

---

## Discovery directory (Bazaar)

The facilitator hosts a discovery directory of cataloged paid resources. Use the `bazaar_*` MCP tools to query it without paying:

- **`bazaar_list`** → GET `/discovery/resources` with optional filters (`network`, `method`, `merchantId`, `limit`, `offset`). Compact summary by default; `full: true` returns verbatim records.
- **`bazaar_search`** → same endpoint with a `search` query param + client-side post-filters (`scheme`, `maxUsdPrice`, `asset`, `payTo`, `extensions`, `includeTestnets`).
- **`bazaar_get_resource_details`** → search-then-exact-match by `resourceUrl` (the facilitator has no dedicated GET-by-id endpoint, so the tool emulates one).

The `extensions.bazaar` field in a resource's `discoveryInfo` typically contains the resource's input/output JSON schema, useful for constructing a correct request to the paid endpoint after payment succeeds.

---

## When to bypass the MCP tools

The algorand-mcp x402 tools cover the common case (paying for an HTTP resource from OpenClaw). You might still need the raw protocol when:

1. **Building an x402 server / paywall**: use `@x402/server` or the Python equivalent. The MCP tools are clients, not servers.
2. **Implementing a facilitator**: use `@x402/facilitator`. Same reason.
3. **Paying from outside OpenClaw**: e.g., a CI job that fetches a paid API. Use the SDK directly.
4. **Debugging a misbehaving server**: a manual `curl` round-trip can reveal whether the issue is in your call shape, the facilitator's signing step, or the server's PAYMENT-SIGNATURE parsing. The flow document explains what to look for.

For day-to-day paid-resource access from OpenClaw, always prefer `make_http_request_with_x402`.
