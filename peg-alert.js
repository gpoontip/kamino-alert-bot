require("dotenv").config();
const { getPegStatus, sendTelegramAlert } = require("./utils");

const MAX_DEPEG_PCT = parseFloat(process.env.MAX_DEPEG_PCT);

const checkPeg = async () => {
  const { text, pegRatio, proximityPct } = await getPegStatus();

  if (pegRatio && proximityPct <= MAX_DEPEG_PCT) {
    await sendTelegramAlert(text);
  } else {
    console.log("✅ Peg safe, no alert sent.");
  }
};

checkPeg();
