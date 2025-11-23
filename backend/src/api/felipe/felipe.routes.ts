// hono
import { Hono } from "hono";

// controllers
import { felipeController } from "./felipe.controller.js";

const felipeRoutes = new Hono();

// Decision making
felipeRoutes.post(
  "/start-decision-making",
  felipeController.startDecisionMaking
);

// Expand consequence (generate consequences of a consequence)
felipeRoutes.post(
  "/expand-consequence",
  felipeController.expandConsequence
);

// Decision history
felipeRoutes.get("/decisions", felipeController.getDecisions);
felipeRoutes.get("/decisions/:id", felipeController.getDecisionById);
felipeRoutes.delete("/decisions/:id", felipeController.deleteDecision);

export { felipeRoutes };
