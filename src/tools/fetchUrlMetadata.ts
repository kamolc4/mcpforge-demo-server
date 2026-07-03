import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

type FetchInput = { url: string };

const inputSchema: z.ZodType<FetchInput> = z.object({
  url: z.string().describe("The URL to fetch metadata from"),
});

function extractMeta(html: string, property: string): string | null {
  const ogMatch = html.match(
    new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']+)["']`, "i")
  );
  if (ogMatch) return ogMatch[1];
  const nameMatch = html.match(
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i")
  );
  return nameMatch ? nameMatch[1] : null;
}

function extractTag(html: string, tag: string): string | null {
  const match = html.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "i"));
  return match ? match[1].trim() : null;
}

export function registerFetchUrlMetadata(server: McpServer): void {
  server.registerTool(
    "fetchUrlMetadata",
    {
      description: "Fetch a URL and extract its metadata: title, description, OG tags, and basic page info.",
      inputSchema,
    },
    async ({ url }) => {
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("Only http and https URLs are supported");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Invalid URL";
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: message, url }, null, 2) }],
          isError: true,
        };
      }

      let html: string;
      let statusCode: number;
      let contentType: string;

      try {
        const { default: fetch } = await import("node-fetch");
        const response = await fetch(parsedUrl.toString(), {
          headers: { "User-Agent": "MCPForge-MetaBot/1.0" },
          redirect: "follow",
          signal: AbortSignal.timeout(10_000),
        });

        statusCode = response.status;
        contentType = response.headers.get("content-type") ?? "unknown";
        html = await response.text();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown fetch error";
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: message, url }, null, 2) }],
          isError: true,
        };
      }

      const title = extractTag(html, "title") ?? extractMeta(html, "title");
      const description = extractMeta(html, "description");
      const ogImage = extractMeta(html, "image");
      const ogType = extractMeta(html, "type");
      const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
      const canonical = canonicalMatch ? canonicalMatch[1] : null;

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { url, statusCode, contentType, title, description, ogImage, ogType, canonical },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
