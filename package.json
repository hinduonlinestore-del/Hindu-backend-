const axios = require("axios");
const { getCJToken } = require("./auth");

const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";
const MARGIN = Number(process.env.MARGIN_AMOUNT) || 90; // ₹90 default

module.exports = async (req, res) => {
  // CORS headers — allow your frontend domain
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const token = await getCJToken();

    const { pageNum = 1, pageSize = 20, category = "", keyword = "" } = req.query;

    const response = await axios.get(`${CJ_BASE}/product/list`, {
      headers: { "CJ-Access-Token": token },
      params: {
        pageNum: Number(pageNum),
        pageSize: Number(pageSize),
        ...(category && { categoryId: category }),
        ...(keyword && { productName: keyword }),
      },
    });

    if (!response.data?.result) {
      return res.status(502).json({
        error: "CJ API error",
        details: response.data?.message || "Unknown CJ error",
      });
    }

    const raw = response.data.data?.list || [];
    const total = response.data.data?.total || raw.length;

    const products = raw.map((p) => ({
      id: p.pid,
      name: p.productName,
      image: p.productImage,
      images: p.productImageSet ? p.productImageSet.split(",") : [p.productImage],
      originalPrice: Number(p.sellPrice) || 0,
      price: (Number(p.sellPrice) || 0) + MARGIN,
      margin: MARGIN,
      description: p.description || "",
      categoryId: p.categoryId,
      categoryName: p.categoryName,
      stock: p.variants?.reduce((sum, v) => sum + (v.variantStock || 0), 0) || 0,
      variants: (p.variants || []).map((v) => ({
        id: v.vid,
        name: v.variantName,
        sku: v.variantSku,
        price: (Number(v.variantSellPrice) || Number(p.sellPrice) || 0) + MARGIN,
        stock: v.variantStock || 0,
        image: v.variantImage || p.productImage,
      })),
      weight: p.weight,
      shippingTime: p.shippingTime,
      supplierCountry: p.supplierCountry,
    }));

    return res.status(200).json({
      success: true,
      total,
      page: Number(pageNum),
      pageSize: Number(pageSize),
      products,
    });
  } catch (error) {
    console.error("Products API error:", error.message);

    // Auth errors — clear cache hint
    if (error.response?.status === 401) {
      return res.status(401).json({
        error: "CJ authentication failed",
        hint: "Check CJ_EMAIL and CJ_API_KEY env variables in Vercel",
        details: error.message,
      });
    }

    return res.status(500).json({
      error: "Failed to fetch products",
      details: error.message,
    });
  }
};
