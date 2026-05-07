const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const productRoutes = require("./api/products");
const orderRoutes = require("./api/orders");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json());

// Rate limiting — 100 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
});
app.use(limiter);

// ─── Routes ───────────────────────────────────────────
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// ─── Health Check ─────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "Hindu Store Backend is Live! 🚀",
    version: "2.0.0",
    endpoints: {
      products: "/api/products",
      search: "/api/products?keyword=shirt",
      orders: "/api/orders",
    },
  });
});

// ─── 404 Handler ──────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(500).json({ error: "Internal server error", details: err.message });
});

// ─── Start Server ─────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Hindu Store Backend running on port ${PORT}`);
});
