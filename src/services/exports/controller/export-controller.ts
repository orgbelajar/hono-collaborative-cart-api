import { Hono } from "hono";
import { authMiddleware } from "../../../middlewares/auth";
import { heavyOperationRateLimiter } from "../../../middlewares/rate-limiter";
import type { ApplicationVariables } from "../../../model/app-model";
import type { ExportOrderMessage } from "../../../model/export-model";
import { ExportService } from "../publishers/export-service";
import { exportOrderPayloadSchema } from "../validator/schema";

export const exportController = new Hono<{
  Variables: ApplicationVariables;
}>();

exportController.use(authMiddleware);

exportController.post("/api/export/order/:cartId", heavyOperationRateLimiter, async (c) => {
  const request = exportOrderPayloadSchema.parse(await c.req.json());
  const credential = c.get("user");
  const cartId = c.req.param("cartId");

  const message: ExportOrderMessage = {
    cartId: cartId,
    targetEmail: request.targetEmail,
    userId: credential.id,
    username: credential.username,
    requestedAt: new Date().toISOString(),
  };

  await ExportService.sendMessage("export.order", message);

  return c.json(
    {
      status: "success",
      message:
        "Permintaan export laporan pesanan sedang diproses. Laporan pesanan akan dikirim ke email yang diminta.",
    },
    201,
  );
});
