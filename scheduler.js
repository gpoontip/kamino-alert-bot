require("dotenv").config();
const axios = require("axios");
const { fetchSolBorrowRate, fetchJitoSOLStakingAPY } = require("./utils");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SPREAD_THRESHOLD = parseFloat(process.env.SPREAD_THRESHOLD); // % net spread alert

// === Send Telegram Alert ===
async function sendTelegramAlert(spread, jitoApy, borrowApy) {
  const message =
    `⚠️ Multiply Yield Spread Alert ⚠️\n\n` +
    `📉 Spread: ${spread.toFixed(2)}%\n` +
    `🔵 JitoSOL APY: ${jitoApy.toFixed(2)}%\n` +
    `🔴 SOL Borrow APY: ${borrowApy.toFixed(2)}%`;

  try {
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
      }
    );
    console.log("🚨 Telegram alert sent.");
  } catch (err) {
    console.error("❌ Telegram alert failed:", err.message);
  }
}

// === Run the Monitor ===
async function runMonitor() {
  const [jitoApy, borrowApy] = await Promise.all([
    fetchJitoSOLStakingAPY(),
    fetchSolBorrowRate(),
  ]);

  if (jitoApy == null || borrowApy == null) return;

  const spread = jitoApy - borrowApy;
  const latest =
    `📊 JitoSOL APY: ${jitoApy.toFixed(2)}% | ` +
    `SOL Borrow APY: ${borrowApy.toFixed(2)}% | ` +
    `Net Spread: ${spread.toFixed(2)}%`;
  console.log(latest);

  if (spread < SPREAD_THRESHOLD) {
    await sendTelegramAlert(spread, jitoApy, borrowApy);
  } else {
    console.log("✅ Spread is healthy.");
  }
}

runMonitor();
