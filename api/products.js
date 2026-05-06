const axios = require("axios");
const { getCJToken } = require("./auth");

const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";
const MARGIN = Number(process.env.MARGIN_AMOUNT) || 90;

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const token = await getCJToken();
    const { pageNum = 1, pageSize = 20, keyword = "" } = req.query;

    const response = await axios.get(`${CJ_BASE}/product/list`, {
      headers: { "CJ-Access-Token": token },
      params: {
        pageNum: Number(pageNum),
        pageSize: Number(pageSize),
        ...(keyword && { productName: keyword }),
      },
    });

    if (!response.data?.result) {
      return res.status(502).json({
        error: "CJ API error",
        details: response.data?.message,
      });
    }

    const raw = response.data.data?.list || [];

    const products = raw.map((p) => ({
      id: p.pid,
      name: p.productName,
      image: p.productImage,
      originalPrice: Number(p.sellPrice) || 0,
      price: (Number(p.sellPrice) || 0) + MARGIN,
      stock: p.variants?.length || 0,
      category: p.categoryName,
    }));

    return res.status(200).json({
      success: true,
      total: response.data.data?.total || products.length,
      products,
    });

  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch products",
      details: error.message,
    });
  }
};
