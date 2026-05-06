const axios = require("axios");
const { getCJToken } = require("./auth");

const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      orderId,       // your internal Firebase order ID
      products,      // [{ vid, quantity }]
      shipping,      // { name, phone, email, address, city, state, zip, country }
    } = req.body;

    if (!orderId || !products?.length || !shipping) {
      return res.status(400).json({ error: "Missing required order fields" });
    }

    const token = await getCJToken();

    // Create order on CJ
    const cjOrder = await axios.post(
      `${CJ_BASE}/shopping/order/createOrder`,
      {
        orderNumber: orderId,
        shippingZip: shipping.zip,
        shippingCountry: shipping.country || "CN",
        shippingCountryCode: shipping.countryCode || "IN",
        shippingProvince: shipping.state,
        shippingCity: shipping.city,
        shippingAddress: shipping.address,
        shippingCustomerName: shipping.name,
        shippingPhone: shipping.phone,
        remark: `Hindu Store Order #${orderId}`,
        products: products.map((p) => ({
          vid: p.vid,
          quantity: p.quantity,
        })),
      },
      { headers: { "CJ-Access-Token": token } }
    );

    if (!cjOrder.data?.result) {
      return res.status(502).json({
        error: "CJ order creation failed",
        details: cjOrder.data?.message,
      });
    }

    return res.status(200).json({
      success: true,
      cjOrderId: cjOrder.data.data?.orderId,
      status: "forwarded_to_supplier",
    });
  } catch (error) {
    console.error("Order API error:", error.message);
    return res.status(500).json({ error: "Order forwarding failed", details: error.message });
  }
};
