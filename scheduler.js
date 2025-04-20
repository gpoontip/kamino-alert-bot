require("dotenv").config();
const axios = require("axios");
const {
  fetchSolBorrowRate,
  fetchJitoSOLStakingAPY,
  sendTelegramAlert,
} = require("./utils");

const SPREAD_THRESHOLD = parseFloat(process.env.SPREAD_THRESHOLD); // % net spread alert

// === Send Telegram Alert ===
function generateMessage(spread, jitoApy, borrowApy) {
  const message =
    `⚠️ Multiply Yield Spread Alert ⚠️\n\n` +
    `📉 Spread: ${spread.toFixed(2)}%\n` +
    `🔵 JitoSOL APY: ${jitoApy.toFixed(2)}%\n` +
    `🔴 SOL Borrow APY: ${borrowApy.toFixed(2)}%`;

  return message;
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
    const message = generateMessage(spread, jitoApy, borrowApy);
    await sendTelegramAlert(message);
  } else {
    console.log("✅ Spread is healthy.");
  }
}

runMonitor();
