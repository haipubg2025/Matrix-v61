import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isGeminiConfigured = !!process.env.GEMINI_API_KEY;

async function startServer() {
  // Initializing Express app
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());
  app.use(cookieParser());

  // API Routes
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
      console.log(`[API Request] ${req.method} ${req.path}`);
    }
    next();
  });

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      gemini: isGeminiConfigured,
      mode: "indexeddb-only"
    });
  });

  // Global Error Handler to prevent HTML responses for API errors
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Global Error:", err);
    if (req.path.startsWith("/api/")) {
      return res.status(500).json({ error: err.message || "Internal Server Error" });
    }
    next(err);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    // Use a middleware for the SPA fallback to avoid path-to-regexp issues in Express 5
    app.use((req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    // Matrix Engine running
  });
}

// Calling startServer
startServer().catch(err => {
  // Critical failure during startServer
  process.exit(1);
});
