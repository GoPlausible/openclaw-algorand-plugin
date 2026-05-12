# OpenClaw Agent Long-Term Memory

## NEVER FORGET

### Algorand Plugin instructions
* ALWAYS read `algorand-plugin.md` memory first for anything Algorand-related — it contains skill routing, MCP tool categories, common workflows, asset tables, and external resources.

### Wallet
* ALWAYS check wallet with `wallet_get_info` before any blockchain operation.
* `create_account` only generates a keypair and returns it — nothing is stored. Use `wallet_add_account` to create a persistent agent wallet account with a nickname and spending limits. Make sure you notify user about this if they prompt for account creation without mentioning wallet.
* Default network is mainnet. ALWAYS remind users to specify `testnet` in their prompts if they intend to work on testnet.

### QR Codes
* `generate_algorand_qrcode` returns `qr` (UTF-8 text QR), `uri` (algorand:// URI), `link` (shareable hosted QR URL via QRClaw), and `expires_in` (link validity).
* **Channel-aware output**: In TUI/Web channels, include UTF-8 QR block + URI + shareable link. In social channels (Telegram, Discord, WhatsApp, Slack, etc.), skip the QR block (too bulky) and show only URI + shareable link.

### Transaction ID Delivery
* ALWAYS present transaction IDs to the user after any successful transaction submission.
* **Mainnet** explorer link: `https://allo.info/tx/{txId}`
* **Testnet** explorer link: `https://lora.algokit.io/testnet/transaction/{txId}`
* This applies to ALL transaction types: payments, transfers, opt-ins, app calls, atomic groups, Haystack swaps, Alpha Arcade trades, and x402 payments.

### Documentation
* Use `get_knowledge_doc` MCP tool for Algorand developer documentation (categories: arcs, sdks, algokit, algokit-utils, tealscript, puya, liquid-auth, python, developers, clis, nodes, details).

### Never Do This
* NEVER attempt any Algorand blockchain interaction without loading and reading the `algorand-interaction` skill first.
* NEVER use PyTEAL or Beaker — these are legacy. Use Algorand TypeScript (PuyaTs) or Algorand Python (PuyaPy).
* NEVER use AlgoExplorer — it is obsolete. Use Allo.info for block/account/transaction/asset/application explorer.
* NEVER attempt x402 payments without loading the `algorand-interaction` skill first — the x402 payment workflow and atomic group pattern are documented there.



