process.env.MCP_API_KEY = "test-api-key-for-jest-testing-only";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

function buildServer() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { registerAnalyzeText } = require("../src/tools/analyzeText");
  const server = new McpServer({ name: "test", version: "1.0.0" });
  registerAnalyzeText(server);
  return server;
}

describe("analyzeText", () => {
  it("registers the tool without error", () => {
    expect(() => buildServer()).not.toThrow();
  });
});
