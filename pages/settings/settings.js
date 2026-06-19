const app = getApp();
import { Logic, TicketType, OrderStatus } from '../../utils/util';
import { t } from '../../utils/i18n';

Page({
    data: {
        config: null,
        isoDate: '',
        DurationType: ['4h', '8h', '12h', '24h', '48h', '7d', 'Remaining'],
        durationLabels: [],
        t: {},
        users: [],
        editingUser: null,
        showEditModal: false,
        tickets: [],
        activeTicketId: '',
        activePriceMatrix: null,
        showTicketNameModal: false,
        newTicketType: '',
        newTicketName: ''
    },

    onShow() {
        this.initData();
    },

    initData() {
        const config = app.globalData.config;
        const activeTicket = Logic.getActiveTicket(config);
        const isoDate = activeTicket ? Logic.formatLocalDate(activeTicket.cycleStartDate) : '';
        const lang = config.language;
        const durationLabels = this.data.DurationType.map(d => t(Logic.getDurationI18nKey(d), null, lang));
        const users = app.globalData.users || [];
        const tickets = (config.tickets || []).map(ticket => ({
            ...ticket,
            cycleStartDateStr: ticket.cycleStartDate ? Logic.formatLocalDate(ticket.cycleStartDate) : ''
        }));
        const activeTicketId = config.activeTicketId || '';
        const activePriceMatrix = activeTicket ? activeTicket.priceMatrix : config.priceMatrix;
        this.setData({ config, isoDate, durationLabels, users, tickets, activeTicketId, activePriceMatrix });
        this.updateI18n();
    },

    updateI18n() {
        const lang = this.data.config.language;
        const keys = [
            'set_title', 'set_lang', 'set_cycle', 'set_renew',
            'set_price', 'set_save', 'ob_th_dur',
            'ob_th_new', 'ob_th_reg', 'set_renew_confirm', 'set_renew_success',
            'set_export', 'set_import', 'set_export_success', 'set_export_empty',
            'set_import_confirm', 'set_import_success', 'set_import_fail',
            'set_date', 'set_date_hint', 'set_swish', 'set_swish_hint',
            'set_users_title', 'set_no_users', 'set_edit_user', 'set_user_name',
            'set_user_phone', 'set_save_user', 'set_delete_user_confirm'
        ];
        const strings = {};
        keys.forEach(k => strings[k] = t(k, null, lang));
        strings.set_feedback = t('set_feedback', { email: '1458710681@qq.com' }, lang);
        this.setData({ t: strings });
        wx.setNavigationBarTitle({ title: t('nav_settings', null, lang) });
    },

    onLangChange(e) {
        const langs = ['zh', 'en', 'sv'];
        const idx = parseInt(e.detail.value);
        const newLang = langs[idx];

        if (newLang !== this.data.config.language) {
            const newConfig = { ...this.data.config, language: newLang };
            app.updateConfig(newConfig);
            this.initData();
        }
    },

    onDateChange(e) {
        const ts = Logic.parseLocalDate(e.detail.value);
        const config = this.data.config;
        const activeTicket = Logic.getActiveTicket(config);
        
        const updatedTickets = config.tickets.map(ticket => {
            if (ticket.id === activeTicket.id) {
                return {
                    ...ticket,
                    cycleStartDate: ts,
                    initialUsageOffset: { sends: 0, users: 0, cycleId: ts }
                };
            }
            return ticket;
        });

        const newConfig = { ...config, tickets: updatedTickets };
        app.updateConfig(newConfig);
        this.initData();
    },

    updatePrice(e) {
        const type = e.currentTarget.dataset.type;
        const dur = e.currentTarget.dataset.dur;
        let val = parseInt(e.detail.value) || 0;
        if (val < 0) val = 0;
        if (val > 9999) val = 9999;

        const config = this.data.config;
        const activeTicket = Logic.getActiveTicket(config);
        const priceMatrix = JSON.parse(JSON.stringify(activeTicket.priceMatrix || config.priceMatrix));
        priceMatrix[type][dur] = val;

        const updatedTickets = config.tickets.map(ticket => {
            if (ticket.id === activeTicket.id) {
                return { ...ticket, priceMatrix };
            }
            return ticket;
        });

        const newConfig = { ...config, tickets: updatedTickets };
        app.updateConfig(newConfig);
        this.setData({ config: newConfig });
    },

    addTicket(e) {
        const type = e.currentTarget.dataset.type;
        const config = this.data.config;
        const lang = config.language;
        const defaultName = type === 'summer' 
            ? (t('set_summer_ticket', null, lang) || '夏季票')
            : `${t('set_monthly_ticket', null, lang) || '月票'} #${config.tickets.length + 1}`;
        
        this.setData({
            showTicketNameModal: true,
            newTicketType: type,
            newTicketName: defaultName
        });
    },

    onTicketNameInput(e) {
        this.setData({ newTicketName: e.detail.value });
    },

    confirmAddTicket() {
        const type = this.data.newTicketType;
        const label = this.data.newTicketName.trim();
        const config = this.data.config;
        const lang = config.language;
        const defaults = Logic.getTicketDefaults(type);
        const ticketId = Logic.uuid();

        if (!label) {
            wx.showToast({ title: t('set_err_name_required', null, lang) || '请输入名称', icon: 'none' });
            return;
        }

        const newTicket = {
            id: ticketId,
            type: type,
            label: label,
            cycleStartDate: new Date().setHours(0, 0, 0, 0),
            priceMatrix: JSON.parse(JSON.stringify(config.tickets[0]?.priceMatrix || {
                newCustomer: { '4h': 40, '8h': 60, '12h': 80, '24h': 100, '48h': 180, '7d': 500, 'Remaining': 600 },
                regularCustomer: { '4h': 35, '8h': 50, '12h': 70, '24h': 90, '48h': 160, '7d': 450, 'Remaining': 550 }
            })),
            initialUsageOffset: { sends: 0, users: 0, cycleId: 0 },
            cost: defaults.cost
        };

        const newConfig = {
            ...config,
            tickets: [...config.tickets, newTicket],
            activeTicketId: ticketId
        };
        app.updateConfig(newConfig);
        this.setData({ showTicketNameModal: false, newTicketType: '', newTicketName: '' });
        this.initData();
        wx.showToast({ title: `${t('set_ticket_added', null, lang) || '已添加'}「${label}」`, icon: 'success' });
    },

    cancelAddTicket() {
        this.setData({ showTicketNameModal: false, newTicketType: '', newTicketName: '' });
    },

    switchTicket(e) {
        const ticketId = e.currentTarget.dataset.id;
        const config = this.data.config;
        const newConfig = { ...config, activeTicketId: ticketId };
        app.updateConfig(newConfig);
        this.initData();
    },

    deleteTicket(e) {
        const ticketId = e.currentTarget.dataset.id;
        const config = this.data.config;
        const lang = config.language;
        
        if (config.tickets.length <= 1) {
            wx.showToast({ title: t('set_ticket_at_least_one', null, lang) || '至少保留一张票', icon: 'none' });
            return;
        }

        wx.showModal({
            title: t('set_confirm_delete_ticket', null, lang) || '确认删除',
            content: t('set_delete_ticket_confirm', null, lang) || '确定要删除这张票吗？关联的订单将被取消。',
            success: (res) => {
                if (res.confirm) {
                    const updatedTickets = config.tickets.filter(t => t.id !== ticketId);
                    const newActiveTicketId = ticketId === config.activeTicketId 
                        ? updatedTickets[0].id 
                        : config.activeTicketId;

                    const newConfig = {
                        ...config,
                        tickets: updatedTickets,
                        activeTicketId: newActiveTicketId
                    };
                    app.updateConfig(newConfig);

                    const orders = app.globalData.orders || [];
                    const updatedOrders = orders.map(o => {
                        if (o.ticketId === ticketId) {
                            return { ...o, status: OrderStatus.CANCELLED, cancelledAt: Date.now() };
                        }
                        return o;
                    });
                    app.globalData.orders = updatedOrders;
                    wx.setStorageSync('tm_orders', updatedOrders);

                    this.initData();
                    wx.showToast({ title: t('set_ticket_deleted', null, lang) || '已删除', icon: 'success' });
                }
            }
        });
    },

    exportData() {
        const data = {
            users: app.globalData.users || [],
            orders: app.globalData.orders || [],
            config: app.globalData.config
        };
        const json = JSON.stringify(data);
        if (!json || json === '{}') {
            return wx.showToast({ title: this.data.t.set_export_empty, icon: 'none' });
        }
        wx.setClipboardData({
            data: json,
            success: () => {
                wx.showToast({ title: this.data.t.set_export_success, icon: 'success' });
            }
        });
    },

    importData() {
        const lang = this.data.config.language;
        wx.showModal({
            title: this.data.t.set_import,
            content: this.data.t.set_import_confirm,
            success: (res) => {
                if (res.confirm) {
                    wx.getClipboardData({
                        success: (clipRes) => {
                            try {
                                const data = JSON.parse(clipRes.data);
                                if (!data.config || !data.users || !data.orders) {
                                    throw new Error('Invalid format');
                                }
                                if (!Array.isArray(data.users) || !Array.isArray(data.orders)) {
                                    throw new Error('Invalid format');
                                }
                                const isV2 = data.config.version >= 2 && Array.isArray(data.config.tickets);
                                const isV1 = typeof data.config.cycleStartDate === 'number' && data.config.priceMatrix;
                                if (!isV2 && !isV1) {
                                    throw new Error('Invalid format');
                                }
                                app.globalData.users = data.users;
                                wx.setStorageSync('tm_users', data.users);
                                
                                if (isV1) {
                                    const migratedConfig = app.migrateV1ToV2(data.config, data.orders);
                                    app.globalData.config = migratedConfig;
                                    app.globalData.orders = wx.getStorageSync('tm_orders');
                                } else {
                                    app.globalData.orders = data.orders;
                                    app.updateConfig(data.config);
                                    wx.setStorageSync('tm_orders', data.orders);
                                }
                                
                                this.initData();
                                wx.showToast({ title: this.data.t.set_import_success, icon: 'success' });
                            } catch (e) {
                                wx.showToast({ title: this.data.t.set_import_fail, icon: 'none' });
                            }
                        }
                    });
                }
            }
        });
    },

    renewTicket() {
        wx.showModal({
            title: this.data.t.set_renew,
            content: this.data.t.set_renew_confirm,
            success: (res) => {
                if (res.confirm) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const ts = today.getTime();
                    const config = this.data.config;
                    const activeTicket = Logic.getActiveTicket(config);

                    const updatedTickets = config.tickets.map(ticket => {
                        if (ticket.id === activeTicket.id) {
                            return {
                                ...ticket,
                                cycleStartDate: ts,
                                initialUsageOffset: { sends: 0, users: 0, cycleId: ts }
                            };
                        }
                        return ticket;
                    });

                    const newConfig = { ...config, tickets: updatedTickets };
                    app.updateConfig(newConfig);
                    this.initData();
                    wx.showToast({ title: this.data.t.set_renew_success, icon: 'success' });
                }
            }
        });
    },

    editUser(e) {
        const id = e.currentTarget.dataset.id;
        const user = (app.globalData.users || []).find(u => u.id === id);
        if (!user) return;
        
        this.setData({
            editingUser: { ...user },
            showEditModal: true
        });
    },

    onUserNameInput(e) {
        const editingUser = this.data.editingUser;
        editingUser.name = e.detail.value;
        this.setData({ editingUser });
    },

    onUserPhoneInput(e) {
        const editingUser = this.data.editingUser;
        editingUser.phone = e.detail.value;
        this.setData({ editingUser });
    },

    saveUser() {
        const user = this.data.editingUser;
        const lang = this.data.config.language;
        if (!user || !user.name) {
            wx.showToast({ title: t('set_err_name_required', null, lang), icon: 'none' });
            return;
        }

        const users = app.globalData.users;
        const idx = users.findIndex(u => u.id === user.id);
        if (idx >= 0) {
            user.pinyinInitial = Logic.generatePinyinInitial(user.name);
            users[idx] = { ...users[idx], ...user };
            app.globalData.users = users;
            wx.setStorageSync('tm_users', users);
        }

        this.setData({
            showEditModal: false,
            editingUser: null,
            users: app.globalData.users
        });
        wx.showToast({ title: t('set_saved', null, lang), icon: 'success' });
    },

    cancelEditUser() {
        this.setData({
            showEditModal: false,
            editingUser: null
        });
    },

    deleteUser(e) {
        const id = e.currentTarget.dataset.id;
        const lang = this.data.config.language;
        const orders = app.globalData.orders || [];
        const hasOrders = orders.some(o => o.userId === id);
        
        if (hasOrders) {
            wx.showModal({
                title: t('set_delete_user_confirm', null, lang),
                content: t('set_delete_user_has_orders', null, lang),
                showCancel: false
            });
            return;
        }

        wx.showModal({
            title: t('set_confirm_delete', null, lang),
            content: t('set_delete_user_confirm', null, lang),
            success: (res) => {
                if (res.confirm) {
                    let users = app.globalData.users || [];
                    users = users.filter(u => u.id !== id);
                    app.globalData.users = users;
                    wx.setStorageSync('tm_users', users);
                    this.setData({ users });
                    wx.showToast({ title: t('set_deleted', null, lang), icon: 'success' });
                }
            }
        });
    },

    noop() {}
});
