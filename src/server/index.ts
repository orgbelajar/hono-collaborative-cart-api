import { Hono } from "hono";
import { userController } from "../services/users/controller/index";
import ErrorHandler from "../middlewares/error";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/", userController);

app.onError(ErrorHandler);

export default app;
