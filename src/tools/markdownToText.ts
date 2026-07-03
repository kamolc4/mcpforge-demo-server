import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

type MarkdownInput = { markdown: string; preserveLineBreaks?: boolean };

const inputSchema: z.ZodType<MarkdownInput> = z.object({
  markdown: z.string().describe("The Markdown content to convert"),
  preserveLineBreaks: z
    .boolean()
    .optional()
    .describe("If true, preserve paragraph breaks in the output (default: false)"),
});

function stripMarkdown(md: string, preserveLineBreaks: boolean): string {
  let text = md;

  text = text.replace(/```[\s\S]*?```/g, "");
  text = text.replace(/`{1,2}[^`]+`{1,2}/g, (m: string) => m.replace(/`/g, "").trim());
  text = text.replace(/<[^>]+>/g, "");
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  text = text.replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1");
  text = text.replace(/^\s{0,3}\[[^\]]+\]:[^\n]+$/gm, "");
  text = text.replace(/^#{1,6}\s+/gm, "");
  text = text.replace(/^>\s?/gm, "");
  text = text.replace(/^[-*_]{3,}\s*$/gm, "");
  text = text.replace(/(\*{1,3}|_{1,3})(.+?)\1/g, "$2");
  text = text.replace(/~~(.+?)~~/g, "$1");
  text = text.replace(/^[\s]*[-*+]\s+/gm, "");
  text = text.replace(/^[\s]*\d+\.\s+/gm, "");
  text = text.replace(/\|/g, " ");
  text = text.replace(/^[-:\s]+$/gm, "");

  if (!preserveLineBreaks) {
    text = text.replace(/\n{2,}/g, " ").replace(/\n/g, " ");
    text = text.replace(/\s{2,}/g, " ");
  } else {
    text = text.replace(/\n{3,}/g, "\n\n");
  }

  return text.trim();
}

export function registerMarkdownToText(server: McpServer): void {
  server.registerTool(
    "markdownToText",
    {
      description: "Convert Markdown to plain text by stripping all formatting syntax.",
      inputSchema,
    },
    async ({ markdown, preserveLineBreaks }) => {
      if (!markdown || markdown.trim().length === 0) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: "markdown must not be empty" }) }],
          isError: true,
        };
      }
      const plainText = stripMarkdown(markdown, preserveLineBreaks ?? false);
      return {
        content: [{ type: "text" as const, text: plainText }],
      };
    }
  );
}
