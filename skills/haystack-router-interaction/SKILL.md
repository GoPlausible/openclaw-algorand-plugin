---
name: haystack-router-interaction
description: Route and execute optimal token swaps on Algorand using Haystack Router via Algorand MCP tools. Use when getting best-price quotes across multiple Algorand DEXes and LST protocols, executing atomic swaps, and checking asset opt-in — all through the Algorand MCP server. Strong triggers include haystack swap, best price swap, DEX aggregator swap, swap ALGO to USDC, api_haystack, haystack quote, execute swap, swap routing, optimal swap, multi-DEX swap.
---

# Haystack Router (Interaction)

This is the parent skill for interacting with Haystack Router through Algorand MCP tools — getting quotes, executing swaps, and checking opt-in status. All operations use the Algorand MCP wallet for signing; no SDK installation or API keys needed.

> **Building an application** that integrates Haystack Router directly? Use the **haystack-router-development** skill instead — it covers the `@txnlab/haystack-router` SDK, React integration, Node.js automation, middleware, and the full API surface.
> **Need general wallet/transaction guidance?** See the **algorand-interaction** skill for wallet setup, session start checklist, network selection, and pre-transaction validation.

Haystack Router is a DEX aggregator and smart order routing protocol on Algorand. It finds optimal swap routes across multiple DEXes (Tinyman V2, Pact, Folks) and LST protocols (tALGO, xALGO), then executes them atomically through on-chain smart contracts.

## mcporter Syntax (OpenClaw CLI)

When calling Haystack Router MCP tools via mcporter in OpenClaw CLI:

```bash
mcporter call algorand-mcp.api_haystack_get_swap_quote --args '{"fromASAID": 0, "toASAID": 31566704, "amount": 1000000, "network": "mainnet"}'
```

Key: use `server.tool` (dot notation) with `--args '{"json"}'`. See `algorand-interaction` skill for full mcporter reference.

## Network Selection

Every Haystack Router tool accepts a `network` parameter:

| Value | Description |
|-------|-------------|
| `mainnet` | Algorand mainnet (default) — **real value, exercise caution** |
| `testnet` | Algorand testnet — safe for development |

Default to `testnet` during development. Always confirm with the user before mainnet swaps.

## Algorand MCP Haystack Router Tools

Three dedicated Algorand MCP tools provide full Haystack Router functionality. These handle quoting, execution (with wallet signing), and opt-in checking — no raw mnemonics or secret keys needed.

### `api_haystack_get_swap_quote`

Get an optimized swap quote without executing. Use to preview pricing, route, and price impact before confirming with user.

```
→ api_haystack_get_swap_quote {
    fromASAID: 0,             // Input asset (0 = ALGO)
    toASAID: 31566704,        // Output asset (USDC)
    amount: 1000000,          // 1 ALGO in base units
    type: "fixed-input",      // or "fixed-output"
    address: "<address>",     // optional, for opt-in detection
    maxGroupSize: 16,         // optional
    maxDepth: 4,              // optional
    network: "mainnet"
  }

Returns: expectedOutput, inputAmount, usdIn, usdOut, userPriceImpact,
         route, flattenedRoute, requiredAppOptIns, protocolFees
```

### `api_haystack_execute_swap`

All-in-one swap: quote → sign (via wallet) → submit → confirm. Uses the active wallet account for signing. Enforces wallet spending limits.

```
→ api_haystack_execute_swap {
    fromASAID: 0,             // Input asset
    toASAID: 31566704,        // Output asset
    amount: 1000000,          // Amount in base units
    slippage: 1,              // 1% slippage tolerance
    type: "fixed-input",      // optional
    note: "my swap",          // optional text note
    maxGroupSize: 16,         // optional
    maxDepth: 4,              // optional
    network: "mainnet"
  }

Returns: status, confirmedRound, txIds, signer, nickname, quote details,
         summary (inputAmount, outputAmount, totalFees, transactionCount)

ALWAYS present txIds to user with explorer links after execution:
  Mainnet: https://allo.info/tx/{txId}
  Testnet: https://lora.algokit.io/testnet/transaction/{txId}
```

### `api_haystack_needs_optin`

Check if an address needs to opt into an asset before swapping.

```
→ api_haystack_needs_optin {
    address: "<address>",
    assetId: 31566704,
    network: "mainnet"
  }

Returns: { address, assetId, needsOptIn: true/false, network }
```

## Algorand MCP Agent Swap Workflow

