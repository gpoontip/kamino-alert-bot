// Required packages
const axios = require("axios");
require("dotenv").config();

const MARKET_PUBKEY = "7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF";
const SOL_RESERVE_PUBKEY = "d4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q";
const JITO_MINT = "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn";
const CLUSTER = "mainnet-beta";
const FREQUENCY = "hour";

// === Fetch JitoSOL Staking Yield ===
async function fetchJitoSOLStakingAPY() {
  const now = new Date();
  const end = now.toISOString();
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago

  const url = `https://api.kamino.finance/staking-yields/tokens/${JITO_MINT}/history?start=${start}&end=${end}`;

  try {
    const response = await axios.get(url);
    const history = response.data;

    if (!history || history.length === 0) {
      console.log("⚠️ No staking yield data for JitoSOL.");
      return null;
    }

    const latestEntry = history[0]; // Most recent yield appears first
    const jitoAPY = parseFloat(latestEntry.apy) * 100;
    return jitoAPY;
  } catch (err) {
    console.error("❌ Error fetching JitoSOL staking yield:", err.message);
    return null;
  }
}

// === Fetch SOL Borrow Rate ===
async function fetchSolBorrowRate() {
  const now = new Date();
  const end = now.toISOString(); // Now
  const start = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(); // last 3 hours

  const url = `https://api.kamino.finance/kamino-market/${MARKET_PUBKEY}/reserves/${SOL_RESERVE_PUBKEY}/metrics/history?env=${CLUSTER}&start=${start}&end=${end}&frequency=${FREQUENCY}`;

  try {
    const response = await axios.get(url);
    const history = response.data.history;

    if (!history || history.length === 0) {
      console.log("⚠️ No borrow rate history found in the time range.");
      return;
    }

    const latestEntry = history[history.length - 1]; // Most recent rate appears last
    const borrowRate = parseFloat(latestEntry.metrics.borrowInterestAPY) * 100;
    return borrowRate;
  } catch (err) {
    console.error("Error fetching borrow rate:", err.message);
  }
}

module.exports = {
  fetchSolBorrowRate,
  fetchJitoSOLStakingAPY,
};
