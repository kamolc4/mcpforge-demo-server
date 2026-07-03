process.env.MCP_API_KEY = "test-api-key-for-jest-testing-only";

import { apiKeyAuth } from "../src/auth";
import { Request, Response, NextFunction } from "express";

function makeReq(apiKey?: string): Request {
  return {
    headers: apiKey ? { "x-api-key": apiKey } : {},
    ip: "127.0.0.1",
    path: "/mcp",
  } as unknown as Request;
}

function makeRes(): { res: Response; json: jest.Mock; status: jest.Mock } {
  const json = jest.fn().mockReturnThis();
  const status = jest.fn().mockReturnValue({ json });
  const res = { status, headersSent: false } as unknown as Response;
  return { res, json, status };
}

describe("apiKeyAuth", () => {
  const next: NextFunction = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it("calls next() when API key is correct", () => {
    const req = makeReq("test-api-key-for-jest-testing-only");
    const { res } = makeRes();
    apiKeyAuth(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("returns 401 when API key is missing", () => {
    const req = makeReq();
    const { res, status } = makeRes();
    apiKeyAuth(req, res, next);
    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when API key is wrong", () => {
    const req = makeReq("wrong-key");
    const { res, status } = makeRes();
    apiKeyAuth(req, res, next);
    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
