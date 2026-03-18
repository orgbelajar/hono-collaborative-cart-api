import type { Context } from "hono";
import { ZodError } from "zod";
import { ClientError } from "../exceptions/index";

// import { logger } from "../applications/logging";

const ErrorHandler = (err: Error, c: Context) => {
  if (err instanceof ClientError) {
    return c.json({ status: "fail", message: err.message }, err.status);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return c.json({ status: "fail", message: err.issues[0].message }, 400);
  }

  // Unhandled error
  console.error("Unhandled error:", err);
  return c.json({ status: "error", message: "Internal Server Error" }, 500);
};

export default ErrorHandler;
