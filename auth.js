const axios = require("axios");

// Module-level cache (survives warm invocations on same Vercel instance)
let tokenCache = {
  accessToken: null,
  refreshToken: null,
  expiresAt: 0,
};

const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";

/**
 * Get a valid CJ access token (auto-refreshes if expired)
 */
async function getCJToken() {
  const now = Date.now();

  // If token is still valid (with 5 min buffer), return it
  if (tokenCache.accessToken && now < tokenCache.expiresAt - 5 * 60 * 1000) {
    return tokenCache.accessToken;
  }

  // If we have a refresh token, try to refresh
  if (tokenCache.refreshToken) {
    try {
      const res = await axios.post(`${CJ_BASE}/authentication/refreshAccessToken`, {
        refreshToken: tokenCache.refreshToken,
      });

      if (res.data?.result === true) {
        const { accessToken, refreshToken, accessTokenExpiryDate } = res.data.data;
        tokenCache = {
          accessToken,
          refreshToken,
          expiresAt: new Date(accessTokenExpiryDate).getTime(),
        };
        console.log("CJ token refreshed successfully");
        return accessToken;
      }
    } catch (err) {
      console.warn("Token refresh failed, re-authenticating...", err.message);
    }
  }

  // Fresh authentication
  const email = process.env.CJ_EMAIL;
  const apiKey = process.env.CJ_API_KEY;

  if (!email || !apiKey) {
    throw new Error("CJ_EMAIL or CJ_API_KEY env variables not set");
  }

  const res = await axios.post(`${CJ_BASE}/authentication/getAccessToken`, {
    email,
    password: apiKey, // CJ calls it "password" but it's your API key
  });

  if (res.data?.result !== true) {
    throw new Error(`CJ auth failed: ${JSON.stringify(res.data)}`);
  }

  const { accessToken, refreshToken, accessTokenExpiryDate } = res.data.data;
  tokenCache = {
    accessToken,
    refreshToken,
    expiresAt: new Date(accessTokenExpiryDate).getTime(),
  };

  console.log("CJ token obtained successfully");
  return accessToken;
}

module.exports = { getCJToken };
