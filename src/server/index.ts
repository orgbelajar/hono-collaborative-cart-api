import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { userController } from "../services/users/controller/user-controller";
import { productController } from "../services/products/controller/product-controller";
import { authenticationController } from "../services/authentications/controller/authentication-controller";
import { cartController } from "../services/carts/controller/cart-controller";
import { collaborationController } from "../services/collaborations/controller/collaboration-controller";
import { categoryController } from "../services/categories/controller/category-controller";
import { exportController } from "../services/exports/controller/export-controller";
import ErrorHandler from "../middlewares/error";
import { cors } from "hono/cors";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.use(cors());

// Serving file statis dari folder images (akses dari response controller "/api/product/:id/image" fileLocation)
app.use(
  "/images/*", // /images + /1234567890-foto.jpg (nama file)
  // ./src/services/products/files + /images/ + 1234567890-foto.jpg
  serveStatic({
    root: "./src/services/products/files",
  }),
);

app.route("/", authenticationController);
app.route("/", userController);
app.route("/", productController);
app.route("/", categoryController);
app.route("/", cartController);
app.route("/", collaborationController);
app.route("/", exportController);

app.onError(ErrorHandler);

export default app;
