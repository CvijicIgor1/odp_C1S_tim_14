import { RequestHandler } from "express";

export const apiNotFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
};
