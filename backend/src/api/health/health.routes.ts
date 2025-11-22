// hono
import { Hono } from "hono";

// controllers
import { healthController } from "./health.controller.js";

const healthRoutes = new Hono();

// Basic health check
healthRoutes.get("/", healthController.getStatus);

export { healthRoutes };
