const app = getApp();
import { Logic } from '../../utils/util';
import { t } from '../../utils/i18n';

Page({
    data: {
        customer: null,
        orders: [],
        stats: {
            totalOrders: 0,
            totalAmount: 0,
            avgAmount: 0,
            firstOrderDate: '',
            lastOrderDate: ''
        },
        t: {}
    },

    onLoad(options) {
        const customerId = options.id;
        this.loadCustomerData(customerId);
        this.updateI18n();
    },

    loadCustomerData(customerId) {
        const customer = (app.globalData.users || []).find(u => u.id === customerId);
        if (!customer) return;

        const orders = (app.globalData.orders || [])
            .filter(o => o.userId === customerId)
            .sort((a, b) => b.startTime - a.startTime)
            .map(o => ({
                ...o,
                startTimeStr: Logic.formatLocalDate(o.startTime),
                displayStatus: Logic.getDisplayStatus(o)
            }));

        // 只计算有效订单（排除已取消的）
        const effectiveOrders = orders.filter(o => o.status !== 'Cancelled');

        const stats = {
            totalOrders: orders.length,
            effectiveOrders: effectiveOrders.length,
            totalAmount: effectiveOrders.reduce((sum, o) => sum + o.price, 0),
            avgAmount: effectiveOrders.length > 0 ? Math.round(effectiveOrders.reduce((sum, o) => sum + o.price, 0) / effectiveOrders.length) : 0,
            firstOrderDate: orders.length > 0 ? orders[orders.length - 1].startTimeStr : '',
            lastOrderDate: orders.length > 0 ? orders[0].startTimeStr : ''
        };

        this.setData({ customer, orders, stats });
    },

    updateI18n() {
        const lang = app.globalData.config.language;
        const keys = [
            'ch_title', 'ch_total_orders', 'ch_total_amount', 'ch_avg_amount',
            'ch_first_order', 'ch_last_order', 'ch_no_orders', 'ch_order_history',
            'status_active', 'status_pending', 'status_completed', 'status_cancelled'
        ];
        const strings = {};
        keys.forEach(k => strings[k] = t(k, null, lang));
        this.setData({ t: strings });
        wx.setNavigationBarTitle({ title: t('ch_title', null, lang) });
    }
});
