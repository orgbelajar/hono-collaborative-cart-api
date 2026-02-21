import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

class ClientError extends HTTPException {
  constructor(message: string, statusCode: ContentfulStatusCode = 400) {
    super(statusCode, { message });
    this.name = "ClientError";
  }
}

export default ClientError;
