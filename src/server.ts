import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { config } from "./config";
import { logger } from "./logger";
import { apiKeyAuth } from "./auth";
import { healthHandler } from "./health";
import { registerAnalyzeText } from "./tools/analyzeText";
import { registerFetchUrlMetadata } from "./tools/fetchUrlMetadata";
import { registerMarkdownToText } from "./tools/markdownToText";

const app = express();
app.use(express.json());

app.get("/health", healthHandler);

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "mcpforge-demo-server",
    version: "1.0.0",
  });

  registerAnalyzeText(server);
  registerFetchUrlMetadata(server);
  registerMarkdownToText(server);

  return server;
}

app.all("/mcp", apiKeyAuth, async (req, res) => {
  // MCP Streamable HTTP transport requires Accept: application/json, text/event-stream.
  // Set it if absent so non-compliant clients still work.
  if (!req.headers["accept"]?.includes("text/event-stream")) {
    req.headers["accept"] = "application/json, text/event-stream";
  }

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  const server = createMcpServer();

  res.on("close", () => {
    transport.close().catch((err: unknown) => logger.error(err, "Error closing transport"));
    server.close().catch((err: unknown) => logger.error(err, "Error closing server"));
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    logger.error(err, "MCP request failed");
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

const httpServer = app.listen(config.PORT, () => {
  logger.info(
    { port: config.PORT, env: config.NODE_ENV },
    "MCPForge demo server started"
  );
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received — shutting down");
  httpServer.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});

export { app };
