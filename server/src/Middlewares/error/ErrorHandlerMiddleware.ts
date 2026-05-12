import { Request, Response, NextFunction } from "express";
import { AppError } from "../../Domain/errors/AppError";

export const errorHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ success: false, message: err.message });
        return;
    }
    console.error("[Unhandled error]", err);
    res.status(500).json({ success: false, message: "Internal server error" });
};
