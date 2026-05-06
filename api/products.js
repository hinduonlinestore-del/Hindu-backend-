const axios = require("axios");

module.exports = async (req, res) => {
    try {
        const response = await axios.get(
            "https://developers.cjdropshipping.com/api2.0/v1/product/list",
            {
                headers: {
                    "CJ-Access-Token": process.env.CJ_API_KEY
                }
            }
        );

        const products = response.data.data.map(product => ({
            id: product.pid,
            name: product.productName,
            image: product.productImage,
            originalPrice: Number(product.sellPrice),
            price: Number(product.sellPrice) + 90,
            description: product.description || "",
            stock: product.variants?.length || 0
        }));

        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({
            error: "Failed to fetch products",
            details: error.message
        });
    }
};
