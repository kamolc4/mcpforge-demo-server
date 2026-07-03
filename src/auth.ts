import { Request, Response, NextFunction } from "express";
import { config } from "./config";
import { logger } from "./logger";

export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== config.MCP_API_KEY) {
    logger.warn({ ip: req.ip, path: req.path }, "Unauthorized request — invalid or missing API key");
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
