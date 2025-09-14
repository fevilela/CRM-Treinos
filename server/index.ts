import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes.ts";
import { serveStatic, log } from "./vite";

const app = express();

// Trust proxy for secure cookies behind Replit's HTTPS proxy
app.set("trust proxy", 1);

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  const replitDomain =
    process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN;
  const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];

  // Add Replit domains
  if (replitDomain) {
    allowedOrigins.push(`https://${replitDomain}`);
    allowedOrigins.push(`http://${replitDomain}`);
  }

  if ((origin && allowedOrigins.includes(origin)) || !origin) {
    res.header(
      "Access-Control-Allow-Origin",
      origin ||
        (replitDomain ? `https://${replitDomain}` : "http://localhost:3000")
    );
  }

  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Server error:", err);
    res.status(status).json({ message });
  });

  // Final fallback for unmatched API routes BEFORE Vite
  app.use("/api/*", (req, res) => {
    res.status(404).json({ message: "API endpoint not found" });
  });

  // Serve static uploads
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use port 3000 for Replit environment (both frontend and backend on same server)
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
