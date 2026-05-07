const express = require("express");
const axios = require("axios");
const { getCJToken } = require("./auth");

const router = express.Router();
const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";

// ─── Create Order ──────────────────────────────────────
// POST /api/orders
router.post("/", async (req, res) => {
  try {
    const { orderId, products, shipping } = req.body;

    // Validation
    if (!orderId) return res.status(400).json({ success: false, error: "orderId required" });
    if (!products?.length) return res.status(400).json({ success: false, error: "products required" });
    if (!shipping?.name || !shipping?.address || !shipping?.city) {
      return res.status(400).json({ success: false, error: "Shipping details incomplete" });
    }

    const token = await getCJToken();

    const cjPayload = {
      orderNumber: String(orderId),
      shippingZip: shipping.zip || "",
      shippingCountryCode: "IN",
      shippingCountry: "India",
      shippingProvince: shipping.state || "",
      shippingCity: shipping.city,
      shippingAddress: shipping.address,
      shippingAddress2: shipping.address2 || "",
      shippingCustomerName: shipping.name,
      shippingPhone: shipping.phone || "",
      remark: `Hindu Store Order #${orderId}`,
      products: products.map((p) => ({
        vid: p.vid,
        quantity: Number(p.quantity) || 1,
      })),
    };

    const response = await axios.post(
      `${CJ_BASE}/shopping/order/createOrder`,
      cjPayload,
      {
        headers: { "CJ-Access-Token": token },
        timeout: 15000,
      }
    );

    if (!response.data?.result) {
      return res.status(502).json({
        success: false,
        error: "CJ order create karne mein problem",
        details: response.data?.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order successfully placed!",
      cjOrderId: response.data.data?.orderId,
      orderId,
    });
  } catch (error) {
    console.error("Order create error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Order place karne mein problem",
      details: error.message,
    });
  }
});

// ─── Order Status ──────────────────────────────────────
// GET /api/orders/:orderId/status
router.get("/:orderId/status", async (req, res) => {
  try {
    const token = await getCJToken();
    const { orderId } = req.params;

    const response = await axios.get(`${CJ_BASE}/shopping/order/list`, {
      headers: { "CJ-Access-Token": token },
      params: { orderNum: orderId },
      timeout: 15000,
    });

    if (!response.data?.result) {
      return res.status(404).json({ success: false, error: "Order nahi mila" });
    }

    return res.status(200).json({
      success: true,
      order: response.data.data,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
