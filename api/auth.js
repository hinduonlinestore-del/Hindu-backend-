const axios = require("axios");

const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";

// Token cache — memory mein store hota hai
let tokenCache = {
  accessToken: null,
  refreshToken: null,
  expiresAt: 0,
};

/**
 * CJ Dropshipping ka valid access token return karta hai
 * Auto refresh karta hai agar expire ho gaya ho
 */
async function getCJToken() {
  const now = Date.now();

  // Token valid hai toh seedha return karo
  if (tokenCache.accessToken && now < tokenCache.expiresAt - 5 * 60 * 1000) {
    return tokenCache.accessToken;
  }

  // Refresh token se naya token lo
  if (tokenCache.refreshToken) {
    try {
      const res = await axios.post(
        `${CJ_BASE}/authentication/refreshAccessToken`,
        { refreshToken: tokenCache.refreshToken },
        { timeout: 10000 }
      );

      if (res.data?.result === true) {
        const { accessToken, refreshToken, accessTokenExpiryDate } = res.data.data;
        tokenCache = {
          accessToken,
          refreshToken,
          expiresAt: new Date(accessTokenExpiryDate).getTime(),
        };
        console.log("✅ CJ Token refreshed successfully");
        return accessToken;
      }
    } catch (err) {
      console.warn("⚠️ Token refresh failed, re-authenticating...");
    }
  }

  // Fresh login
  const email = process.env.CJ_EMAIL;
  const apiKey = process.env.CJ_API_KEY;

  if (!email || !apiKey) {
    throw new Error("CJ_EMAIL ya CJ_API_KEY environment variable set nahi hai");
  }

  const res = await axios.post(
    `${CJ_BASE}/authentication/getAccessToken`,
    { email, password: apiKey },
    { timeout: 10000 }
  );

  if (res.data?.result !== true) {
    throw new Error(`CJ Auth Failed: ${res.data?.message || "Unknown error"}`);
  }

  const { accessToken, refreshToken, accessTokenExpiryDate } = res.data.data;
  tokenCache = {
    accessToken,
    refreshToken,
    expiresAt: new Date(accessTokenExpiryDate).getTime(),
  };

  console.log("✅ CJ Token obtained successfully");
  return accessToken;
}

module.exports = { getCJToken };
