import "dotenv/config";
import mongoose from "mongoose";
import app from "./src/app.js";

const PORT = process.env.PORT || 3000;

// ─── Mongoose event listeners ──────────────────────────────────────────────────
mongoose.connection.on("disconnected", () =>
  console.warn("[MongoDB] Connection lost — attempting to reconnect...")
);
mongoose.connection.on("error", (err) =>
  console.error("[MongoDB] Connection error:", err.message)
);
mongoose.connection.on("reconnected", () =>
  console.log("[MongoDB] Reconnected")
);

// ─── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = (signal) => async () => {
  console.log(`\n[Server] ${signal} received — shutting down...`);
  await mongoose.connection.close();
  console.log("[MongoDB] Connection closed");
  process.exit(0);
};
process.on("SIGTERM", shutdown("SIGTERM"));
process.on("SIGINT",  shutdown("SIGINT"));

// ─── Start ─────────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("[MongoDB] Connected");
    app.listen(PORT, () =>
      console.log(`[Server] Running on http://localhost:${PORT} (${process.env.NODE_ENV || "development"})`)
    );
  })
  .catch((err) => {
    console.error("[MongoDB] Initial connection failed:", err.message);
    process.exit(1);
  });