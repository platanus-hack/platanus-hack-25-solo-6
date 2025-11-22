// hono
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";

// dotenv
import dotenv from "dotenv";

// routes
import { healthRoutes } from "./api/health/health.routes.js";

// load env
dotenv.config();

const app = new Hono();

// middleware - only use logger in non-test environments
if (process.env["NODE_ENV"] !== "test") {
  app.use("*", logger());
}

app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "x-user-email"],
    credentials: true,
  })
);
app.use("*", prettyJSON());

// Routes
app.route("/health", healthRoutes);

export default app;
