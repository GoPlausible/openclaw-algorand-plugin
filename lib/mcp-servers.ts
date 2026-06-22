export const ALGORAND_MCP = {
  id: "algorand-mcp",
  name: "Algorand MCP",
  description: "Local Algorand MCP server — 123 tools for blockchain interaction",
  type: "stdio" as const,
  command: "algorand-mcp",
} as const;

export const TRAVALA_MCP = {
  id: "travala-mcp",
  name: "Travala Travel MCP",
  description: "Remote Travala travel booking MCP (search, book, pay, confirm)",
  type: "http" as const,
  baseUrl: "https://travel-mcp.travala.com/mcp",
} as const;

export const GOPLAUSIBLE_SERVICES = {
  website: "https://goplausible.com",
  x402: "https://x402.goplausible.xyz",
  facilitator: "https://facilitator.goplausible.xyz",
  test: "https://example.x402.goplausible.xyz/",
} as const;
