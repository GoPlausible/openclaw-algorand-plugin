/**
 * x402-fetch: Agent-oriented HTTP fetch with x402 payment protocol support.
 *
 * Two-step flow:
 * 1. Fetch URL → if 402, returns structured PaymentRequirements + instructions
 * 2. Agent builds payment via algorand-mcp tools, retries with paymentHeader
 *
 * No @x402-avm/fetch dependency — plain fetch() with manual 402 parsing.
 */

export interface X402FetchParams {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  paymentHeader?: string;
}

export interface X402FetchResult {
  status: number;
  paymentRequired?: boolean;
  x402Version?: number;
  accepts?: unknown[];
  instructions?: string;
  headers?: Record<string, string>;
  body?: string;
  paymentSettled?: unknown;
  error?: string;
}

const PAYMENT_INSTRUCTIONS = `To pay for this resource, follow these steps using algorand-mcp tools:

1. Check wallet: wallet_get_info { network: "<network>" }
   — Map CAIP-2 identifier to network:
     "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=" → "testnet"
     "algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=" → "mainnet"

2. Build fee payer transaction (facilitator sponsors fees for the group):
   make_payment_txn { from: "<feePayer from accepts[].extra.feePayer>", to: "<feePayer>", amount: 0, fee: N×1000 (N=group size, e.g. 2000 for 2 txns), flatFee: true, network: "<network>" }
   — NEVER set fee=0 on the fee payer — this causes "txgroup had 0 in fees" errors.

3. Build payment transaction:
   — For native ALGO (asset "0"):
     make_payment_txn { from: "<your_address>", to: "<payTo>", amount: <maxAmountRequired>, fee: 0, flatFee: true, network: "<network>" }
   — For ASA (asset is ASA ID):
     make_asset_transfer_txn { from: "<your_address>", to: "<payTo>", assetIndex: <asset>, amount: <maxAmountRequired>, fee: 0, flatFee: true, network: "<network>" }

4. Group the transactions:
   assign_group_id { transactions: [fee_payer_txn, payment_txn] }

5. Sign ONLY the payment transaction (index 1) with wallet:
   wallet_sign_transaction { transaction: <grouped_payment_txn>, network: "<network>" }
   — Leave the fee payer transaction (index 0) unsigned — the facilitator signs it.

6. Encode the unsigned fee payer transaction to base64:
   encode_unsigned_transaction { transaction: <grouped_fee_payer_txn> }
   — Returns base64 bytes of the unsigned transaction (canonical algosdk encoding).

7. Construct the PAYMENT-SIGNATURE payload as JSON:
   {
     "x402Version": 2,
     "scheme": "exact",
     "network": "<CAIP-2 network identifier from accepts>",
     "payload": {
       "paymentGroup": ["<base64 from encode_unsigned_transaction>", "<base64 from wallet_sign_transaction>"],
       "paymentIndex": 1
     },
     "accepted": <the exact accepts[] entry you chose — copy it verbatim as an object, including all fields: scheme, network, price, payTo, asset, maxAmountRequired, extra, etc.>
   }

   IMPORTANT: The "accepted" field MUST be an exact copy of the accepts[] entry you chose to pay with.
   Without it, the server cannot match your payment to a requirement and will reject with 402.

8. Retry the request using x402_fetch with paymentHeader set to the JSON string above.

Load the algorand-interaction skill for the full x402 payment workflow reference.`;

export async function x402Fetch(params: X402FetchParams): Promise<X402FetchResult> {
  const { url, method = "GET", headers = {}, body, paymentHeader } = params;

  const requestHeaders: Record<string, string> = { ...headers };

  if (paymentHeader) {
    // x402 v2 protocol requires base64-encoded JSON in the PAYMENT-SIGNATURE header
    const encoded = Buffer.from(paymentHeader).toString("base64");
    requestHeaders["PAYMENT-SIGNATURE"] = encoded;
  }

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      fetchOptions.body = body;
      if (!requestHeaders["Content-Type"]) {
        requestHeaders["Content-Type"] = "application/json";
      }
    }

    const response = await fetch(url, fetchOptions);

    // Collect response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Handle 402 Payment Required
    if (response.status === 402) {
      return await handle402Response(response, responseHeaders);
    }

    // Handle all other responses
    const responseBody = await response.text();

    const result: X402FetchResult = {
      status: response.status,
      headers: responseHeaders,
      body: responseBody,
    };

    // Check for payment settlement response header
    const paymentResponse =
      responseHeaders["payment-response"] ||
      responseHeaders["x-payment-response"];
    if (paymentResponse) {
      try {
        result.paymentSettled = JSON.parse(paymentResponse);
      } catch {
        result.paymentSettled = paymentResponse;
      }
    }

    if (!response.ok) {
      result.error = `HTTP ${response.status}: ${response.statusText}`;
    }

    return result;
  } catch (err) {
    return {
      status: 0,
      error: `Fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function handle402Response(
  response: Response,
  responseHeaders: Record<string, string>,
): Promise<X402FetchResult> {
  let bodyText = "";
  try {
    bodyText = await response.text();
  } catch {
    // Body may not be readable
  }

  // Try to parse x402 payment requirements
  let parsed: {
    x402Version?: number;
    accepts?: unknown[];
    error?: string;
    resource?: unknown;
  } | null = null;

  // First, check the payment-required header (base64-encoded JSON)
  const paymentRequiredHeader = responseHeaders["payment-required"];
  if (paymentRequiredHeader) {
    try {
      const decoded = Buffer.from(paymentRequiredHeader, "base64").toString("utf-8");
      parsed = JSON.parse(decoded);
    } catch {
      // Header not valid base64 JSON — try body next
    }
  }

  // Fallback: try parsing the body as JSON
  if (!parsed) {
    try {
      parsed = JSON.parse(bodyText);
    } catch {
      // Not JSON — return raw
    }
  }

  if (parsed && parsed.accepts && Array.isArray(parsed.accepts)) {
    return {
      status: 402,
      paymentRequired: true,
      x402Version: parsed.x402Version || 2,
      accepts: parsed.accepts,
      instructions: PAYMENT_INSTRUCTIONS,
    };
  }

  // Fallback: 402 but not standard x402 format
  return {
    status: 402,
    paymentRequired: true,
    error: "Received 402 but could not parse x402 payment requirements",
    body: bodyText,
    headers: responseHeaders,
  };
}
