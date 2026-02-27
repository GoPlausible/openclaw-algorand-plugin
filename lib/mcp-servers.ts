export const MCP_SERVERS = {
  lite: {
    id: "algorand-mcp-lite",
    name: "Algorand Remote MCP Lite (Wallet Edition)",
    description: "Lightweight wallet operations — balances, transactions, account info",
    url: "https://algorandmcplite.goplausible.xyz/sse",
    features: ["wallet", "transactions", "account-info"],
  },
  full: {
    id: "algorand-mcp",
    name: "Algorand Remote MCP (Full)",
    description: "Full Algorand integration — smart contracts, indexer, advanced features",
    url: "https://algorandmcp.goplausible.xyz/sse",
    features: ["wallet", "transactions", "smart-contracts", "indexer", "abi"],
  },
} as const;

export const GOPLAUSIBLE_SERVICES = {
  website: "https://goplausible.com",
  x402: "https://x402.goplausible.xyz",
  facilitator: "https://facilitator.goplausible.xyz",
} as const;

export type McpServerKey = keyof typeof MCP_SERVERS;
export type McpServer = (typeof MCP_SERVERS)[McpServerKey];
