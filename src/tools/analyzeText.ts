import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

type AnalyzeInput = { text: string };

const inputSchema: z.ZodType<AnalyzeInput> = z.object({
  text: z.string().describe("The text to analyze"),
});

export function registerAnalyzeText(server: McpServer): void {
  server.registerTool(
    "analyzeText",
    {
      description:
        "Analyze a piece of text and return word count, character count, sentence count, and top frequent words.",
      inputSchema,
    },
    async ({ text }) => {
      if (!text || text.trim().length === 0) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: "text must not be empty" }) }],
          isError: true,
        };
      }

      const words = text.trim().split(/\s+/).filter(Boolean);
      const sentences = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
      const characters = text.length;
      const charactersNoSpaces = text.replace(/\s/g, "").length;

      const wordFreq: Record<string, number> = {};
      for (const word of words) {
        const normalized = word.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (normalized) wordFreq[normalized] = (wordFreq[normalized] ?? 0) + 1;
      }

      const topWords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word, count]) => ({ word, count }));

      const avgWordLength =
        words.length > 0
          ? (words.reduce((sum: number, w: string) => sum + w.replace(/[^a-zA-Z0-9]/g, "").length, 0) / words.length).toFixed(2)
          : "0";

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                wordCount: words.length,
                characterCount: characters,
                characterCountNoSpaces: charactersNoSpaces,
                sentenceCount: sentences.length,
                averageWordLength: parseFloat(avgWordLength),
                topWords,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
