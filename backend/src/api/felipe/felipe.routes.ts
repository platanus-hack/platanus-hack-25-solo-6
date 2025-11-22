// hono
import { Hono } from "hono";

// controllers
import { felipeController } from "./felipe.controller.js";

const felipeRoutes = new Hono();

felipeRoutes.post(
  "/start-decision-making",
  felipeController.startDecisionMaking
);

export { felipeRoutes };
