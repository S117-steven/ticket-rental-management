const app = getApp();
import { DEFAULT_PRICE_MATRIX, Logic } from '../../utils/util';
import { t } from '../../utils/i18n';

Page({
    data: {
        step: 1,
        date: '',
        hasHistory: false,
        sends: 0,
        users: 0,
        tenants: [],
        prices: null,
        lang: 'zh',
        t: {},
        DurationType: ['4h', '8h', '12h', '24h', '48h', '7d', 'Remaining'],
        durationLabels: []
    },

    onLoad() {
        // Init state
        // 使用本地时间格式化当天日期
        const today = Logic.formatLocalDate(new Date());
        const prices = JSON.parse(JSON.stringify(DEFAULT_PRICE_MATRIX));
        this.setData({
            date: today,
            prices: prices
        });
        this.updateI18n();
    },

    updateI18n() {
        const lang = this.data.lang;
        const keys = [
            'ob_welcome', 'ob_subtitle', 'ob_date', 'ob_date_hint', 'ob_history',
            'ob_sends', 'ob_users', 'ob_new_note', 'ob_prev', 'ob_next',
            'ob_step2_title', 'ob_tenant_idx', 'ob_assigned', 'ob_name_ph', 'ob_phone_ph',
            'ob_price_title', 'ob_th_dur', 'ob_th_new', 'ob_th_reg', 'ob_finish',
            'ob_err_sends', 'ob_err_match', 'ob_err_fill',
            'ob_tenant_label', 'ob_rented_count_label',
            'ob_step1_title', 'ob_step1_subtitle', 'ob_limit_exceeded', 'ob_onboarding_title'
        ];
        const strings = {};
        keys.forEach(k => strings[k] = t(k, null, lang));
        const durationLabels = this.data.DurationType.map(d => t(Logic.getDurationI18nKey(d), null, lang));
        this.setData({ t: strings, durationLabels });

        wx.setNavigationBarTitle({ title: t('ob_onboarding_title', null, lang) });
    },

    setLanguage(e) {
        const lang = e.currentTarget.dataset.lang;
        this.setData({ lang });
        this.updateI18n();
        app.updateConfig({ ...app.globalData.config, language: lang });
        this.setData({ step: 2 });
    },

    bindDateChange(e) {
        this.setData({ date: e.detail.value });
    },

    toggleHistory(e) {
        this.setData({ hasHistory: e.detail.value });
    },

    bindNumberInput(e) {
        const field = e.currentTarget.dataset.field;
        let val = parseInt(e.detail.value);
        if (isNaN(val)) val = 0;
        this.setData({ [field]: val });
    },

    nextStep3() {
        const { hasHistory, sends, users, date, lang } = this.data;
        if (hasHistory) {
            if (sends < users) {
                return wx.showToast({ title: t('ob_err_sends', null, lang), icon: 'none' });
            }
            if (users > 5 || sends > 15) {
                return wx.showToast({ title: t('ob_limit_exceeded', null, lang), icon: 'none' });
            }

            // Init tenants
            let tenants = this.data.tenants;
            if (tenants.length !== users) {
                tenants = Array.from({ length: users }, () => ({ name: '', phone: '', count: 1 }));
                if (users === 1) tenants[0].count = sends;
                this.setData({ tenants });
            }
            this.setData({ step: 3 });
        } else {
            this.setData({ step: 4 });
        }
    },

    updateTenant(e) {
        const idx = e.currentTarget.dataset.idx;
        const field = e.currentTarget.dataset.field;
        const val = e.detail.value;
        const tenants = this.data.tenants;

        if (field === 'count') {
            tenants[idx][field] = parseInt(val) || 0;
        } else {
            tenants[idx][field] = val;
        }
        this.setData({ tenants });
    },

    nextStep4() {
        const { tenants, sends, lang } = this.data;
        const total = tenants.reduce((acc, t) => acc + (t.count || 0), 0);
        if (total !== sends) {
            return wx.showToast({ title: t('ob_err_match', { total, sends }, lang), icon: 'none' });
        }
        if (tenants.some(t => !t.name || !t.phone || t.count < 1)) {
            return wx.showToast({ title: t('ob_err_fill', null, lang), icon: 'none' });
        }
        this.setData({ step: 4 });
    },

    updatePrice(e) {
        const type = e.currentTarget.dataset.type; // 'newCustomer' or 'regularCustomer'
        const dur = e.currentTarget.dataset.dur;
        const val = parseInt(e.detail.value) || 0;
        const prices = this.data.prices;
        prices[type][dur] = val;
        this.setData({ prices });
    },

    prevStep() {
        const current = this.data.step;
        if (current === 2) {
            this.setData({ step: 1 });
        } else if (current === 4) {
            this.setData({ step: this.data.hasHistory ? 3 : 2 });
        } else {
            this.setData({ step: current - 1 });
        }
    },

    finish() {
        const { date, hasHistory, sends, users, tenants, prices, lang } = this.data;
        // 使用本地时间解析，避免 UTC 时区偏移
        const startTs = Logic.parseLocalDate(date);

        const activeTenants = hasHistory ? tenants : [];

        activeTenants.forEach(tenant => {
            const uid = Logic.uuid();
            const name = tenant.name.trim();
            const user = {
                id: uid,
                name: name,
                phone: tenant.phone.trim(),
                totalContribution: 0,
                pinyinInitial: Logic.generatePinyinInitial(name),
                cycleUsageOffset: {
                    cycleId: startTs,
                    sends: Math.max(0, parseInt(tenant.count, 10) || 0)
                }
            };
            app.saveUser(user);
        });

        const ticketId = Logic.uuid();
        app.updateConfig({
            isInitialized: true,
            language: lang,
            version: 2,
            activeTicketId: ticketId,
            tickets: [{
                id: ticketId,
                type: 'monthly',
                label: '月票 #1',
                cycleStartDate: startTs,
                priceMatrix: prices,
                initialUsageOffset: {
                    sends: hasHistory ? Math.max(0, parseInt(sends, 10) || 0) : 0,
                    users: hasHistory ? Math.max(0, parseInt(users, 10) || 0) : 0,
                    cycleId: startTs
                }
            }],
            swishNumber: ''
        });

        wx.switchTab({ url: '/pages/dashboard/dashboard' });
    }
});
