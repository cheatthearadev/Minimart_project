const fs = require('fs');
const path = require('path');
const axios = require('axios');
const {
    formatReceipt, formatLowStock, formatDailyReport, formatNewUser,
    formatNewProduct, formatDeletedProduct, formatUpdatedProduct,
    formatReturn, formatDeliveryUpdate
} = require('./formatter');

const STATE_FILE = path.join(__dirname, 'state.json');

function loadState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            const raw = fs.readFileSync(STATE_FILE, 'utf8');
            const s = JSON.parse(raw);
            if (typeof s.lastOrderId === 'undefined') s.lastOrderId = 0;
            if (typeof s.lastUserId === 'undefined') s.lastUserId = 0;
            if (typeof s.lastProductId === 'undefined') s.lastProductId = 0;
            if (typeof s.lastReturnId === 'undefined') s.lastReturnId = 0;
            if (typeof s.lastDeliveryStatuses === 'undefined') s.lastDeliveryStatuses = {};
            if (typeof s.initialized === 'undefined') s.initialized = false;
            return s;
        }
    } catch (e) {
        console.error('[State] Load error:', e.message);
    }
    return {
        lastOrderId: 0,
        lastUserId: 0,
        lastProductId: 0,
        lastReturnId: 0,
        lastDeliveryStatuses: {},
        initialized: false
    };
}

function saveState(state) {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch (e) {
        console.error('[State] Save error:', e.message);
    }
}

async function fetchAPI(apiUrl, endpoint) {
    try {
        const url = `${apiUrl}/${endpoint}`;
        const res = await axios.get(url, { timeout: 10000 });
        let data = res.data;

        if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.value)) {
            data = data.value;
        }

        return data;
    } catch (err) {
        console.error(`[API Error] ${endpoint}: ${err.message}`);
        return null;
    }
}

function setMaxId(current, newArray, key) {
    if (newArray && newArray.length > 0) {
        const max = Math.max(...newArray.map(item => parseInt(item.id) || 0));
        if (max > current[key]) {
            current[key] = max;
        }
    }
}

function initializeState(state, apiData) {
    if (state.initialized) return false;

    setMaxId(state, apiData.orders, 'lastOrderId');
    setMaxId(state, apiData.users, 'lastUserId');
    setMaxId(state, apiData.products, 'lastProductId');
    setMaxId(state, apiData.returns, 'lastReturnId');

    if (apiData.deliveries && apiData.deliveries.length > 0) {
        for (const d of apiData.deliveries) {
            state.lastDeliveryStatuses[d.id] = d.status;
        }
    }

    state.initialized = true;
    saveState(state);
    console.log(`[Init] State initialized: orders<=${state.lastOrderId}, products<=${state.lastProductId}, users<=${state.lastUserId}, returns<=${state.lastReturnId}`);
    return true;
}

async function checkNewOrders(bot, chatId, apiUrl, state, ordersData) {
    const data = ordersData || await fetchAPI(apiUrl, 'Orders.php');
    if (!data || !Array.isArray(data)) {
        console.log('[Poll] Orders: no data or not array');
        return;
    }

    if (!state.initialized) return;

    const newOrders = data.filter(o => parseInt(o.id) > state.lastOrderId);
    console.log(`[Poll] Orders: ${data.length} total, ${newOrders.length} new (lastId=${state.lastOrderId})`);

    for (const order of newOrders) {
        try {
            await bot.sendMessage(chatId, formatReceipt(order), { parse_mode: 'Markdown' });
            console.log(`[Sent] Order #${order.invoice_number}`);
        } catch (err) {
            console.error('[Send Error] Receipt:', err.message);
        }
    }

    if (data.length > 0) {
        const maxId = Math.max(...data.map(o => parseInt(o.id) || 0));
        if (maxId > state.lastOrderId) {
            state.lastOrderId = maxId;
        }
    }
}

async function checkProducts(bot, chatId, apiUrl, state, productsData) {
    const data = productsData || await fetchAPI(apiUrl, 'Product.php');
    if (!data || !Array.isArray(data)) {
        console.log('[Poll] Products: no data or not array');
        return;
    }

    if (!state.initialized) return;

    if (data.length > 0) {
        const maxId = Math.max(...data.map(p => parseInt(p.id) || 0));
        console.log(`[Poll] Products: ${data.length} total, lastProductId=${state.lastProductId}, maxId=${maxId}`);

        if (maxId > state.lastProductId) {
            const newProducts = data.filter(p => parseInt(p.id) > state.lastProductId);
            for (const product of newProducts) {
                try {
                    await bot.sendMessage(chatId, formatNewProduct(product), { parse_mode: 'Markdown' });
                    console.log(`[Sent] New product: ${product.name}`);
                } catch (err) {
                    console.error('[Send Error] New Product:', err.message);
                }
            }
            state.lastProductId = maxId;
        }
    }
}

async function checkNewUsers(bot, chatId, apiUrl, state, usersData) {
    const data = usersData || await fetchAPI(apiUrl, 'Users.php');
    if (!data || !Array.isArray(data)) {
        console.log('[Poll] Users: no data or not array');
        return;
    }

    if (!state.initialized) return;

    const newUsers = data.filter(u => parseInt(u.id) > state.lastUserId);
    console.log(`[Poll] Users: ${data.length} total, ${newUsers.length} new (lastId=${state.lastUserId})`);

    for (const user of newUsers) {
        try {
            await bot.sendMessage(chatId, formatNewUser(user), { parse_mode: 'Markdown' });
            console.log(`[Sent] New user: ${user.username}`);
        } catch (err) {
            console.error('[Send Error] New User:', err.message);
        }
    }

    if (data.length > 0) {
        const maxId = Math.max(...data.map(u => parseInt(u.id) || 0));
        if (maxId > state.lastUserId) {
            state.lastUserId = maxId;
        }
    }
}

