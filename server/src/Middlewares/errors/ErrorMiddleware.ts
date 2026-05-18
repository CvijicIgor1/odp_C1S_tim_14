import { ErrorRequestHandler } from "express";
import { ILoggerService } from "../../Domain/services/logger/ILoggerService";
import { toLogError } from "../../utils/logging";

export const createErrorHandler = (logger: ILoggerService): ErrorRequestHandler => {
  return (err, _req, res, _next) => {
    logger.error("HTTP", "Unhandled server error", toLogError(err instanceof Error ? err : String(err)));
    res.status(500).json({ success: false, message: "Internal server error" });
  };
};
