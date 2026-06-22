# Travala Booking Expert — Complete Examples

> Auth is the user's OAuth login in the connector. The server resolves the caller from their session.

## Example 1: Fast Track Booking

**User:** "Find hotels in Da Nang"
**Assistant:** "Da Nang has several beach areas (My Khe, Non Nuoc). Which do you prefer? Also your check-in/out dates and number of guests?"

**User:** "Check-in next Friday, 2 adults for 3 nights"
→ Convert to YYYY-MM-DD, check-out = check-in + 3. Call `travala_search_hotel`:
```json
{ "location": "Da Nang", "lat": 16.0471, "lng": 108.2068,
  "checkIn": "2026-07-17", "checkOut": "2026-07-20", "rooms": ["2"] }
```
→ Return hotels + save `sessionId` internally.

**User:** "Book the first one"
→ Collect missing customer details in one message → show summary + cancellation policy → **display the terms-consent text verbatim** (Booking Conditions / Terms / Privacy links) → confirm "…we only support USDC on Base via Coinbase. Proceed?" → on "Yes", call `travala_book`:
```json
{ "packageId": "pkg-789", "sessionId": "def-456",
  "customer": { "firstName": "John", "lastName": "Smith", "email": "john@example.com", "phone": "+1-555-123-4567" },
  "agentId": "1001", "rewardWallet": "BNLR5HEXTRUVIXETEZAKBV3CBMECVDTQYC3HZOAMNLO57UXLOMZYKRLBGI" }
```
→ If 402: load `make_http_request_with_x402`, pass `next_action` to algorand-mcp → on clean success, confirm with bookingId.

## Example 2: Deep Dive (Room Comparison)

**User:** "Show me details for hotel #2"
→ `travala_search_package`: `{ "hotelId": "hotel-456", "sessionId": "abc-123" }` → update `sessionId` if a new one returns → present all packages in comparison format.
**User:** "Book package #3" → collect details → confirm USDC → `travala_book`.

## Example 3: Payment Error — Recover with travala_book_status

**Context:** `travala_book` returned 402, agent handed `next_action` to algorand-mcp, but the paid call **errored / timed out / "rejected by server"**. The booking may already exist.

→ Do NOT retry `travala_book`. Wait ~5s, then call `travala_book_status`:
```json
{ "packageId": "pkg-789", "sessionId": "def-456" }
```
→ Branch on `interpretation`: `completed` (200) → present confirmation, no retry · `in_progress` (202) → poll (~6×); else email follows · `not_found` (404) → safe to retry · `server_error` (5xx) → don't retry, user checks email/wallet.

## Example 4: Check Existing Booking (Two-Step OTP)

**User:** "Check my booking"
→ Ask for booking ID, last name, and email used at booking.

**User:** "MN5V9DWQ, Smith, john@example.com"
→ **Step 1** — `travala_manage_bookings` WITHOUT `otp` (server emails a code):
```json
{ "bookingId": "MN5V9DWQ", "lastName": "Smith", "email": "john@example.com" }
```
→ "I've sent a 6-digit code to the email on file. Please read it back so I can pull up your booking."

**User:** "203914"
→ **Step 2** — call again WITH `otp`:
```json
{ "bookingId": "MN5V9DWQ", "lastName": "Smith", "email": "john@example.com", "otp": "203914" }
```
→ Present status, dates, hotel, price, bookingConfirmationLink.
→ "code is incorrect" → still valid, retry Step 2 (don't re-send). "expired" → Step 1 again.
→ "Unauthorized" → sign in with the booking account (`travala_whoami` / `travala_logout` to switch); if a different email, direct to my-bookings / support.

## Example 5: Cancel a Booking (Two-Step OTP)

> Sends **two separate codes** — one to view (manage), one to confirm cancel. Warn the user.

**User:** "Cancel booking MN5V9DWQ"
→ Step A: run the full two-step `travala_manage_bookings` flow (Example 4) — **first** OTP — to fetch details + policy.
→ Step B: show the summary + policy; ask "Are you sure? This cannot be undone."
→ User: "Yes"
→ Step 1 — `travala_cancel_booking` WITHOUT `otp` (sends a **second, separate** OTP):
```json
{ "bookingId": "MN5V9DWQ", "lastName": "Smith", "email": "john@example.com" }
```
→ "I've sent a 6-digit code. Please read it back to confirm the cancellation."

**User:** "481920"
→ Step 2 — `travala_cancel_booking` WITH `otp`:
```json
{ "bookingId": "MN5V9DWQ", "lastName": "Smith", "email": "john@example.com", "otp": "481920" }
```
→ Present result: status, refund amount, cancellation fee, applied policy.
→ "code is incorrect" → still valid, retry Step 2 (don't re-send). "expired" → Step 1 again.

## Occupancy Format

| Description | Format |
|---|---|
| 1 room, 2 adults | `["2"]` |
| 1 room, 2 adults + 1 child (5) | `["2,5"]` |
| 1 room, 2 adults + 2 children (2,4) | `["2,2,4"]` |
| 2 rooms — 2 adults; 1 adult + child (8) | `["2", "1,8"]` |
| 2 rooms — 2 adults + child (12); 2 adults | `["2,12", "2"]` |

## Price Filter (convert to USD first)

"1,000,000 VND" → `40` · "100 EUR" → `108` · "500 SGD" → `370`. Example:
```json
{ "location": "Paris", "lat": 48.8566, "lng": 2.3522,
  "checkIn": "2026-08-01", "checkOut": "2026-08-04", "rooms": ["2"],
  "filters": ["free_breakfast", "swimming_pool"], "maxPrice": 200, "minPrice": 50 }
```