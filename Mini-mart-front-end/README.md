# 🛒 Mini Mart Management System

A modern, all-in-one store management system for mini marts and retail shops — built with **React.js**, **PHP**, and **MySQL**, with a **Telegram bot** for instant notifications.

## ✨ Features

### 🧾 Point of Sale (POS)
- Lightning-fast checkout with product search and barcode scanner support
- Cart with quantity editing, discounts and payment tracking
- Order types: dine-in, takeaway and delivery

### 📊 Dashboard
- Live KPIs: revenue, orders, stock value, low stock / out of stock alerts
- 14-day revenue trend chart and top selling products
- Weekly summary and low stock alerts

### 📦 Product & Inventory Management
- Full CRUD with categories, suppliers, barcodes and product photos
- Cost price tracking and automatic low-stock detection
- Inventory change log (sale / return / restock / adjustment)

### 📈 Reports
- Daily, weekly, monthly and custom-range sales reports
- Revenue trend, top products and hourly sales distribution
- Daily **Z-Report** for end-of-day cash reconciliation
- Dashboard + Reports endpoints backed by real SQL analytics

### 🚚 Deliveries
- Delivery order tracking with status flow (pending → assigned → in-transit → delivered)
- Driver assignment and delivery fee handling

### 👥 Customers, Suppliers, Discounts & Users
- Customer loyalty points and lifetime spend
- Supplier directory, promo discount codes (percent / fixed)
- Role-based access: **admin** and **cashier**

### 🔔 Telegram Bot (`mini-mart-bot`)
- Real-time notifications for new orders, low stock, product changes, returns and deliveries
- Daily sales report pushed to the owner's phone
- Commands: `/status`, `/test`, `/api`, `/products`, `/report`

### 💡 Extras
- Keyboard shortcuts (F1 POS, F2 search, F5 refresh, F9 dashboard, F10 orders, `/` help)
- Dark mode, responsive layout, Google sign-in option

## 🛠 Technologies

| Layer | Tech |
|-------|------|
| Front-End | React.js, Vite, Tailwind CSS, Recharts |
| Back-End | PHP 8, REST API |
| Database | MySQL |
| Bot | Node.js, node-telegram-bot-api |

## 📂 Project Structure

```
mini-mart-project/
├── Mini-mart-front-end/   # React app (Vite)
├── Mini-mart-back-end/    # PHP REST API + uploads
└── mini-mart-bot/         # Telegram notification bot
```

## 🚀 Installation

### 1. Database
1. Start MySQL (Laragon / XAMPP).
2. Create the database and tables:

```bash
mysql -uroot -e "CREATE DATABASE minimart_db CHARACTER SET utf8mb4"
mysql -uroot minimart_db < Mini-mart-back-end/database/schema.sql
mysql -uroot minimart_db < Mini-mart-back-end/database/migration.sql
```

3. (Optional) Load clean demo data with 30 days of sales:

```bash
mysql -uroot minimart_db < Mini-mart-back-end/database/seed_demo.sql
```

### 2. Back-End
Copy `Mini-mart-back-end` into the web root (`C:\Laragon\laragon\www`) so the API is served at:

```
http://localhost/mini-mart-project/Mini-mart-back-end/api
```

Start Apache and MySQL. Check `config/database.php` if your DB credentials differ.

### 3. Front-End

```bash
cd Mini-mart-front-end
npm install
npm run dev        # http://localhost:5173
```

### 4. Telegram Bot (optional)

```bash
cd mini-mart-bot
npm install
npm start
```

Then open your bot on Telegram and send `/start`.

## 🔑 Demo Accounts

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Cashier | `Cheat Theara` | `theara123` |

## 👨‍💻 Author

**Cheat Theara**

GitHub: https://github.com/YourUsername

Email: your@email.com
