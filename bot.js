require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { fetchSolBorrowRate, fetchJitoSOLStakingAPY } = require("./utils");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/\/(yield|status)/, async (msg) => {
  const chatId = msg.chat.id;
  const [jitoApy, borrowApy] = await Promise.all([
    fetchJitoSOLStakingAPY(),
    fetchSolBorrowRate(),
  ]);

  if (jitoApy === null || borrowApy === null) {
    return bot.sendMessage(chatId, "⚠️ Error fetching yield data.");
  }

  const spread = jitoApy - borrowApy;
  const message =
    `📊 *Kamino Multiply Yield Status*\n\n` +
    `🔵 JitoSOL APY: ${jitoApy.toFixed(2)}%\n` +
    `🔴 SOL Borrow APY: ${borrowApy.toFixed(2)}%\n` +
    `📉 Net Spread: ${spread.toFixed(2)}%`;

  bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
});
