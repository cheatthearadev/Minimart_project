require('dotenv').config();
const { TelegramBot } = require('node-telegram-bot-api');
const cron = require('node-cron');
const {
    loadState, saveState, runFullPoll, checkLowStock, sendDailyReport, fetchAPI
} = require('./notifications');

const BOT_TOKEN = process.env.BOT_TOKEN;
const API_URL = process.env.API_URL;
const LOW_STOCK_THRESHOLD = parseInt(process.env.LOW_STOCK_THRESHOLD) || 5;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
let chatId = process.env.OWNER_CHAT_ID ? parseInt(process.env.OWNER_CHAT_ID) : null;
let state = loadState();

console.log('[Bot] Mini Mart Bot starting...');
console.log(`[Bot] API URL: ${API_URL}`);
console.log(`[Bot] Owner Chat ID: ${chatId || 'NOT SET - send /start to bot'}`);
console.log(`[Bot] State: initialized=${state.initialized}, lastOrderId=${state.lastOrderId}, lastProductId=${state.lastProductId}`);

bot.onText(/\/start/, (msg) => {
    chatId = msg.chat.id;

    const fs = require('fs');
    const envPath = require('path').join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(/OWNER_CHAT_ID=.*/, `OWNER_CHAT_ID=${chatId}`);
    fs.writeFileSync(envPath, envContent);
    process.env.OWNER_CHAT_ID = chatId;

    state.initialized = false;
    saveState(state);

    console.log(`[Bot] Owner connected! Chat ID: ${chatId}`);

    bot.sendMessage(chatId, [
        '🏪 *Mini Mart Bot Connected!*',
        '',
        'Notifications for:',
        '🧾 New orders',
        '📦 Product added/updated/deleted',
        '⚠️ Low stock alerts',
        '🔄 Product returns',
        '🚚 Delivery updates',
        '👤 New user registrations',
        '💰 Daily sales reports',
        '',
        '*Commands:*',
        '/status — Bot status',
        '/test — Test poll now',
        '/api — Check API connection',
        '/products — Check low stock',
        '/report — Get daily report now',
        '/stop — Pause notifications',
        '/help — Show this menu'
    ].join('\n'), { parse_mode: 'Markdown' });
});

bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id, [
        '*Mini Mart Bot Commands:*',
        '',
        '/start — Connect & activate',
        '/status — Bot status',
        '/test — Force a poll now',
        '/api — Test API connection',
        '/products — Check low stock',
        '/report — Daily report',
        '/stop — Pause notifications',
        '/help — This menu'
    ].join('\n'), { parse_mode: 'Markdown' });
});

bot.onText(/\/status/, (msg) => {
    bot.sendMessage(msg.chat.id, [
        '📊 *Bot Status*',
        '',
        `🟢 Running: Yes`,
        `🔗 API: ${API_URL}`,
        `📦 Low stock threshold: ${LOW_STOCK_THRESHOLD}`,
        `📊 Initialized: ${state.initialized ? 'Yes' : 'No (will init on next poll)'}`,
        `🧾 Last order ID: ${state.lastOrderId}`,
        `📦 Last product ID: ${state.lastProductId}`,
        `👤 Last user ID: ${state.lastUserId}`,
        `🔄 Last return ID: ${state.lastReturnId}`,
        `🕐 Time: ${new Date().toLocaleString()}`
    ].join('\n'), { parse_mode: 'Markdown' });
});

bot.onText(/\/test/, async (msg) => {
    const chat = msg.chat.id;
    await bot.sendMessage(chat, '🔄 Running test poll...');
    console.log(`[Test] Manual poll triggered by user`);

    state.initialized = false;
    saveState(state);

    const success = await runFullPoll(bot, chat, API_URL, state);
    if (success) {
        await bot.sendMessage(chat, '✅ Test poll complete! Check console for details.');
    } else {
        await bot.sendMessage(chat, '❌ Test poll failed. Check console.');
    }
});

bot.onText(/\/api/, async (msg) => {
    const chat = msg.chat.id;
    await bot.sendMessage(chat, '🔄 Testing API connection...');

    const endpoints = ['Orders.php', 'Product.php', 'Users.php', 'Returns.php', 'Deliveries.php'];
    let results = [];

    for (const ep of endpoints) {
        try {
            const data = await fetchAPI(API_URL, ep);
            if (data) {
                const count = Array.isArray(data) ? data.length : 'unknown';
                results.push(`  ✅ ${ep}: ${count} items`);
            } else {
                results.push(`  ❌ ${ep}: no data`);
            }
        } catch (err) {
            results.push(`  ❌ ${ep}: ${err.message}`);
        }
    }

    await bot.sendMessage(chat, [
        '*API Connection Test:*',
        `🔗 ${API_URL}`,
        '',
        ...results
    ].join('\n'), { parse_mode: 'Markdown' });
});

bot.onText(/\/report/, async (msg) => {
    await sendDailyReport(bot, msg.chat.id, API_URL);
});

bot.onText(/\/products/, async (msg) => {
    await checkLowStock(bot, msg.chat.id, API_URL, LOW_STOCK_THRESHOLD);
    bot.sendMessage(msg.chat.id, '📦 Low stock check complete.');
});

let notificationsEnabled = true;

bot.onText(/\/stop/, (msg) => {
    notificationsEnabled = false;
    bot.sendMessage(msg.chat.id, '⏸️ Notifications paused. Send /start to resume.');
});

bot.onText(/\/start/, () => { notificationsEnabled = true; });

async function pollLoop() {
    if (!chatId || !notificationsEnabled) return;

    try {
        await runFullPoll(bot, chatId, API_URL, state);
    } catch (err) {
        console.error('[Poll Error]', err.message);
    }
}

async function pollLowStock() {
    if (!chatId || !notificationsEnabled) return;

    try {
        await checkLowStock(bot, chatId, API_URL, LOW_STOCK_THRESHOLD);
    } catch (err) {
        console.error('[Stock Check Error]', err.message);
    }
}

cron.schedule('*/15 * * * * *', pollLoop);
cron.schedule('*/5 * * * *', pollLowStock);
cron.schedule('0 20 * * *', () => {
    if (chatId && notificationsEnabled) {
        sendDailyReport(bot, chatId, API_URL);
    }
});

console.log('[Bot] Polling started:');
console.log('  - All checks: every 15 seconds');
console.log('  - Low stock: every 5 minutes');
console.log('  - Daily report: at 8:00 PM');
console.log('[Bot] Send /start to your bot on Telegram to begin!');
