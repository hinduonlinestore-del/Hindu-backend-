const axios = require("axios");
const { getCJToken } = require("./auth");

const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { orderId, products, shipping } = req.body;

    if (!orderId || !products?.length || !shipping) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const token = await getCJToken();

    const cjOrder = await axios.post(
      `${CJ_BASE}/shopping/order/createOrder`,
      {
        orderNumber: orderId,
        shippingZip: shipping.zip,
        shippingCountryCode: "IN",
        shippingProvince: shipping.state,
        shippingCity: shipping.city,
        shippingAddress: shipping.address,
        shippingCustomerName: shipping.name,
        shippingPhone: shipping.phone,
        products: products.map((p) => ({ vid: p.vid, quantity: p.quantity })),
      },
      { headers: { "CJ-Access-Token": token } }
    );

    if (!cjOrder.data?.result) {
      return res.status(502).json({ error: "CJ order failed", details: cjOrder.data?.message });
    }

    return res.status(200).json({ success: true, cjOrderId: cjOrder.data.data?.orderId });

  } catch (error) {
    return res.status(500).json({ error: "Order failed", details: error.message });
  }
};
