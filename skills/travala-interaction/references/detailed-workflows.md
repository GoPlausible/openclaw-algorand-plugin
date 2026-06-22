# Travala Booking Expert — Detailed Workflows

## Authentication Model (OAuth)

Auth uses the **OAuth login** the user completes in their MCP connector. The connector authenticates the user; the server resolves the caller's identity + scopes from the bearer token.

| Tool | Auth | Scope |
|------|------|-------|
| `travala_search_hotel` / `travala_search_package` | **Public** — no login | — |
| `travala_book` | Protected | `mcp:book` |
| `travala_book_status` | Protected | `mcp:read` |
| `travala_manage_bookings` | Protected (+ email OTP) | `mcp:read` |
| `travala_cancel_booking` | Protected (+ email OTP) | `mcp:cancel` |
| `travala_whoami` / `travala_logout` | Protected | `mcp:read` |

- **Search is public** — browsing/pricing needs no login (server uses its own `SEARCH_API_KEY`). Sign-in is only needed to book.
- **Manage + cancel + send-otp:** the server forwards the caller's email upstream as `X-Travala-User-Email`; upstream requires it to match the booking's bound owner email (`authorized_email`). Same account that booked can manage/cancel — no per-booking credential to store. On top of OAuth, **both `travala_manage_bookings` and `travala_cancel_booking` require an email OTP** (each a two-call flow; the two OTPs are independent — separate codes, separate 60s cooldowns).
- **Helpers:** `travala_whoami` shows the signed-in email + scopes; `travala_logout` ends the session to switch email.
- **On "Unauthorized"/401/403:** not signed in, or the account doesn't own the booking. Ask to sign in with the booking account; if a different email, direct to https://www.travala.com/my-bookings or support@travala.com.

`travala_book` is gated by the x402 payment flow (payment authorizes booking creation).

## Tool Specifications

### `travala_search_hotel`
| Param | Type | Req | Description |
|---|---|---|---|
| location | string | Yes | City or area name |
| lat / lng | number | No | Coordinates — strongly recommended for accuracy |
| checkIn / checkOut | string | Yes | YYYY-MM-DD |
| rooms | string[] | Yes | Occupancy, e.g. `["2"]`, `["2,5"]` (2 adults + child 5), `["2,2,4"]` (2 adults + children 2,4) |
| filters | string[] | No | `all_inclusive`, `free_breakfast`, `swimming_pool`, `ocean_view` |
| minPrice / maxPrice | number | No | Per-night USD |
| sessionId | string | No | Continue an existing search |
| rawInput / userSummary | string | No | Passthrough for logging |

### `travala_search_package`
`hotelId` (req) + `sessionId`; re-provide `checkIn`/`checkOut`/`rooms` if the session may have expired. May return a new `sessionId` — use the latest.

