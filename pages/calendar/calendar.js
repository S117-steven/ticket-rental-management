const app = getApp();
import { Logic, OrderStatus } from '../../utils/util';
import { t } from '../../utils/i18n';

Page({
    data: {
        days: [],
        t: {},
        showOrderModal: false,
        editingOrder: null,
        presetDate: ''
    },

    onShow() {
        this.initData();
    },

    onPullDownRefresh() {
        this.initData();
        wx.stopPullDownRefresh();
    },

    initData() {
        this.updateI18n();
        this.renderCalendar();
    },

    updateI18n() {
        const lang = app.globalData.config.language;
        const keys = [
            'cal_title', 'cal_free', 'cal_today', 'cal_occupied',
            'cal_available', 'cal_active', 'cal_reserved', 'cal_past',
            'cal_occupied_desc', 'cal_count_minus', 'cal_create_here',
            'cal_edit_order', 'dash_success'
        ];
        const strings = {};
        keys.forEach(k => strings[k] = t(k, null, lang));
        this.setData({ t: strings });
        wx.setNavigationBarTitle({ title: t('nav_calendar', null, lang) });
    },

    renderCalendar() {
        const orders = app.globalData.orders || [];
        const config = app.globalData.config;
        const lang = config.language;
        const nowTs = Date.now();
        const days = [];

        for (let i = 0; i < 30; i++) {
            const d = new Date(config.cycleStartDate);
            d.setDate(d.getDate() + i);
            const dateTs = d.getTime();
            const dateValue = Logic.formatLocalDate(d);
            const isToday = Logic.isSameDay(dateTs, nowTs);

            const startOrder = orders.find(o =>
                Logic.getDisplayStatus(o, nowTs) !== OrderStatus.CANCELLED &&
                Logic.isSameDay(o.startTime, dateTs)
            );
            const activeOrder = orders.find(o =>
                Logic.getDisplayStatus(o, nowTs) !== OrderStatus.CANCELLED &&
                dateTs >= o.startTime &&
                dateTs <= o.endTime
            );

            let status = {
                type: 'free',
                label: this.data.t.cal_free,
                timeRange: '',
                className: 'cal-item-free'
            };
            let showBadge = true;
            let badgeText = this.data.t.cal_available;
            let actionText = this.data.t.cal_create_here;
            let orderId = '';

            if (startOrder) {
                const displayStatus = Logic.getDisplayStatus(startOrder, nowTs);
                const timeStr = this.formatTimeRange(startOrder.startTime, startOrder.endTime);
                orderId = startOrder.id;
                showBadge = false;
                actionText = this.data.t.cal_edit_order;

                if (displayStatus === OrderStatus.ACTIVE) {
                    status = { type: 'active', label: this.data.t.cal_active, timeRange: timeStr, className: 'cal-item-active' };
                } else if (displayStatus === OrderStatus.PENDING) {
                    status = { type: 'reserved', label: this.data.t.cal_reserved, timeRange: timeStr, className: 'cal-item-reserved' };
                } else {
                    status = { type: 'past', label: this.data.t.cal_past, timeRange: timeStr, className: 'cal-item-past' };
                }
            } else if (activeOrder) {
                status = {
                    type: 'occupied',
                    label: this.data.t.cal_occupied,
                    timeRange: this.data.t.cal_occupied_desc,
                    className: 'cal-item-occupied'
                };
                showBadge = false;
                actionText = '';
                orderId = activeOrder.id;
            }

            days.push({
                dateStr: d.getDate(),
                dateValue,
                weekDay: this.getWeekDayName(d, lang),
                isToday,
                status,
                showBadge,
                badgeText,
                actionText,
                orderId
            });
        }

        this.setData({ days });
    },

    onDayTap(e) {
        const type = e.currentTarget.dataset.type;
        const orderId = e.currentTarget.dataset.orderId;
        const dateValue = e.currentTarget.dataset.date;

        if (orderId && type !== 'occupied') {
            const order = (app.globalData.orders || []).find(o => o.id === orderId);
            if (order) {
                this.setData({ showOrderModal: true, editingOrder: order, presetDate: '' });
            }
            return;
        }

        if (type === 'free') {
            this.setData({ showOrderModal: true, editingOrder: null, presetDate: dateValue });
        }
    },

    onOrderModalClose() {
        this.setData({ showOrderModal: false, editingOrder: null, presetDate: '' });
        this.initData();
    },

    onDeleteOrder(e) {
        const id = e.detail.id;
        const orders = (app.globalData.orders || []).map(o => {
            if (o.id !== id) return o;
            return { ...o, status: OrderStatus.CANCELLED, cancelledAt: Date.now() };
        });
        app.globalData.orders = orders;
        wx.setStorageSync('tm_orders', orders);
        this.initData();
        wx.showToast({ title: this.data.t.dash_success, icon: 'success' });
    },

    formatTimeRange(start, end) {
        const pad = (n) => n.toString().padStart(2, '0');
        const d1 = new Date(start);
        const d2 = new Date(end);
        return `${pad(d1.getHours())}:${pad(d1.getMinutes())} - ${pad(d2.getHours())}:${pad(d2.getMinutes())}`;
    },

    getWeekDayName(date, lang) {
        const en = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const zh = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const sv = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
        const map = { zh, en, sv };
        return (map[lang] || en)[date.getDay()];
    }
});
