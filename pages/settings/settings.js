const app = getApp();
import { Logic } from '../../utils/util';
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
        showEditModal: false
    },

    onShow() {
        this.initData();
    },

    initData() {
        const config = app.globalData.config;
        const isoDate = Logic.formatLocalDate(config.cycleStartDate);
        const lang = config.language;
        const durationLabels = this.data.DurationType.map(d => t(Logic.getDurationI18nKey(d), null, lang));
        const users = app.globalData.users || [];
        this.setData({ config, isoDate, durationLabels, users });
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
        // 使用本地时间解析，避免 UTC 时区偏移
        const ts = Logic.parseLocalDate(e.detail.value);

        const newConfig = {
            ...this.data.config,
            cycleStartDate: ts,
            initialUsageOffset: { sends: 0, users: 0, cycleId: ts }
        };
        app.updateConfig(newConfig);
        this.initData();
    },



    updatePrice(e) {
        const type = e.currentTarget.dataset.type;
        const dur = e.currentTarget.dataset.dur;
        let val = parseInt(e.detail.value) || 0;
        if (val < 0) val = 0;
        if (val > 9999) val = 9999;

        const newConfig = { ...this.data.config, priceMatrix: JSON.parse(JSON.stringify(this.data.config.priceMatrix)) };
        newConfig.priceMatrix[type][dur] = val;
        app.updateConfig(newConfig);
        this.setData({ config: newConfig });
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
                                app.globalData.users = data.users;
                                app.globalData.orders = data.orders;
                                app.updateConfig(data.config);
                                wx.setStorageSync('tm_users', data.users);
                                wx.setStorageSync('tm_orders', data.orders);
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
                    const newConfig = {
                        ...this.data.config,
                        cycleStartDate: ts,
                        initialUsageOffset: { sends: 0, users: 0, cycleId: ts }
                    };
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
        if (!user || !user.name) {
            wx.showToast({ title: '请输入姓名', icon: 'none' });
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
        wx.showToast({ title: '已保存', icon: 'success' });
    },

    cancelEditUser() {
        this.setData({
            showEditModal: false,
            editingUser: null
        });
    },

    deleteUser(e) {
        const id = e.currentTarget.dataset.id;
        wx.showModal({
            title: '确认删除',
            content: this.data.t.set_delete_user_confirm || '确定要删除这个用户吗？',
            success: (res) => {
                if (res.confirm) {
                    let users = app.globalData.users || [];
                    users = users.filter(u => u.id !== id);
                    app.globalData.users = users;
                    wx.setStorageSync('tm_users', users);
                    this.setData({ users });
                    wx.showToast({ title: '已删除', icon: 'success' });
                }
            }
        });
    },

    noop() {}
});
