const axios = require("axios");

let tokenCache = {
  accessToken: null,
  refreshToken: null,
  expiresAt: 0,
};

const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";

async function getCJToken() {
  const now = Date.now();

  if (tokenCache.accessToken && now < tokenCache.expiresAt - 5 * 60 * 1000) {
    return tokenCache.accessToken;
  }

  if (tokenCache.refreshToken) {
    try {
      const res = await axios.post(`${CJ_BASE}/authentication/refreshAccessToken`, {
        refreshToken: tokenCache.refreshToken,
      });
      if (res.data?.result === true) {
        const { accessToken, refreshToken, accessTokenExpiryDate } = res.data.data;
        tokenCache = { accessToken, refreshToken, expiresAt: new Date(accessTokenExpiryDate).getTime() };
        return accessToken;
      }
    } catch (err) {
      console.warn("Refresh failed, re-authenticating...");
    }
  }

  // CJ ka poora key string directly password mein jaata hai
  const email = process.env.CJ_EMAIL;
  const fullKey = process.env.CJ_API_KEY;

  console.log("Trying CJ auth with email:", email);

  const res = await axios.post(`${CJ_BASE}/authentication/getAccessToken`, {
    email: email,
    password: fullKey,
  });

  console.log("CJ auth response:", JSON.stringify(res.data));

  if (res.data?.result !== true) {
    throw new Error(`CJ auth failed: ${JSON.stringify(res.data)}`);
  }

  const { accessToken, refreshToken, accessTokenExpiryDate } = res.data.data;
  tokenCache = { accessToken, refreshToken, expiresAt: new Date(accessTokenExpiryDate).getTime() };

  return accessToken;
}

module.exports = { getCJToken };
