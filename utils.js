// Required packages
const axios = require("axios");
require("dotenv").config();

const MARKET_PUBKEY = "7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF";
const SOL_RESERVE_PUBKEY = "d4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q";
const CLUSTER = "mainnet-beta";
const FREQUENCY = "hour";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Token addresses
const JITOSOL_ADDRESS = "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn";
const SOL_ADDRESS = "So11111111111111111111111111111111111111112";

const MAX_DEPEG_PCT = process.env.MAX_DEPEG_PCT;
const LIQUIDATION_PEG = process.env.LIQUIDATION_PEG;

const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;
const options = {
  method: "GET",
  headers: {
    "x-chain": "solana",
    accept: "application/json",
    "X-API-KEY": BIRDEYE_API_KEY,
  },
};

// === Fetch JitoSOL Staking Yield ===
async function fetchJitoSOLStakingAPY() {
  const now = new Date();
  const end = now.toISOString();
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago

  const url = `https://api.kamino.finance/staking-yields/tokens/${JITOSOL_ADDRESS}/history?start=${start}&end=${end}`;

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getTokenPrice = async (address) => {
  const url = `https://public-api.birdeye.so/defi/price?address=${address}`;
  let attempts = 0;

  while (attempts < 5) {
    try {
      const res = await axios.get(url, options);
      return res.data?.data?.value;
    } catch (err) {
      if (err.response?.status === 429) {
        console.warn("⏳ Rate limited. Retrying in 5s...");
        await sleep(5000);
        attempts++;
      } else {
        throw err;
      }
    }
  }

  throw new Error("❌ Failed to fetch price after 5 attempts");
};

const getPegStatusViaBirdeye = async () => {
  try {
    const jitoSolUsd = await getTokenPrice(JITOSOL_ADDRESS);
    await sleep(1000);
    const solUsd = await getTokenPrice(SOL_ADDRESS);

    const pegRatio = jitoSolUsd / solUsd;
    const distanceFromLiquidation = pegRatio - LIQUIDATION_PEG;
    const proximityPct = (distanceFromLiquidation / LIQUIDATION_PEG) * 100;

    const statusMsg =
      `📊 jitoSOL Peg Status\n\n` +
      `🟦 jitoSOL: $${jitoSolUsd.toFixed(2)}\n` +
      `🟥 SOL: $${solUsd.toFixed(2)}\n` +
      `🔁 Peg Ratio: ${pegRatio.toFixed(4)} SOL\n` +
      `📉 Distance from Liquidation (${LIQUIDATION_PEG}): ${proximityPct.toFixed(
        2
      )}%\n\n` +
      (proximityPct <= MAX_DEPEG_PCT
        ? `⚠️ Danger: Within ${MAX_DEPEG_PCT}% of liquidation!`
        : `✅ Safe: Outside liquidation danger zone.`);

    return {
      text: statusMsg,
      pegRatio,
      proximityPct,
    };
  } catch (err) {
    return {
      text: `❌ Error fetching peg status: ${err.message}`,
      pegRatio: null,
      proximityPct: null,
    };
  }
};

const getPegStatus = async () => {
  try {
    const amount = 1_000_000_000; // 1 jitoSOL (9 decimals)

    // 1. Fetch jitoSOL → SOL ratio from Jupiter
    const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${JITOSOL_ADDRESS}&outputMint=${SOL_ADDRESS}&amount=${amount}`;
    const quoteRes = await axios.get(quoteUrl);
    const outAmount = parseFloat(quoteRes.data.outAmount) / 1_000_000_000;

    const pegRatio = outAmount;

    // 2. Get SOL/USD from CoinGecko
    const solPriceRes = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
    );
    const solUsd = solPriceRes.data.solana.usd;
    const jitoSolUsd = pegRatio * solUsd;

    // 3. Calculate liquidation proximity
    const LIQUIDATION_PEG = parseFloat(process.env.LIQUIDATION_PEG || "0.95");
    const MAX_DEPEG_PCT = parseFloat(process.env.MAX_DEPEG_PCT || "5");

    const distance = pegRatio - LIQUIDATION_PEG;
    const proximityPct = (distance / LIQUIDATION_PEG) * 100;

    const text =
      `📊 jitoSOL Peg Status\n\n` +
      `🟦 jitoSOL: $${jitoSolUsd.toFixed(2)}\n` +
      `🟥 SOL: $${solUsd.toFixed(2)}\n` +
      `🔁 Peg Ratio: ${pegRatio.toFixed(4)} SOL\n` +
      `📉 Distance from Liquidation (${LIQUIDATION_PEG}): ${proximityPct.toFixed(
        2
      )}%\n\n` +
      (proximityPct <= MAX_DEPEG_PCT
        ? `⚠️ Danger: Within ${MAX_DEPEG_PCT}% of liquidation!`
        : `✅ Safe: Outside liquidation danger zone.`);

    return { text, pegRatio, proximityPct };
  } catch (err) {
    return {
      text: `❌ Error fetching peg status: ${err.message}`,
      pegRatio: null,
      proximityPct: null,
    };
  }
};

const sendTelegramAlert = async (msg) => {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: msg,
    });
    console.log("🚨 Telegram alert sent.");
  } catch (err) {
    console.error("❌ Telegram alert failed:", err.message);
  }
};

module.exports = {
  fetchSolBorrowRate,
  fetchJitoSOLStakingAPY,
  getPegStatus,
  sendTelegramAlert,
};
