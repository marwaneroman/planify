import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import apiRoutes from "./routes/api.js";

const PORT = process.env.PORT || 3001;
const app = express();

// Allow localhost / 127.0.0.1 (any port) and any origins from CORS_ORIGIN
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:8080";
const allowedOrigins = corsOrigin.split(",").map((o) => o.trim()).filter(Boolean);
function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  try {
    const u = new URL(origin);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return true;
  } catch (_) {}
  return false;
}
const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/api", apiRoutes);

app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
