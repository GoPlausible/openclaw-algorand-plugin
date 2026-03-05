# Node.js Automation (SDK)

When building Node.js automation scripts that integrate Haystack Router directly in application code:

## Setup

```bash
npm install @txnlab/haystack-router algosdk
```

## Environment Variables

```bash
# .env
HAYSTACK_API_KEY=1b72df7e-1131-4449-8ce1-29b79dd3f51e  # Free tier (60 requests/min)
```

## Complete Example

```typescript
import algosdk from 'algosdk'
import { RouterClient } from '@txnlab/haystack-router'

async function main() {
  const apiKey = process.env.HAYSTACK_API_KEY!

  // For application code, use use-wallet or AlgorandClient for signing
  // For Node.js scripts, create a custom signer:
  const account = algosdk.mnemonicToSecretKey(process.env.MNEMONIC!)
  const address = account.addr.toString()

  const signer = async (
    txnGroup: algosdk.Transaction[],
    indexesToSign: number[],
  ): Promise<Uint8Array[]> => {
    return indexesToSign.map(
      (index) => algosdk.signTransaction(txnGroup[index], account.sk).blob,
    )
  }

  // Initialize router
  const router = new RouterClient({
    apiKey,
    autoOptIn: true,
  })

  // Get quote: 1 ALGO → USDC
  const quote = await router.newQuote({
    fromASAID: 0,
    toASAID: 31566704,
    amount: 1_000_000,
    address,
  })

  console.log(`Expected output: ${Number(quote.quote) / 1e6} USDC`)
  console.log(`USD value: $${quote.usdOut.toFixed(2)}`)

  // Execute swap
  const swap = await router.newSwap({
    quote,
    address,
    signer,
    slippage: 1,
  })

  const result = await swap.execute()
  console.log(`Confirmed in round ${result.confirmedRound}`)
  console.log(`Transaction IDs: ${result.txIds.join(', ')}`)

  const summary = swap.getSummary()
  if (summary) {
    console.log(`Input: ${summary.inputAmount} microunits`)
    console.log(`Output: ${summary.outputAmount} microunits`)
    console.log(`Fees: ${summary.totalFees} microAlgos`)
  }
}

main().catch(console.error)
```

## Tracking with Notes

Attach identifiers to transactions for backend tracking:

```typescript
const swap = await router.newSwap({
  quote,
  address,
  signer,
  slippage: 1,
  note: new TextEncoder().encode(
    JSON.stringify({
      orderId: 'order-123',
      timestamp: Date.now(),
    }),
  ),
})

await swap.execute()
const txId = swap.getInputTransactionId()
console.log(`Tracked: order-123 → ${txId}`)
```

## Debug Logging

Enable verbose logging for troubleshooting:

```typescript
const router = new RouterClient({
  apiKey,
  debugLevel: 'debug', // 'none' | 'info' | 'debug' | 'trace'
})
```