### `travala_book`
`packageId` (req), `sessionId` (req, latest), `customer.{firstName,lastName,email,phone}` (all req; phone with country code), `agentId` (always `"1001"`), `rewardWallet` (always `"0x6021A56A3F29F203f8D6fed43821aE39420A3f51"`). **Before calling:** show the summary + full cancellation policy, then display the **terms-consent text verbatim** ([Booking Conditions](https://www.travala.com/booking-terms) / [Terms and Conditions](https://www.travala.com/terms-and-conditions) / [Privacy Policy](https://www.travala.com/privacy-policy)), then get explicit USDC-on-Base payment confirmation. Response: typically HTTP 402 + `next_action` for x402 (see *Payment Flow*). Manage/cancel are authorized by the signed-in account.

### `travala_book_status` (Recovery)
Recovers a prior `travala_book` result when the client lost the response (timeout, network error, "rejected by server"). **Read-only — never double-charges.** Always call BEFORE retrying `travala_book` after a failure. ⚠️ **Wait ~5s** before the first call — calling immediately tends to return `not_found` even when the booking ultimately succeeds. Params: `packageId` + `sessionId` (same as the failed call). Response `{httpStatus, body, interpretation}` — branch on `interpretation`:

| `interpretation` | http | Meaning | Action |
|---|---|---|---|
| `completed` | 200 | Finished; `body` holds result | Present confirmation. DO NOT retry payment. |
| `in_progress` | 202 | Settling; `body.retry_after_ms` = wait | Poll again (~6 polls). If still pending, email will follow. |
| `not_found` | 404 | Nothing persisted | Safe to retry `travala_book`. |
| `invalid_request` | 400 | Bad params | Re-check packageId/sessionId. |
| `server_error` | 5xx | Recovery endpoint down | Don't retry; user checks email/wallet. |
| `unknown` | other | Unexpected | Treat conservatively; don't retry without confirmation. |

### `travala_manage_bookings` (Two-Step OTP)
OAuth account **plus** an email OTP. Called **twice**: Step 1 (no `otp`) emails a code; Step 2 (with `otp`) returns details. Not read-only — Step 1 sends an email.

Params: `bookingId` (req), `lastName` (req), `email` (req), `otp` (optional — OMIT on Step 1, supply on Step 2). **Step 2 response:** bookingId, firstName, lastName, status, price, currency, hotelName, roomName, checkIn, checkOut, **bookingConfirmationLink**, cancellationPolicy, cancellation (free_cancellation_until_utc, server_time_utc, is_cancellable_now, time_remaining_human, time_remaining_seconds).

The manage OTP is independent of the cancel OTP (different code, separate 60s cooldown: `MANAGE_BOOKING` vs `CANCEL_BOOKING`) — a cancellation that starts with a lookup sends two codes. Errors: "Unauthorized"/401/403 (auth/ownership); "code is incorrect" (still valid — retry Step 2, don't re-send); "expired / request a new code" (Step 1 again, then retry); "wait N seconds" / "Rate limit exceeded" (60s throttle); "Failed to get booking details" (verify bookingId/lastName/email).

### `travala_cancel_booking` (Two-Step OTP)
Irreversible. OAuth account **and** an email OTP. Called **twice**: Step 1 (no `otp`) emails a code; Step 2 (with `otp`) cancels. Params same as manage. **Step 2 response:** bookingId, status (cancelled), names, hotelName, roomName, checkIn, checkOut, price, currency, refundAmount, cancellationFee, cancellationPolicy, cancelledAt, note.

**Mandatory pre-steps** (sends two separate OTP emails — one to view, one to cancel; warn the user):
1. Run the full two-step `travala_manage_bookings` flow (its own OTP) to fetch details + policy.
2. Show the user the details + policy (fees, deadlines).
3. Get explicit "yes — this cannot be undone".
4. **Step 1** — call WITHOUT `otp`; server emails a **new** code (separate from the lookup code). Don't reuse the lookup code; never invent it.
5. **Step 2** — call again with SAME args PLUS `otp` to cancel.

Errors: same OTP error set as manage; "Failed to cancel booking" = not eligible (deadline passed, already cancelled) or details mismatch.

## Payment Flow (402 Response)

When `travala_book` returns 402:
1. `tool_search` query `"make_http_request_with_x402"` to load the payment tool.
2. Extract `next_action`; inform the user of the total USDC + network (Base; Base Sepolia in test).
3. Explain: "To complete payment, authorize a USDC transaction through Coinbase on Base."
4. Call `algorand-mcp:make_http_request_with_x402` with the exact `next_action` fields:
   ```json
   { "tool": "algorand-mcp:make_http_request_with_x402", "baseURL": "...", "path": "/m2m-payment/book", "method": "POST",
     "body": { "package_id": "...", "session_id": "...",
       "contact": { "given_name": "...", "sur_name": "...", "email": "...", "phone": "..." },
       "agent_id": "1001", "reward_wallet": "0x6021A56A3F29F203f8D6fed43821aE39420A3f51" },
     "paymentRequirements": [ ... ] }
   ```
   (The server injects the caller's `authorized_email` into this body server-side so the paid booking binds to the right owner.)
5. Never execute payment yourself — only pass `next_action` to the payments tool.
6. **Clean success:** the x402 response body holds the final booking result (`bookingId`, hotel/room/dates). Confirm (Rule 3); note manage/cancel later from the same account.
7. **Error / timeout / "rejected by server":** do NOT retry `travala_book`. Wait ~5s and call `travala_book_status` (same `packageId` + `sessionId`); branch on `interpretation`.

## Session Expiry & Locale

- Sessions expire after **30 min** inactivity. If expired mid-flow, re-run `travala_search_hotel` with original params; warn prices/availability may have changed.
- **Dates:** always YYYY-MM-DD internally; ambiguous "03/04/2025" → ask "March 4 or April 3?".
- **Currency:** Travala quotes in USD; convert other currencies before passing price bounds.
- **Language:** respond in the user's language; hotel names/addresses in local language or English.

## Ambiguity Handling

| User says | Action |
|---|---|
| "Find hotels in Da Nang" | Ask stay dates + guest count |
| "Find a 5-star hotel" | Ask city + dates |
| "Hotels near the beach" | Ask specific city + which beach area |
| "near the beach in Da Nang" | "Da Nang has My Khe and Non Nuoc beaches. Which?" |