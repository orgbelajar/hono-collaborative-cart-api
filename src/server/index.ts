import { Hono } from "hono";
import { userController } from "../services/users/controller/index";
import { productController } from "../services/products/controller/index";
import { authenticationController } from "../services/authentications/controller/index";
import { cartController } from "../services/carts/controller/index";
import { collaborationController } from "../services/collaborations/controller/index";
import ErrorHandler from "../middlewares/error";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/", authenticationController);
app.route("/", userController);
app.route("/", productController);
app.route("/", cartController);
app.route("/", collaborationController);

app.onError(ErrorHandler);

export default app;
