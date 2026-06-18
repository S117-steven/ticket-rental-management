const app = getApp();
import { Logic } from '../../utils/util';
import { t } from '../../utils/i18n';

Page({
    data: {
        config: null,
        isoDate: '',
        DurationType: ['4h', '8h', '12h', '24h', '48h', '7d', 'Remaining'],
        t: {}
    },

    onShow() {
        this.initData();
    },

    initData() {
        const config = app.globalData.config;
        const isoDate = Logic.formatLocalDate(config.cycleStartDate);
        this.setData({ config, isoDate });
        this.updateI18n();
    },

    updateI18n() {
        const lang = this.data.config.language;
        const keys = [
            'set_title', 'set_lang', 'set_cycle', 'set_renew',
            'set_price', 'set_save', 'set_feedback', 'ob_th_dur',
            'ob_th_new', 'ob_th_reg', 'set_renew_confirm'
        ];
        const strings = {};
        keys.forEach(k => strings[k] = t(k, null, lang));
        this.setData({ t: strings });
        wx.setNavigationBarTitle({ title: t('nav_settings', null, lang) });
    },

    setLanguage(e) {
        const lang = this.data.config.language;
        const newLang = lang === 'en' ? 'zh' : (lang === 'zh' ? 'sv' : 'en');
        // Or select logic, here toggle for simplicity or use picker in wxml
        // Actually the picker in wxml is better.
    },

    onLangChange(e) {
        // Picker change
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
        const type = e.currentTarget.dataset.type; // 'newCustomer' or 'regularCustomer'
        const dur = e.currentTarget.dataset.dur;
        const val = parseInt(e.detail.value) || 0;

        const newConfig = { ...this.data.config };
        newConfig.priceMatrix[type][dur] = val;
        app.updateConfig(newConfig);
        this.setData({ config: newConfig });
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
                    wx.showToast({ title: 'Renewed', icon: 'success' });
                }
            }
        });
    }
});
