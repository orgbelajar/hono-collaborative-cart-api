import type { Context } from "hono";
import { ClientError } from "../exceptions/index";
// import { logger } from "../applications/logging";

const ErrorHandler = (err: Error, c: Context) => {
  // Handle ClientError dan subclass-nya (InvariantError, NotFoundError)
  // ClientError sudah extend HTTPException, jadi cukup satu pengecekan
  if (err instanceof ClientError) {
    return c.json({ errors: err.message }, err.status);
  }

  // Unhandled error
  console.error("Unhandled error:", err);
  return c.json({ errors: "Internal Server Error" }, 500);
};

export default ErrorHandler;