async function checkReturns(bot, chatId, apiUrl, state, returnsData) {
    const data = returnsData || await fetchAPI(apiUrl, 'Returns.php');
    if (!data || !Array.isArray(data)) return;

    if (!state.initialized) return;

    const newReturns = data.filter(r => parseInt(r.id) > state.lastReturnId);
    console.log(`[Poll] Returns: ${data.length} total, ${newReturns.length} new (lastId=${state.lastReturnId})`);

    for (const ret of newReturns) {
        try {
            await bot.sendMessage(chatId, formatReturn(ret), { parse_mode: 'Markdown' });
            console.log(`[Sent] Return: ${ret.product_name}`);
        } catch (err) {
            console.error('[Send Error] Return:', err.message);
        }
    }

    if (data.length > 0) {
        const maxId = Math.max(...data.map(r => parseInt(r.id) || 0));
        if (maxId > state.lastReturnId) {
            state.lastReturnId = maxId;
        }
    }
}

async function checkDeliveries(bot, chatId, apiUrl, state, deliveriesData) {
    const data = deliveriesData || await fetchAPI(apiUrl, 'Deliveries.php');
    if (!data || !Array.isArray(data)) return;

    if (!state.initialized) return;

    for (const delivery of data) {
        const prevStatus = state.lastDeliveryStatuses[delivery.id];
        if (prevStatus && prevStatus !== delivery.status) {
            try {
                await bot.sendMessage(chatId, formatDeliveryUpdate(delivery), { parse_mode: 'Markdown' });
                console.log(`[Sent] Delivery #${delivery.id} status: ${prevStatus} -> ${delivery.status}`);
            } catch (err) {
                console.error('[Send Error] Delivery:', err.message);
            }
        }
        state.lastDeliveryStatuses[delivery.id] = delivery.status;
    }
}

async function checkLowStock(bot, chatId, apiUrl, threshold) {
    const data = await fetchAPI(apiUrl, 'Product.php');
    if (!data || !Array.isArray(data)) return;

    const lowStock = data.filter(p => parseInt(p.stock) <= threshold && parseInt(p.stock) >= 0);
    console.log(`[Poll] Low Stock: ${lowStock.length} products below threshold ${threshold}`);

    if (lowStock.length === 0) return;

    const msg = formatLowStock(lowStock);
    if (msg) {
        try {
            await bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
        } catch (err) {
            console.error('[Send Error] Low Stock:', err.message);
        }
    }
}

async function sendDailyReport(bot, chatId, apiUrl) {
    const data = await fetchAPI(apiUrl, 'Reports.php?period=daily');
    if (!data) return;

    try {
        await bot.sendMessage(chatId, formatDailyReport(data), { parse_mode: 'Markdown' });
    } catch (err) {
        console.error('[Send Error] Daily Report:', err.message);
    }
}

async function runFullPoll(bot, chatId, apiUrl, state) {
    if (!chatId) {
        console.log('[Poll] No chatId - waiting for /start');
        return false;
    }

    console.log(`[Poll] Starting full poll... (initialized=${state.initialized})`);

    const [ordersData, productsData, usersData, returnsData, deliveriesData] = await Promise.all([
        fetchAPI(apiUrl, 'Orders.php'),
        fetchAPI(apiUrl, 'Product.php'),
        fetchAPI(apiUrl, 'Users.php'),
        fetchAPI(apiUrl, 'Returns.php'),
        fetchAPI(apiUrl, 'Deliveries.php')
    ]);

    if (!state.initialized) {
        initializeState(state, {
            orders: Array.isArray(ordersData) ? ordersData : [],
            products: Array.isArray(productsData) ? productsData : [],
            users: Array.isArray(usersData) ? usersData : [],
            returns: Array.isArray(returnsData) ? returnsData : [],
            deliveries: Array.isArray(deliveriesData) ? deliveriesData : []
        });
        console.log('[Init] First poll complete - baseline set. No notifications sent.');
        console.log(`[Init] Now monitoring for NEW changes: orders>${state.lastOrderId}, products>${state.lastProductId}, users>${state.lastUserId}`);
        return true;
    }

    await checkNewOrders(bot, chatId, apiUrl, state, ordersData);
    await checkProducts(bot, chatId, apiUrl, state, productsData);
    await checkNewUsers(bot, chatId, apiUrl, state, usersData);
    await checkReturns(bot, chatId, apiUrl, state, returnsData);
    await checkDeliveries(bot, chatId, apiUrl, state, deliveriesData);
    saveState(state);

    console.log(`[Poll] Complete. State: orders=${state.lastOrderId}, products=${state.lastProductId}, users=${state.lastUserId}`);
    return true;
}

module.exports = {
    loadState,
    saveState,
    fetchAPI,
    runFullPoll,
    checkNewOrders,
    checkProducts,
    checkNewUsers,
    checkReturns,
    checkDeliveries,
    checkLowStock,
    sendDailyReport
};
