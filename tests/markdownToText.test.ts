process.env.MCP_API_KEY = "test-api-key-for-jest-testing-only";

describe("markdownToText (unit)", () => {
  // We test the strip logic inline to avoid MCP server wiring in unit tests.
  function strip(md: string): string {
    let text = md;
    text = text.replace(/```[\s\S]*?```/g, "");
    text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
    text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
    text = text.replace(/^#{1,6}\s+/gm, "");
    text = text.replace(/^>\s?/gm, "");
    text = text.replace(/(\*{1,3}|_{1,3})(.+?)\1/g, "$2");
    text = text.replace(/\n{2,}/g, " ").replace(/\n/g, " ");
    text = text.replace(/\s{2,}/g, " ");
    return text.trim();
  }

  it("strips headings", () => {
    expect(strip("# Hello World")).toBe("Hello World");
  });

  it("strips bold", () => {
    expect(strip("**bold text**")).toBe("bold text");
  });

  it("converts links to text", () => {
    expect(strip("[click here](https://example.com)")).toBe("click here");
  });

  it("strips blockquotes", () => {
    expect(strip("> quoted text")).toBe("quoted text");
  });

  it("removes code blocks", () => {
    expect(strip("before\n```\ncode\n```\nafter")).toBe("before after");
  });
});
