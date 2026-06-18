const app = getApp();
import { Logic, MAX_SENDS_PER_CYCLE, MAX_USERS_PER_CYCLE, OrderStatus } from '../../utils/util';
import { t } from '../../utils/i18n';

Page({
    data: {
        stats: null,
        orders: [],
        recentOrders: [],
        displayOrders: [],
        orderLimit: 20,
        hasMoreOrders: false,
        nextOrderText: '',
        nextOrderSub: '',
        nextOrderRaw: null,
        editingOrder: null,
        MAX_SENDS_PER_CYCLE,
        MAX_USERS_PER_CYCLE,
        t: {},
        showOrderModal: false,
        paymentPrice: 0,
        showPayment: false,
        showUserDetailsModal: false,
        userDetails: [],
        _dirty: true
    },

    onShow() {
        if (this.data._dirty) {
            this.initData();
            this.data._dirty = false;
        }
    },

    onPullDownRefresh() {
        this.initData();
        wx.stopPullDownRefresh();
    },

    initData() {
        // Check if initialized
        if (!app.globalData.config.isInitialized) {
            return wx.redirectTo({ url: '/pages/onboarding/onboarding' });
        }

        this.updateI18n();
    },

    updateI18n() {
        const lang = app.globalData.config.language;
        const keys = [
            'dash_overview', 'dash_remaining', 'dash_sends', 'dash_quota',
            'dash_users', 'dash_limit', 'dash_revenue', 'dash_cycle',
            'dash_next', 'dash_none', 'dash_recent', 'dash_no_orders',
            'dash_create', 'label_send', 'label_return',
            'status_active', 'status_pending', 'status_completed', 'status_cancelled',
            'pay_title', 'pay_scan', 'pay_save', 'pay_err_no_phone',
            'dash_updated_now', 'dash_view_all', 'dash_caught_up',
            'dash_manual_booking', 'dash_success', 'dash_view_details',
            'dash_user_details_title', 'dash_order_count', 'dash_close'
        ];
        const strings = {};
        keys.forEach(k => strings[k] = t(k, null, lang));

        // Dynamic stats translations
        const stats = Logic.calculateStats(app.globalData.orders, app.globalData.config, app.globalData.users);
        strings.daysLeftStr = t('dash_days_left', { n: stats.daysRemaining }, lang);

        this.setData({ t: strings }, () => {
            this.calculateStats(strings);
        });
        wx.setNavigationBarTitle({ title: t('nav_dashboard', null, lang) });
    },

    calculateStats(strings) {
        const trans = strings || this.data.t;
        const orders = app.globalData.orders;
        const config = app.globalData.config;
        const lang = config.language;
        const stats = Logic.calculateStats(orders, config, app.globalData.users);
        const now = Date.now();

        // Recent Orders - with pagination
        const recentOrders = [...orders]
            .sort((a, b) => b.startTime - a.startTime)
            .map((o, idx) => ({
                ...o,
                startTimeStr: this.formatTime(o.startTime),
                endTimeStr: this.formatTime(o.endTime),
                displayStatus: Logic.getDisplayStatus(o, now),
                statusBadgeClass: this.getStatusClass(Logic.getDisplayStatus(o, now)),
                orderNumStr: t('dash_order_num', { n: orders.length - idx }, lang),
                statusLabel: trans[`status_${Logic.getDisplayStatus(o, now).toLowerCase()}`] || Logic.getDisplayStatus(o, now)
            }));

        const orderLimit = this.data.orderLimit;
        const displayOrders = recentOrders.slice(0, orderLimit);
        const hasMoreOrders = recentOrders.length > orderLimit;

        // User Details Details for Modal
        const userMap = {};
        const cycleStart = config.cycleStartDate;
        const cycleEnd = Logic.getCycleEnd(cycleStart);
        const effectiveOrders = Logic.getEffectiveOrders(orders).filter(o =>
            o.startTime >= cycleStart && o.startTime <= cycleEnd
        );

        effectiveOrders.forEach(o => {
            const uid = o.userId;
            if (!userMap[uid]) {
                userMap[uid] = {
                    name: o.userParams.name || t('dash_unknown', null, lang),
                    phone: o.userParams.phone || '',
                    count: 0,
                    totalAmount: 0
                };
            }
            userMap[uid].count += 1;
            userMap[uid].totalAmount += (o.price || 0);
        });

        (app.globalData.users || []).forEach(user => {
            const offsetCount = Logic.getCycleUsageOffset(user, cycleStart);
            if (offsetCount <= 0) return;
            if (!userMap[user.id]) {
                userMap[user.id] = {
                    name: user.name || t('dash_unknown', null, lang),
                    phone: user.phone || '',
                    count: 0,
                    totalAmount: 0
                };
            }
            userMap[user.id].count += offsetCount;
        });

        const userDetails = Object.values(userMap)
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .map(u => {
                let countStr = t('dash_order_count', { n: u.count }, lang);
                if (lang === 'en' && u.count === 1) {
                    countStr = countStr.replace('Orders', 'Order');
                }
                return {
                    ...u,
                    countStr
                };
            });

        // Next Order
        const nextOrder = orders
            .filter(o => o.startTime > now && Logic.getDisplayStatus(o, now) !== OrderStatus.CANCELLED)
            .sort((a, b) => a.startTime - b.startTime)[0];

        let nextOrderText = trans.dash_none || '';
        let nextOrderSub = '';
        let nextOrderRaw = null;

        if (nextOrder) {
            nextOrderText = this.formatTime(nextOrder.startTime);
            nextOrderSub = `${nextOrder.userParams.name} · ${nextOrder.durationType}`;
            nextOrderRaw = nextOrder;
        }

        this.setData({
            stats,
            orders,
            recentOrders,
            displayOrders,
            hasMoreOrders,
            userDetails,
            nextOrderText,
            nextOrderSub,
            nextOrderRaw
        });
    },

    toggleUserDetailsModal() {
        this.setData({
            showUserDetailsModal: !this.data.showUserDetailsModal
        });
    },

    loadMoreOrders() {
        this.setData({
            orderLimit: this.data.orderLimit + 20
        });
        this.calculateStats();
    },

    formatTime(ts) {
        const d = new Date(ts);
        const m = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        const h = d.getHours().toString().padStart(2, '0');
        const min = d.getMinutes().toString().padStart(2, '0');
        return `${m}/${day} ${h}:${min}`;
    },

    getStatusClass(status) {
        const map = {
            'Active': 'bg-green-100 text-green-700 border-green-200',
            'Pending': 'bg-amber-100 text-amber-700 border-amber-200',
            'Completed': 'bg-slate-100 text-slate-600 border-slate-200',
            'Cancelled': 'bg-red-50 text-red-400 border-red-100 line-through'
        };
        return map[status] || 'bg-gray-100';
    },

    openOrderModal() {
        this.setData({ showOrderModal: true, editingOrder: null });
    },

    onEditOrder(e) {
        const order = e.currentTarget.dataset.order;
        if (order) {
            this.setData({ showOrderModal: true, editingOrder: order });
        }
    },

    onOrderModalClose() {
        this.setData({ showOrderModal: false, editingOrder: null });
        this.data._dirty = true;
        this.initData();
    },

    onDeleteOrder(e) {
        const id = e.detail.id;
        const orders = app.globalData.orders.map(o => {
            if (o.id !== id) return o;
            return { ...o, status: OrderStatus.CANCELLED, cancelledAt: Date.now() };
        });
        app.globalData.orders = orders;
        wx.setStorageSync('tm_orders', orders);
        this.data._dirty = true;
        this.initData();

        const lang = app.globalData.config.language;
        wx.showToast({
            title: t('dash_order_cancelled', null, lang),
            icon: 'success',
            duration: 3000
        });
    },

    onCopyPhone(e) {
        const phone = e.currentTarget.dataset.phone;
        if (!phone) return;
        wx.setClipboardData({
            data: phone,
            success: () => {
                wx.showToast({ title: this.data.t.dash_success, icon: 'success' });
            }
        });
    },

    noop() { },

    openPayment(e) {
        const price = e.currentTarget.dataset.price;
        const swishNumber = app.globalData.config.swishNumber;
        const lang = app.globalData.config.language;

        if (!swishNumber) {
            return wx.showToast({ title: this.data.t.pay_err_no_phone, icon: 'none' });
        }

        const swishLabel = t('pay_swish_label', null, lang);
        const amountLabel = t('pay_amount_label', null, lang);

        wx.showModal({
            title: this.data.t.pay_title,
            content: `${this.data.t.pay_scan}\n${swishLabel} ${swishNumber}\n${amountLabel} ${price} kr`,
            confirmText: this.data.t.pay_save,
            cancelText: 'OK',
            success: (res) => {
                if (res.confirm) {
                    const formattedNumber = Logic.formatSwishNumber(swishNumber);
                    wx.setClipboardData({ data: `C${formattedNumber};${price};Ticket;0` });
                }
            }
        });
    },

    saveCalendar(e) {
        const orderId = e.currentTarget.dataset.id;
        const order = this.data.orders.find(o => o.id === orderId);
        if (!order) return;

        const lang = app.globalData.config.language;
        const titlePrefix = t('dash_cal_title', null, lang);
        const phoneLabel = t('dash_cal_phone', null, lang);

        wx.addPhoneCalendar({
            title: `${titlePrefix}: ${order.userParams.name}`,
            startTime: order.startTime / 1000,
            endTime: order.endTime / 1000,
            description: `${phoneLabel}: ${order.userParams.phone}`,
            success: () => wx.showToast({ title: t('dash_saved', null, lang), icon: 'success' }),
            fail: () => wx.showToast({ title: t('dash_saved', null, lang), icon: 'none' })
        });
    },

    copyPhone(e) {
        const phone = e.currentTarget.dataset.phone;
        wx.setClipboardData({ data: phone });
    }
});
