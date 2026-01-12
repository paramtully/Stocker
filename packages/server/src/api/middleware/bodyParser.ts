import express from "express";
import type { Request, Response } from "express";

/**
 * Parses JSON and URL-encoded bodies.
 * Also captures the raw request body (needed for things like webhooks).
 */
export const bodyParser = [
  express.json({
    verify: (req: Request & { rawBody?: Buffer }, _res: Response, buf) => {
      req.rawBody = buf;
    },
  }),

  express.urlencoded({
    extended: false,
  }),
];