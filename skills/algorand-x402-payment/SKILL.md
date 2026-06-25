---
name: algorand-x402-payment
description: Execute x402 payments at runtime using the algorand-mcp x402 tools. Use when OpenClaw encounters HTTP 402 Payment Required responses, needs to access paid APIs, wants to discover paid resources via the Bazaar directory, or the user asks to fetch x402-protected resources.
---

# x402 Runtime Payment

You (OpenClaw) pay for x402-protected HTTP resources by calling **dedicated MCP tools** that handle the entire protocol — discovery, transaction construction, signing, header assembly, and retry. You do not build payment payloads by hand.

The MCP exposes five x402-related tools, grouped into two families:

| Family | Tools | What they do |
|---|---|---|
| Payment (2) | `x402_discover_payment_requirements`, `make_http_request_with_x402` | Probe a paid endpoint for its cost, then pay + fetch in one tool call |
| Bazaar Discovery (3) | `bazaar_list`, `bazaar_search`, `bazaar_get_resource_details` | Browse / search / inspect the catalog of paid resources hosted by the facilitator (`facilitator.goplausible.xyz` by default) |

## When to Use

- HTTP response with status `402` from any endpoint
- User asks to access a paid / protected API or resource
- User mentions x402, payment-required, or paid endpoint access
- User asks "what paid APIs are available", "find me a paid X", "what does X cost"

## Tool-call syntax (OpenClaw / mcporter)

Tool examples in this skill are shown in JSON-literal style for readability:

```
make_http_request_with_x402 {
  baseURL: "...", path: "...", method: "GET",
  preferredNetwork: "testnet", maxAmountPerRequest: 10000
}
```

OpenClaw invokes these via mcporter:

```bash
mcporter call algorand-mcp.make_http_request_with_x402 --args '{
  "baseURL": "...",
  "path": "...",
  "method": "GET",
  "preferredNetwork": "testnet",
  "maxAmountPerRequest": 10000
}'
```

Both forms map to the same MCP call. See the `mcporter Syntax (Critical)` section in the `algorand-interaction` skill for full conventions including flag-style invocation.

## The Three Patterns (pick by trust level)

### Pattern 1 — Fire-and-forget (trusted endpoint, capped cost)

When the agent knows the endpoint URL and just wants the data:

```
make_http_request_with_x402 {
  baseURL: "https://example.x402.goplausible.xyz",
  path: "/avm/weather",
  method: "GET",
  preferredNetwork: "testnet",
  maxAmountPerRequest: 10000
}
```

One tool call. The tool probes for the 402, picks an Algorand entry within budget, builds the atomic group, signs the payment leg, retries, returns the resource. `maxAmountPerRequest` is the safety net — if cost exceeds it, the call fails clean.

### Pattern 2 — Inspect, then pay (recommended default)

Best for anything non-trivial. Discovery is free.

```
1. x402_discover_payment_requirements {
     baseURL: "https://example.x402.goplausible.xyz",
     path: "/avm/weather",
     method: "GET"
   }

2. Read the response — choose an accepts[] entry, confirm with user if needed

3. make_http_request_with_x402 {
     baseURL: "https://example.x402.goplausible.xyz",
     path: "/avm/weather",
     method: "GET",
     paymentRequirements: <accepts[] from step 1>,
     preferredNetwork: "testnet",
     maxAmountPerRequest: 10000
   }
```

Passing `paymentRequirements` from step 1 skips the internal re-probe (one HTTP round-trip instead of two).

### Pattern 3 — Discover via Bazaar, then pay (find-then-pay)

When the user describes what they want but you don't know the URL:

```
1. bazaar_search {
     query: "weather",
     network: "algorand-mainnet",
     maxUsdPrice: 0.10,
     limit: 5
   }

2. Show the user the top result(s); confirm; capture the chosen resourceUrl

3. bazaar_get_resource_details { resource: "<chosen resourceUrl>" }
   (optional — fetches the verbatim accepts[] for the chosen resource)

4. make_http_request_with_x402 {
     baseURL: "<base from resourceUrl>",
     path: "<path from resourceUrl>",
     method: "GET",
     paymentRequirements: <accepts[] from step 3 if you did step 3>,
     preferredNetwork: "mainnet",
     maxAmountPerRequest: 100000
   }
```

## What the MCP tool handles for you

You do **not** need to:
- Construct or base64-encode the `PAYMENT-SIGNATURE` header
- Build the fee-payer transaction (`fee = N × 1000`, `flatFee: true`)
- Build the payment transaction (`fee = 0`, `flatFee: true`)
- Assign group IDs
- Decide which transactions to sign vs. leave unsigned
- Encode unsigned transactions to base64 msgpack
- Map CAIP-2 network identifiers (`algorand:SGO1…`) to MCP networks (`testnet`)
- Retry the HTTP request with the payment header

All of this is internal to `make_http_request_with_x402`. The agent's job is only to **choose the resource, confirm cost with the user (especially on mainnet), and call the tool with the right arguments**.

## Tool argument cheatsheet

