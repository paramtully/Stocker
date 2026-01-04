import { Request, Response } from "express";

export const errorHandler = (
  err: Error & { status?: number; statusCode?: number },
  _req: Request,
  res: Response,
) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  throw err;
};