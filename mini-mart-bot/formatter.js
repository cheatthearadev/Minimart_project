function formatReceipt(order) {
    let items = '';
    if (order.items && order.items.length > 0) {
        items = order.items.map(item =>
            `  ${item.name} x${item.quantity}  $${(item.price * item.quantity).toFixed(2)}`
        ).join('\n');
    }

    const typeEmoji = { dine_in: '🍽️', takeaway: '🥡', delivery: '🚚' };
    const typeNames = {
        dine_in: 'ញ៉ាំនៅកន្លែង',
        takeaway: 'យកទៅផ្ទះ',
        delivery: 'ដឹកជញ្ជូន'
    };

    return [
        `${typeEmoji[order.order_type] || '🛒'} *ការលក់ថ្មី*`,
        `━━━━━━━━━━━━━━━━━━`,
        `🧾 វិក្កយបត្រ: \`${order.invoice_number || 'N/A'}\``,
        `📦 ប្រភេទ: ${typeNames[order.order_type] || order.order_type || 'N/A'}`,
        ``,
        `*ទំនិញ:*`,
        items || '  គ្មានទំនិញ',
        ``,
        `━━━━━━━━━━━━━━━━━━`,
        `💰 សរុប: *$${parseFloat(order.total_amount).toFixed(2)}*`,
        `💵 បានទទួល: $${parseFloat(order.cash_received || 0).toFixed(2)}`,
        `🔄 លុយអាប់: $${parseFloat(order.cash_return || 0).toFixed(2)}`,
        `📌 ស្ថានភាព: ${order.status}`,
        `🕐 ${new Date(order.created_at).toLocaleString()}`
    ].join('\n');
}

function formatLowStock(products) {
    if (!products || products.length === 0) return null;

    let list = products.map(p =>
        `  ⚠️ *${p.name}* — ${p.stock} ${p.unit || 'pcs'} left`
    ).join('\n');

    return [
        `📦 *LOW STOCK ALERT*`,
        `━━━━━━━━━━━━━━━━━━`,
        `The following products are almost out of stock:`,
        ``,
        list,
        ``,
        `🔔 Consider restocking soon!`
    ].join('\n');
}

function formatDailyReport(report) {
    const s = report.summary;
    let topProducts = '';
    if (report.top_products && report.top_products.length > 0) {
        topProducts = report.top_products.map((p, i) =>
            `  ${i + 1}. ${p.name} — ${p.qty} sold ($${parseFloat(p.revenue).toFixed(2)})`
        ).join('\n');
    }

    return [
        `💰 *DAILY SALES REPORT*`,
        `━━━━━━━━━━━━━━━━━━`,
        `📅 ${new Date().toLocaleDateString()}`,
        ``,
        `📊 *Summary:*`,
        `  🛒 Total Orders: ${s.total_orders}`,
        `  💵 Total Revenue: *$${parseFloat(s.total_revenue).toFixed(2)}*`,
        `  💳 Cash Received: $${parseFloat(s.total_cash).toFixed(2)}`,
        `  🔄 Cash Returned: $${parseFloat(s.total_return).toFixed(2)}`,
        ``,
        `🏆 *Top Products:*`,
        topProducts || '  No sales today',
        ``,
        `━━━━━━━━━━━━━━━━━━`,
        `🤖 Mini Mart Bot`
    ].join('\n');
}

function formatNewUser(user) {
    const roleEmoji = user.role === 'admin' ? '👑' : '👤';
    return [
        `${roleEmoji} *NEW USER REGISTERED*`,
        `━━━━━━━━━━━━━━━━━━`,
        `👤 Name: *${user.username}*`,
        `🔰 Role: ${user.role}`,
        `🕐 ${new Date().toLocaleString()}`
    ].join('\n');
}

function formatNewProduct(product) {
    return [
        `✅ *NEW PRODUCT ADDED*`,
        `━━━━━━━━━━━━━━━━━━`,
        `📦 Name: *${product.name}*`,
        `💲 Price: $${parseFloat(product.price).toFixed(2)}`,
        `📊 Stock: ${product.stock} ${product.unit || 'pcs'}`,
        `📁 Category: ${product.category_name || 'N/A'}`,
        `🚚 Supplier: ${product.supplier_name || 'N/A'}`,
        `🕐 ${new Date().toLocaleString()}`
    ].join('\n');
}

function formatDeletedProduct(product) {
    return [
        `🗑️ *PRODUCT DELETED*`,
        `━━━━━━━━━━━━━━━━━━`,
        `📦 Name: *${product.name}*`,
        `💲 Price: $${parseFloat(product.price).toFixed(2)}`,
        `📁 Category: ${product.category_name || 'N/A'}`,
        `🕐 ${new Date().toLocaleString()}`
    ].join('\n');
}

function formatUpdatedProduct(product) {
    return [
        `✏️ *PRODUCT UPDATED*`,
        `━━━━━━━━━━━━━━━━━━`,
        `📦 Name: *${product.name}*`,
        `💲 Price: $${parseFloat(product.price).toFixed(2)}`,
        `📊 Stock: ${product.stock} ${product.unit || 'pcs'}`,
        `📁 Category: ${product.category_name || 'N/A'}`,
        `🕐 ${new Date().toLocaleString()}`
    ].join('\n');
}

function formatReturn(ret) {
    return [
        `🔄 *PRODUCT RETURNED*`,
        `━━━━━━━━━━━━━━━━━━`,
        `📦 Product: *${ret.product_name}*`,
        `🧾 Invoice: \`${ret.invoice_number || 'N/A'}\``,
        `🔢 Qty: ${ret.quantity}`,
        `💲 Refund: *$${parseFloat(ret.refund_amount).toFixed(2)}*`,
        `📝 Reason: ${ret.reason || 'N/A'}`,
        `👤 By: ${ret.processed_by_name || 'N/A'}`,
        `🕐 ${new Date(ret.created_at).toLocaleString()}`
    ].join('\n');
}

function formatDeliveryUpdate(delivery) {
    const statusEmoji = {
        pending: '⏳',
        assigned: '👤',
        picked_up: '📦',
        in_transit: '🚚',
        delivered: '✅',
        cancelled: '❌'
    };

    return [
        `${statusEmoji[delivery.status] || '🚚'} *DELIVERY UPDATE*`,
        `━━━━━━━━━━━━━━━━━━`,
        `🧾 Invoice: \`${delivery.invoice_number || 'N/A'}\``,
        `👤 Customer: *${delivery.customer_name}*`,
        `📍 Address: ${delivery.delivery_address}`,
        `📌 Status: *${delivery.status.toUpperCase()}*`,
        `💲 Total: $${parseFloat(delivery.total_amount).toFixed(2)}`,
        `🕐 ${new Date().toLocaleString()}`
    ].join('\n');
}

function formatNewSaleShort(order) {
    return [
        `🔔 *New Sale!*`,
        `🧾 \`${order.invoice_number || 'N/A'}\``,
        `💰 $${parseFloat(order.total_amount).toFixed(2)}`
    ].join('\n');
}

module.exports = {
    formatReceipt,
    formatLowStock,
    formatDailyReport,
    formatNewUser,
    formatNewProduct,
    formatDeletedProduct,
    formatUpdatedProduct,
    formatReturn,
    formatDeliveryUpdate,
    formatNewSaleShort
};
