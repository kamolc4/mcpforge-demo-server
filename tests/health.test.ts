process.env.MCP_API_KEY = "test-api-key-for-jest-testing-only";

import { healthHandler } from "../src/health";
import { Request, Response } from "express";

describe("healthHandler", () => {
  it("returns status ok with timestamp and uptime", () => {
    const json = jest.fn();
    const res = { json } as unknown as Response;
    const req = {} as Request;

    healthHandler(req, res);

    expect(json).toHaveBeenCalledTimes(1);
    const payload = json.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.status).toBe("ok");
    expect(typeof payload.timestamp).toBe("string");
    expect(typeof payload.uptime).toBe("number");
  });
});
