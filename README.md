# 📊 Kamino Yield Monitor Bot

A modular Telegram bot that monitors the **yield spread between JitoSOL staking APY and Kamino SOL borrow APY**. It sends:

- ⏰ **Automated alerts** when the spread falls below a target threshold (default: 1%)
- 💬 Real-time responses to Telegram `/yield` or `/status` commands

Built for managing **Kamino Multiply** risk and efficiency like a DeFi sniper 🥷 on Solana.

---

## ⚙️ Features

- ✅ Fetches live **JitoSOL staking APY** from Kamino API
- ✅ Fetches live **SOL borrow APY** from Kamino lending reserve
- ✅ Sends **Telegram alerts** when `net spread < threshold`
- ✅ Supports `/yield` command via polling for live data
- ✅ Modular: separates scheduler, command bot, and shared utils
- ✅ Easily deployable on **Render**, **Heroku**, or **Fly.io**

---

## 🧱 Project Structure

```
kamino-yield-bot/
├── .env                # environment variables
├── package.json        # dependencies and scripts
├── Procfile            # for Render/Heroku process definition
├── bot.js              # handles Telegram /yield commands
├── scheduler.js        # handles periodic spread checks
├── utils.js            # shared API fetchers for APY & borrow rates
```

---

## 🚀 Deployment (Render)

### Step-by-step:

1. Push to GitHub
2. Go to [render.com](https://render.com)
3. Create **2 services**:
   - **Web service** → Start command: `npm run start-bot`
   - **Background Worker** → Start command: `npm run start-scheduler`
4. Set the following **environment variables** on both:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token
   TELEGRAM_CHAT_ID=your_telegram_user_or_group_id
   ```

---

## 🧪 Usage

### 💬 Telegram Commands

- `/yield` or `/status` — returns current JitoSOL APY, SOL borrow rate, and net yield spread

### ⏰ Scheduler

- Runs every 15 minutes (adjustable)
- Sends alert if:  
  `JitoSOL APY - SOL Borrow APY < 1%`

---

## 📦 Scripts

```bash
npm run start-bot         # starts Telegram command listener
npm run start-scheduler   # starts auto-monitor + alert bot
```

---

## 📚 APIs Used

- [Kamino Lending Reserve Metrics](https://github.com/kamino-finance/kamino-api-docs)
- [Kamino Staking Yields](https://github.com/kamino-finance/kamino-api-docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

## 🧠 Credits

Built by [Gary Poon Tip](https://github.com/gpoontip)  
Powered by Solana, Kamino, Jito, and Alpha 🧬
