const express = require("express");
const axios = require("axios");
const { getCJToken } = require("./auth");

const router = express.Router();
const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";

// Margin — Firebase se bhi set kar sakte hain baad mein
const getMargin = () => Number(process.env.MARGIN_AMOUNT) || 90;

// ─── Product List ──────────────────────────────────────
// GET /api/products
// GET /api/products?keyword=shirt&page=1&limit=20
router.get("/", async (req, res) => {
  try {
    const token = await getCJToken();
    const { keyword = "", page = 1, limit = 20, category = "" } = req.query;
    const margin = getMargin();

    const params = {
      pageNum: Number(page),
      pageSize: Math.min(Number(limit), 50), // max 50
      ...(keyword && { productName: keyword }),
      ...(category && { categoryId: category }),
    };

    const response = await axios.get(`${CJ_BASE}/product/list`, {
      headers: { "CJ-Access-Token": token },
      params,
      timeout: 15000,
    });

    if (!response.data?.result) {
      return res.status(502).json({
        success: false,
        error: "CJ API error",
        message: response.data?.message,
      });
    }

    const raw = response.data.data?.list || [];
    const total = response.data.data?.total || raw.length;

    const products = raw.map((p) => formatProduct(p, margin));

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      products,
    });
  } catch (error) {
    console.error("Products fetch error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Products fetch karne mein problem",
      details: error.message,
    });
  }
});

// ─── Single Product Detail ─────────────────────────────
// GET /api/products/:pid
router.get("/:pid", async (req, res) => {
  try {
    const token = await getCJToken();
    const { pid } = req.params;
    const margin = getMargin();

    const response = await axios.get(`${CJ_BASE}/product/query`, {
      headers: { "CJ-Access-Token": token },
      params: { pid },
      timeout: 15000,
    });

    if (!response.data?.result) {
      return res.status(404).json({
        success: false,
        error: "Product nahi mila",
      });
    }

    const product = formatProduct(response.data.data, margin);

    return res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("Product detail error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Product detail fetch karne mein problem",
      details: error.message,
    });
  }
});

// ─── Search Products ───────────────────────────────────
// GET /api/products/search?q=shirt
router.get("/search", async (req, res) => {
  try {
    const token = await getCJToken();
    const { q = "", page = 1, limit = 20 } = req.query;
    const margin = getMargin();

    if (!q) {
      return res.status(400).json({ success: false, error: "Search query required" });
    }

    const response = await axios.get(`${CJ_BASE}/product/list`, {
      headers: { "CJ-Access-Token": token },
      params: { pageNum: Number(page), pageSize: Number(limit), productName: q },
      timeout: 15000,
    });

    const raw = response.data.data?.list || [];
    const products = raw.map((p) => formatProduct(p, margin));

    return res.status(200).json({
      success: true,
      query: q,
      total: response.data.data?.total || products.length,
      products,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ─── Helper: Product Format ────────────────────────────
function formatProduct(p, margin) {
  const basePrice = Number(p.sellPrice) || 0;
  return {
    id: p.pid,
    name: p.productName,
    image: p.productImage,
    images: p.productImageSet
      ? p.productImageSet.split(",").filter(Boolean)
      : [p.productImage],
    originalPrice: basePrice,
    price: basePrice + margin,
    margin,
    category: p.categoryName,
    categoryId: p.categoryId,
    description: p.description || "",
    stock: p.variants?.reduce((sum, v) => sum + (v.variantStock || 0), 0) || 0,
    variants: (p.variants || []).map((v) => ({
      id: v.vid,
      name: v.variantName,
      sku: v.variantSku,
      price: (Number(v.variantSellPrice) || basePrice) + margin,
      originalPrice: Number(v.variantSellPrice) || basePrice,
      stock: v.variantStock || 0,
      image: v.variantImage || p.productImage,
    })),
    weight: p.weight,
    shippingTime: p.shippingTime,
    rating: (Math.random() * (5 - 3.5) + 3.5).toFixed(1), // Placeholder
  };
}

module.exports = router;