### `x402_discover_payment_requirements`
```
{ baseURL, path, method, queryParams?, body? }
```
Returns `{ result: { status, x402, x402Version, accepts: [...] }, _atomicUnitsNote }`. Read-only — no payment, no signing.

### `make_http_request_with_x402`
```
{
  baseURL,                       // required
  path,                          // required
  method,                        // required: GET | POST | PUT | DELETE | PATCH
  paymentRequirements?,          // optional: accepts[] from discover or bazaar_get_resource_details; if omitted, tool probes internally
  preferredNetwork?,             // "mainnet" | "testnet" | "localnet"; if omitted, cheapest affordable Algorand entry is chosen
  maxAmountPerRequest?,          // integer in atomic units; budget cap
  queryParams?, body?, headers?, // optional HTTP bits
  correlationId?,                // optional X-Correlation-ID
  extensions?                    // optional pass-through, traceability only
}
```

### `bazaar_list`
```
{ network?, method?, merchantId?, limit?, offset?, full? }
```
Default: compact summary (URL, description, Algorand-payable accepts only, popularity). `full: true` returns the verbatim record per item. `network` accepts friendly names (`"algorand-mainnet"`, `"mainnet"`, etc.) or raw CAIP-2.

### `bazaar_search`
```
{
  query,                  // required, min 1 char
  limit?,                 // 1..20, default 10
  network?,
  includeTestnets?,       // default false (mainnet-only)
  scheme?,                // "exact" | "upto" — client-side filter
  maxUsdPrice?,           // USD cap, client-side filter (computed from amount + decimals)
  asset?, payTo?,         // client-side filters
  extensions?             // require discoveryInfo / specific extension key
}
```

### `bazaar_get_resource_details`
```
{ resource }  // exact resourceUrl
```
Returns the verbatim resource record with full `accepts[]`, `discoveryInfo`, popularity counters. Throws `-32600` if no exact match.

## Always

- **Mainnet = real money.** Always confirm the action (URL, cost in USD, payTo) with the user before mainnet payments. The MCP tool will sign as soon as it's called.
- **Set `maxAmountPerRequest`.** Always. It's the only thing protecting against an endpoint silently quoting an unexpected price.
- **Default `preferredNetwork: "testnet"`** during development. Switch to `"mainnet"` only when the user explicitly opted in to real funds.
- **Amounts are in atomic units.** USDC has 6 decimals → `1,000,000` atomic units = `$1.00`. Most paid endpoints currently quote `1000`–`10000` atomic units = `$0.001`–`$0.01`.

## Common Pitfalls

| Pitfall | Why it breaks | Fix |
|---|---|---|
| Passing `preferredNetwork` or `maxAmountPerRequest` **inside** the `paymentRequirements` array | The array is supposed to contain `accepts[]` objects only — sibling args belong at the top level | Keep `paymentRequirements: [ {...} ]`; put `preferredNetwork` and `maxAmountPerRequest` as sibling top-level fields |
| Synthesizing or hand-editing `paymentRequirements` entries | The schema validation rejects anything missing `scheme`/`network`/`payTo`/`asset`/`amount` | Pass the `accepts[]` array verbatim from `x402_discover_payment_requirements` or `bazaar_get_resource_details` |
| Retrying after a `Payment rejected by server` | The failure was deterministic (stale params, insufficient balance, not opted in) | Read the snippet; surface to user; do not retry blindly |
| Trying to pay a resource that returns only non-Algorand entries (Base/Solana) | This MCP can only sign Algorand transactions | Tool errors with `No payment requirement is satisfiable on Algorand` — tell the user the endpoint isn't reachable from the Algorand wallet |
| `extensions: <extensions from step 1>` | `x402_discover_payment_requirements` does not surface a top-level `extensions` field, so this passes `undefined` | Omit unless you have Bazaar metadata from `bazaar_get_resource_details` to attach for traceability |

## Wallet prerequisites (one-time per asset)

Before any paid call can succeed, the active wallet must:

1. **Exist** — `wallet_get_info` returns an active account, not "no accounts."
2. **Be opted into the payment asset.** USDC testnet is ASA `10458941`, mainnet `31566704`. Check via `api_algod_get_account_asset_info`. If not opted in: `wallet_optin_asset { assetId: 10458941, network: "testnet" }` (costs 0.1 ALGO min-balance bump).
3. **Hold enough of the payment asset.** USDC faucet for testnet: https://faucet.circle.com/

A solid session-opener: `wallet_get_info { network: "testnet" }` → if no account, `wallet_add_account` → opt in to USDC once → proceed.

## Test Endpoint

`https://example.x402.goplausible.xyz/avm/weather` — testnet x402-protected endpoint. Returns `{ "report": { "weather": "sunny", "temperature": 70 } }` after paying 1,000 atomic units of USDC (= $0.001).

## References

- [x402-payment-flow.md](references/x402-payment-flow.md) — Recommended patterns with worked examples for each tool
- [x402-payment-reference.md](references/x402-payment-reference.md) — Protocol-level background: PaymentRequired V2 schema, CAIP-2 mapping, fee-abstraction model, V1 vs V2 differences. Useful for understanding what the MCP tool does internally; you do not need to build any of this yourself.
