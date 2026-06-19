const app = getApp();
import { Logic, OrderStatus } from '../../utils/util';
import { t } from '../../utils/i18n';

Component({
    properties: {
        show: {
            type: Boolean,
            value: false,
            observer: function (newVal) {
                if (!newVal) return;
                if (this.data.initialData) {
                    this.initEditData(this.data.initialData);
                } else {
                    this.initData();
                }
            }
        },
        initialData: {
            type: Object,
            value: null,
            observer: function (newVal) {
                if (this.data.show) {
                    newVal ? this.initEditData(newVal) : this.initData();
                }
            }
        },
        presetDate: {
            type: String,
            value: '',
            observer: function () {
                if (this.data.show && !this.data.initialData) this.initData();
            }
        }
    },

    data: {
        users: [],
        filteredUsers: [],
        userQuery: '',
        DurationType: ['4h', '8h', '12h', '24h', '48h', '7d', 'Remaining'],
        durationOptions: [],
        userId: '',
        name: '',
        phone: '',
        date: '',
        time: '',
        duration: '24h',
        durationLabel: '24h',
        price: 0,
        valid: false,
        reason: '',
        hasReminder: false,
        reminderMinutes: 30,
        isEdit: false,
        t: {},
        customerSortMode: 'alpha',
        customerGroups: [],
        indexLetters: [],
        showIndex: true,
        showCustomerPicker: false,
        activeLetter: ''
    },

    methods: {
        parseLocalDateTime(date, time) {
            const [year, month, day] = date.split('-').map(Number);
            const [hour, minute] = time.split(':').map(Number);
            return new Date(year, month - 1, day, hour, minute).getTime();
        },

        getDefaultDateTime() {
            const pad = (n) => n.toString().padStart(2, '0');
            const now = new Date();
            const today = Logic.formatLocalDate(now);
            const date = this.data.presetDate || today;
            const time = date === today ? `${pad(now.getHours())}:${pad(now.getMinutes())}` : '09:00';
            return { date, time };
        },

        initData() {
            const { date, time } = this.getDefaultDateTime();
            const lang = app.globalData.config.language;
            this.updateI18n();
            this.setData({
                users: app.globalData.users || [],
                userId: '',
                userQuery: '',
                name: '',
                phone: '',
                date,
                time,
                duration: '24h',
                durationLabel: t('dur_24h', null, lang),
                price: 0,
                valid: false,
                reason: '',
                hasReminder: false,
                reminderMinutes: 30,
                isEdit: false
            }, () => {
                this.refreshFilteredUsers('');
                this.validate();
            });
        },

        initEditData(data) {
            if (!data) return;
            const pad = (n) => n.toString().padStart(2, '0');
            const d = new Date(data.startTime);
            const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
            const name = data.userParams?.name || '';
            const phone = data.userParams?.phone || '';
            const lang = app.globalData.config.language;
            const dur = data.durationType || '24h';

            this.updateI18n();
            this.setData({
                users: app.globalData.users || [],
                userId: data.userId || '',
                userQuery: name || phone,
                name,
                phone,
                date,
                time,
                duration: dur,
                durationLabel: t(Logic.getDurationI18nKey(dur), null, lang),
                hasReminder: false,
                reminderMinutes: 30,
                isEdit: true
            }, () => {
                this.refreshFilteredUsers(name || phone);
                this.validate();
            });
        },

        updateI18n() {
            const lang = app.globalData.config.language;
            const keys = [
                'ord_title', 'ord_tenant', 'ord_select', 'ord_search_customer',
                'ord_customer_search_ph', 'ord_no_customer_results', 'ord_clear_customer',
                'ord_new_customer', 'ord_customer_history', 'ord_name', 'ord_phone',
                'ord_linked', 'ord_start', 'ord_duration', 'ord_est_price',
                'ord_valid', 'ord_cancel', 'ord_confirm', 'ord_reminder_title',
                'ord_reminder_alarm', 'ord_reminder_minutes', 'set_save',
                'dash_delete', 'dash_delete_confirm', 'dash_success', 'dash_saved',
                'ord_err_name', 'ord_err_phone', 'ord_err_time', 'ord_err_cycle_start',
                'ord_err_cycle', 'ord_err_quota', 'ord_err_users', 'ord_err_overlap',
                'ord_err_freq', 'ord_sort_alpha', 'ord_sort_cycle'
            ];
            const strings = {};
            keys.forEach(k => strings[k] = t(k, null, lang));
            const durationOptions = this.data.DurationType.map(d => t(Logic.getDurationI18nKey(d), null, lang));
            this.setData({ t: strings, durationOptions });
        },

        normalizePhone(phone) {
            return String(phone || '').replace(/\s+/g, '');
        },

        findUserByPhone(phone) {
            const normalized = this.normalizePhone(phone);
            if (!normalized) return null;
            return (app.globalData.users || []).find(u => this.normalizePhone(u.phone) === normalized) || null;
        },

        getCustomerOptions(query = '') {
            const lang = app.globalData.config.language;
            const cycleStart = app.globalData.config.cycleStartDate;
            const effectiveOrders = Logic.getEffectiveOrders(app.globalData.orders || []);
            const normalizedQuery = String(query || '').trim().toLowerCase();

            const enriched = (app.globalData.users || [])
                .map(user => {
                    const orderCount = effectiveOrders.filter(o =>
                        o.userId === user.id &&
                        o.startTime >= cycleStart &&
                        o.startTime <= Logic.getCycleEnd(cycleStart)
                    ).length;
                    const historyCount = orderCount + Logic.getCycleUsageOffset(user, cycleStart);
                    const initial = user.pinyinInitial || Logic.getPinyinInitial(user.name || user.phone || '');
                    return {
                        ...user,
                        historyCount,
                        initial,
                        historyText: historyCount > 0
                            ? t('ord_customer_history', { count: historyCount }, lang)
                            : t('ord_new_customer', null, lang),
                        searchText: `${user.name || ''} ${user.phone || ''} ${initial}`.toLowerCase()
                    };
                })
                .filter(user => {
                    if (!normalizedQuery) return true;
                    return user.searchText.includes(normalizedQuery) ||
                           user.initial.toLowerCase() === normalizedQuery;
                });

            if (this.data.customerSortMode === 'cycle' && !normalizedQuery) {
                enriched.sort((a, b) => {
                    if (b.historyCount !== a.historyCount) return b.historyCount - a.historyCount;
                    return String(a.name || '').localeCompare(String(b.name || ''));
                });
            } else {
                enriched.sort((a, b) => {
                    if (a.initial !== b.initial) return a.initial.localeCompare(b.initial);
                    return String(a.name || '').localeCompare(String(b.name || ''));
                });
            }

            return enriched;
        },

        refreshFilteredUsers(query) {
            const users = app.globalData.users || [];
            const filtered = this.getCustomerOptions(query);
            const showGrouped = !query && this.data.customerSortMode === 'alpha';
            
            if (showGrouped) {
                const { groups, letters } = Logic.buildCustomerGroups(filtered);
                this.setData({
                    users,
                    filteredUsers: filtered,
                    customerGroups: groups,
                    indexLetters: letters,
                    showIndex: true
                });
            } else {
                this.setData({
                    users,
                    filteredUsers: filtered,
                    customerGroups: [{ letter: '', users: filtered }],
                    indexLetters: [],
                    showIndex: false
                });
            }
        },

        onSortChange(e) {
            const mode = e.currentTarget.dataset.mode;
            this.setData({ customerSortMode: mode });
            this.refreshFilteredUsers(this.data.userQuery);
        },

        onIndexTap(e) {
            const letter = e.currentTarget.dataset.letter;
            const groups = this.data.customerGroups;
            let scrollOffset = 0;
            for (const group of groups) {
                if (group.letter === letter) break;
                scrollOffset += group.users.length * 50;
            }
            this.setData({ customerScrollTop: scrollOffset, activeLetter: letter });
        },

        onCustomerScroll(e) {
            const scrollTop = e.detail.scrollTop;
            const groups = this.data.customerGroups;
            let currentLetter = '';
            let accumulated = 0;
            
            for (const group of groups) {
                if (!group.letter) continue;
                const groupHeight = group.users.length * 50;
                if (scrollTop < accumulated + groupHeight) {
                    currentLetter = group.letter;
                    break;
                }
                accumulated += groupHeight;
            }
            
            if (currentLetter && currentLetter !== this.data.activeLetter) {
                this.setData({ activeLetter: currentLetter });
            }
        },

        onCustomerSearch(e) {
            const userQuery = e.detail.value;
            this.setData({ userQuery });
            this.refreshFilteredUsers(userQuery);
        },

        selectCustomer(e) {
            const id = e.currentTarget.dataset.id;
            const user = (app.globalData.users || []).find(u => u.id === id);
            if (!user) return;

            this.setData({
                userId: user.id,
                userQuery: user.name || user.phone || '',
                name: user.name || '',
                phone: user.phone || ''
            }, () => {
                this.refreshFilteredUsers(this.data.userQuery);
                this.validate();
            });
        },

        clearCustomer() {
            this.setData({
                userId: '',
                userQuery: '',
                name: '',
                phone: ''
            }, () => {
                this.refreshFilteredUsers('');
                this.validate();
            });
        },

        openCustomerPicker() {
            this.setData({ showCustomerPicker: true });
            this.refreshFilteredUsers('');
        },

        closeCustomerPicker() {
            this.setData({ showCustomerPicker: false });
        },

        selectCustomerAndClose(e) {
            this.selectCustomer(e);
            this.closeCustomerPicker();
        },

        onInput(e) {
            const field = e.currentTarget.dataset.field;
            this.setData({ [field]: e.detail.value }, () => this.validate());
        },

        bindDateTimeChange(e) {
            const field = e.currentTarget.dataset.field;
            this.setData({ [field]: e.detail.value }, () => this.validate());
        },

        onDurationChange(e) {
            const idx = e.detail.value;
            const dur = this.data.DurationType[idx];
            const lang = app.globalData.config.language;
            const durLabel = t(Logic.getDurationI18nKey(dur), null, lang);
            this.setData({ duration: dur, durationLabel: durLabel }, () => this.validate());
        },

        toggleReminder(e) {
            this.setData({ hasReminder: e.detail.value });
        },

        resolveExistingUser() {
            if (this.data.userId) {
                return (app.globalData.users || []).find(u => u.id === this.data.userId) || null;
            }
            return this.findUserByPhone(this.data.phone);
        },

        validate() {
            const { name, phone, date, time, duration, isEdit } = this.data;
            if (!date || !time) return;

            const existingUser = this.resolveExistingUser();
            const currentUserId = existingUser ? existingUser.id : `temp:${this.normalizePhone(phone) || String(name || '').trim()}`;
            const currentOrderId = isEdit ? this.data.initialData.id : null;
            const startTs = this.parseLocalDateTime(date, time);
            const config = app.globalData.config;
            const activeTicket = Logic.getActiveTicket(config);
            const cycleEnd = Logic.getTicketCycleEnd(activeTicket);
            const endTs = Logic.getCalculatedEndTime(startTs, duration, cycleEnd);

            const ticketOrders = (app.globalData.orders || []).filter(o => o.ticketId === activeTicket.id);
            const ticketConfig = {
                ...config,
                cycleStartDate: activeTicket.cycleStartDate,
                maxSends: Logic.getTicketMaxSends(activeTicket),
                maxUsers: Logic.getTicketMaxUsers(activeTicket)
            };

            const validation = Logic.validateOrder(
                {
                    id: currentOrderId || 'temp',
                    userId: currentUserId,
                    name,
                    phone,
                    startTime: startTs,
                    endTime: endTs
                },
                ticketOrders,
                ticketConfig,
                currentUserId,
                isEdit,
                app.globalData.users || []
            );

            const isRegular = existingUser
                ? Logic.isRegularCustomer(existingUser.id, startTs, ticketOrders, ticketConfig, currentOrderId, app.globalData.users || [])
                : false;
            const price = Logic.calculatePrice(duration, !isRegular, activeTicket.priceMatrix || config.priceMatrix);

            this.setData({
                valid: validation.valid,
                reason: validation.reason || '',
                price
            });
        },

        close() {
            this.triggerEvent('close');
        },

        submit() {
            if (!this.data.valid) {
                const message = this.data.t[this.data.reason] || this.data.reason || this.data.t.ord_err_time;
                wx.showToast({ title: message, icon: 'none' });
                return;
            }

            const { name, phone, date, time, duration, price, hasReminder, reminderMinutes, isEdit, initialData } = this.data;
            const trimmedName = String(name || '').trim();
            const trimmedPhone = String(phone || '').trim();
            const startTs = this.parseLocalDateTime(date, time);
            const config = app.globalData.config;
            const activeTicket = Logic.getActiveTicket(config);
            const cycleEnd = Logic.getTicketCycleEnd(activeTicket);
            const endTs = Logic.getCalculatedEndTime(startTs, duration, cycleEnd);
            const now = Date.now();
            const existingUser = this.resolveExistingUser();
            const pinyinInitial = Logic.generatePinyinInitial(trimmedName);
            const userToSave = existingUser
                ? { ...existingUser, name: trimmedName, phone: trimmedPhone, pinyinInitial }
                : { id: Logic.uuid(), name: trimmedName, phone: trimmedPhone, totalContribution: 0, pinyinInitial };

            app.saveUser(userToSave);

            const nextStatus = isEdit
                ? initialData.status
                : Logic.getDisplayStatus({ startTime: startTs, endTime: endTs, status: OrderStatus.PENDING }, now);
            const orderToSave = {
                id: isEdit ? initialData.id : Logic.uuid(),
                ticketId: activeTicket.id,
                userId: userToSave.id,
                userParams: { name: trimmedName, phone: trimmedPhone },
                startTime: startTs,
                endTime: endTs,
                durationType: duration,
                price,
                status: nextStatus,
                createdAt: isEdit ? initialData.createdAt : now
            };
            app.saveOrder(orderToSave);

            if (hasReminder) {
                this.addCalendarEvent(trimmedName, trimmedPhone, startTs, duration, reminderMinutes);
            }

            wx.showToast({ title: this.data.t.dash_saved, icon: 'success' });
            this.close();
        },

        addCalendarEvent(name, phone, startTs, duration, minutesBefore) {
            const alarmOffset = minutesBefore * 60;
            const lang = app.globalData.config.language;
            const config = app.globalData.config;
            const cycleEnd = Logic.getCycleEnd(config.cycleStartDate);
            const endTs = Logic.getCalculatedEndTime(startTs, duration, cycleEnd);
            const durationStr = t(Logic.getDurationI18nKey(duration), null, lang);
            const titlePrefix = t('cal_event_title', null, lang);
            const phoneLabel = t('dash_cal_phone', null, lang);
            const locationLabel = t('cal_edit_order', null, lang);

            wx.addPhoneCalendar({
                title: `${titlePrefix}: ${name} (${durationStr})`,
                startTime: Math.floor(startTs / 1000),
                endTime: Math.floor(endTs / 1000),
                description: `${phoneLabel}: ${phone}`,
                location: locationLabel,
                alarm: true,
                alarmOffset,
                success: () => {
                    wx.showToast({ title: t('dash_success', null, lang), icon: 'success' });
                },
                fail: (err) => {
                    console.error('Calendar failed', err);
                }
            });
        },

        deleteOrder() {
            wx.showModal({
                title: this.data.t.dash_delete,
                content: this.data.t.dash_delete_confirm,
                confirmColor: '#DC2626',
                success: (res) => {
                    if (res.confirm) {
                        this.triggerEvent('delete', { id: this.data.initialData.id });
                        this.close();
                    }
                }
            });
        },

        noop() { }
    }
});
