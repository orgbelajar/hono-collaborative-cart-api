import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import ErrorHandler from "../middlewares/error";
import { authenticationController } from "../services/authentications/controller/authentication-controller";
import { cartController } from "../services/carts/controller/cart-controller";
import { categoryController } from "../services/categories/controller/category-controller";
import { collaborationController } from "../services/collaborations/controller/collaboration-controller";
import { exportController } from "../services/exports/controller/export-controller";
import { productController } from "../services/products/controller/product-controller";
import { userController } from "../services/users/controller/user-controller";

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
