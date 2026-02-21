import app from "./server/index";

const host = process.env.NODE_ENV !== "production" ? "localhost" : "0.0.0.0";
const port = Number(process.env.PORT) || 3000;

export default {
  hostname: host,
  port: port,
  fetch: app.fetch,
};