```
Step 1: Check wallet
  → wallet_get_info { network }

Step 2: Check opt-in (if swapping to an ASA)
  → api_haystack_needs_optin { address, assetId, network }
  → If needed: wallet_optin_asset { assetId, network }

Step 3: Preview quote (recommended — show user before executing)
  → api_haystack_get_swap_quote { fromASAID, toASAID, amount, address, network }
  → Present to user: expected output, USD values, route, price impact

Step 4: User confirms → Execute
  → api_haystack_execute_swap { fromASAID, toASAID, amount, slippage, network }
  → Returns confirmed result with summary

Step 5: Present transaction IDs to user
  → Show all txIds from the response with explorer links:
     Mainnet: https://allo.info/tx/{txId}
     Testnet: https://lora.algokit.io/testnet/transaction/{txId}
```

**Key rules:**
- Always check wallet with `wallet_get_info` before any swap
- Always confirm with the user before executing (show quote details)
- The execute tool handles signing via the active wallet — no manual signing needed
- Default to testnet during development; confirm before mainnet
- Quotes are time-sensitive — execute promptly after user confirms

## Key Concepts

- **Amounts** are always in base units (microAlgos for ALGO, smallest unit for ASAs)
- **ASA IDs**: 0 = ALGO, 31566704 = USDC, etc.
- **Slippage**: Percentage tolerance on output (e.g., 1 = 1%). Applied to the final output, not individual hops.
- **Quote types**: `fixed-input` (default) — specify input amount; `fixed-output` — specify desired output
- **Routing**: Supports multi-hop and parallel (combo) swaps for optimal pricing

## CRITICAL: fixed-input vs fixed-output — Choosing the Correct Swap Type

The `type` parameter determines which side of the swap is exact. Getting this wrong means the user spends more or receives less than intended. **Parse the user's intent carefully.**

| Type | Meaning | `amount` specifies | The other side is | Use when |
|------|---------|-------------------|-------------------|----------|
| `fixed-input` | Spend exactly this much | **Input** amount (what you send) | Estimated (output varies) | "Swap 10 ALGO for USDC", "Sell 10 ALGO", "Use 10 ALGO to buy USDC" |
| `fixed-output` | Receive exactly this much | **Output** amount (what you get) | Estimated (input varies) | "Buy 10 ALGO with USDC", "I want exactly 5 USDC", "Get me 10 ALGO" |

### Mapping User Intent — Examples

| User says | Type | fromASAID | toASAID | amount | Why |
|-----------|------|-----------|---------|--------|-----|
| "Buy 10 ALGO with USDC" | `fixed-output` | 31566704 (USDC) | 0 (ALGO) | 10000000 | User wants **exactly 10 ALGO** out |
| "Buy USDC for 10 ALGO" | `fixed-input` | 0 (ALGO) | 31566704 (USDC) | 10000000 | User wants to **spend exactly 10 ALGO** |
| "Swap 5 USDC to ALGO" | `fixed-input` | 31566704 (USDC) | 0 (ALGO) | 5000000 | User wants to **spend exactly 5 USDC** |
| "I want exactly 100 USDC" | `fixed-output` | 0 (ALGO) | 31566704 (USDC) | 100000000 | User wants **exactly 100 USDC** out |
| "Sell 10 ALGO" | `fixed-input` | 0 (ALGO) | 31566704 (USDC) | 10000000 | User wants to **spend exactly 10 ALGO** |
| "Get me 10 ALGO" | `fixed-output` | 31566704 (USDC) | 0 (ALGO) | 10000000 | User wants **exactly 10 ALGO** out |

### Rules

1. **"Buy X of Y"** → `fixed-output`, amount = X (in base units of Y), toASAID = Y
2. **"Swap/sell/use X of Y for Z"** → `fixed-input`, amount = X (in base units of Y), fromASAID = Y
3. **"I want exactly X of Y"** → `fixed-output`, amount = X (in base units of Y), toASAID = Y
4. **When ambiguous, ask the user**: "Do you want to spend exactly X or receive exactly X?"
5. **The `amount` field always refers to the fixed side** — input amount for `fixed-input`, output amount for `fixed-output`
6. **Always show the quote** before executing so the user can verify the estimated other side

## Reference Files

Read the appropriate file based on the task:

| Task                                        | Reference                                             |
| ------------------------------------------- | ----------------------------------------------------- |
| Quick start and Algorand MCP tool reference | [getting-started.md](references/getting-started.md)   |
| Get swap quotes, display pricing            | [quotes.md](references/quotes.md)                     |
| Execute swaps via Algorand MCP tools        | [swaps.md](references/swaps.md)                       |
| Automate swaps via Algorand MCP tools       | [node-automation.md](references/node-automation.md)   |
| Network, slippage, rate limits, ASA IDs     | [configuration.md](references/configuration.md)       |

## How to Use This Skill

1. **Start here** to understand the three Haystack Router MCP tools and the swap workflow
2. **Read the topic `.md`** file for detailed guidance on quotes, swaps, or automation
3. **For SDK-based development** (React UIs, Node.js apps), see the `haystack-router-development` skill
4. **For wallet setup and general blockchain interaction**, see the `algorand-interaction` skill
