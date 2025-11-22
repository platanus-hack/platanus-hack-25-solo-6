// hono
import type { Context } from "hono";

// controller
export const healthController = {
  // get basic health status
  getStatus: (c: Context) => {
    return c.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      timestampChile: new Date().toLocaleString("en-CA", {
        timeZone: "America/Santiago",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).replace(", ", "T"),
      uptime: process.uptime(),
    });
  },
};
