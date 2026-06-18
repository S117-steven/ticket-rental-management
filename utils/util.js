// util.js
export const DurationType = {
    FOUR_HOURS: '4h',
    EIGHT_HOURS: '8h',
    TWELVE_HOURS: '12h',
    TWENTY_FOUR_HOURS: '24h',
    FORTY_EIGHT_HOURS: '48h',
    SEVEN_DAYS: '7d',
    REMAINING: 'Remaining'
};

export const OrderStatus = {
    PENDING: 'Pending',
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled'
};

export const DEFAULT_PRICE_MATRIX = {
    newCustomer: {
        '4h': 40, '8h': 60, '12h': 80, '24h': 100, '48h': 180, '7d': 500, 'Remaining': 600
    },
    regularCustomer: {
        '4h': 35, '8h': 50, '12h': 70, '24h': 90, '48h': 160, '7d': 450, 'Remaining': 550
    }
};

export const MAX_SENDS_PER_CYCLE = 15;
export const MAX_USERS_PER_CYCLE = 5;
export const CYCLE_DAYS = 30;

export const DURATION_MS = {
    '4h': 4 * 60 * 60 * 1000,
    '8h': 8 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '48h': 48 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    'Remaining': 0
};

export const Logic = {
    /**
     * 将本地日期格式化为 YYYY-MM-DD 字符串
     * @param {Date|number} dateOrTs - Date对象或时间戳
     * @returns {string} 格式化后的日期字符串 YYYY-MM-DD
     */
    formatLocalDate: (dateOrTs) => {
        const d = new Date(dateOrTs);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * 解析YYYY-MM-DD字符串为本地时间午夜时间戳
     * @param {string} dateStr - 格式: YYYY-MM-DD
     * @returns {number} 本地时间午夜时间戳
     */
    parseLocalDate: (dateStr) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day, 0, 0, 0, 0).getTime();
    },

    uuid: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    getCycleEnd: (startDate) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + CYCLE_DAYS);
        d.setHours(23, 59, 59, 999);
        return d.getTime();
    },

    isSameDay: (ts1, ts2) => {
        const d1 = new Date(ts1);
        const d2 = new Date(ts2);
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    },

    getEffectiveOrders: (orders = []) => {
        return orders.filter(o => o.status !== OrderStatus.CANCELLED);
    },

    calculatePrice: (durationType, isNewCustomer, matrix) => {
        const prices = isNewCustomer ? matrix.newCustomer : matrix.regularCustomer;
        return prices[durationType] || 0;
    },

    getDisplayStatus: (order, now = Date.now()) => {
        if (!order) return OrderStatus.PENDING;
        if (order.status === OrderStatus.CANCELLED) return OrderStatus.CANCELLED;
        if (order.endTime <= now) return OrderStatus.COMPLETED;
        if (order.startTime > now) return OrderStatus.PENDING;
        return OrderStatus.ACTIVE;
    },

    getDurationI18nKey: (durationType) => {
        return durationType === DurationType.REMAINING ? 'dur_rem' : `dur_${durationType}`;
    },

    getCycleUsageOffset: (user, cycleStart) => {
        const offset = user && user.cycleUsageOffset;
        if (!offset || offset.cycleId !== cycleStart) return 0;
        return Math.max(0, Number(offset.sends) || 0);
    },

    isHistoricalCycleUser: (user, cycleStart) => {
        return Logic.getCycleUsageOffset(user, cycleStart) > 0;
    },

    /**
     * 判断用户是否为常客（在当前周期内有先行记录）
     * @param {string} userId - 用户ID
     * @param {number} orderStartTime - 当前订单的开始时间戳
     * @param {Array} allOrders - 所有订单列表
     * @param {Object} config - 配置对象（包含 cycleStartDate）
     * @param {string} currentOrderId - 当前正在编辑的订单ID（可选，用于编辑场景排除自身）
     * @returns {boolean} true=常客, false=新客
     */
    isRegularCustomer: (userId, orderStartTime, allOrders, config, currentOrderId = null, users = []) => {
        if (!userId) return false;

        const cycleStart = config.cycleStartDate;
        const user = users.find(u => u.id === userId);

        if (Logic.isHistoricalCycleUser(user, cycleStart) && orderStartTime >= cycleStart) {
            return true;
        }

        // 获取该用户的所有有效订单（排除已取消的）
        const userOrders = Logic.getEffectiveOrders(allOrders)
            .filter(o => o.userId === userId);

        // 在编辑场景下，排除当前正在编辑的订单
        const relevantOrders = currentOrderId
            ? userOrders.filter(o => o.id !== currentOrderId)
            : userOrders;

        // 检查是否存在满足条件的先行订单：
        // 条件: 订单日期 >= 月票激活日期 且 订单日期 < 本次订单日期
        const hasPriorOrder = relevantOrders.some(o =>
            o.startTime >= cycleStart && o.startTime < orderStartTime
        );

        return hasPriorOrder;
    },

    getCalculatedEndTime: (start, duration, cycleEnd) => {
        if (duration === DurationType.REMAINING) return cycleEnd;
        return start + DURATION_MS[duration];
    },

    formatSwishNumber: (input) => {
        let clean = input.replace(/\D/g, '');
        if (clean.startsWith('07')) {
            clean = '46' + clean.substring(1);
        }
        return clean;
    },

    calculateStats: (orders, config, users = []) => {
        const cycleStart = config.cycleStartDate;
        const cycleEnd = Logic.getCycleEnd(cycleStart);
        const cycleOrders = Logic.getEffectiveOrders(orders).filter(o =>
            o.startTime >= cycleStart && o.startTime <= cycleEnd
        );

        let usedCount = cycleOrders.length;
        const uniqueUserIds = new Set(cycleOrders.map(o => o.userId));
        let uniqueUsersCount = uniqueUserIds.size;

        if (config.initialUsageOffset && config.initialUsageOffset.cycleId === cycleStart) {
            usedCount += config.initialUsageOffset.sends;
            const historicalUserIds = new Set(
                users
                    .filter(u => Logic.isHistoricalCycleUser(u, cycleStart))
                    .map(u => u.id)
            );
            const duplicateHistoricalUsers = Array.from(uniqueUserIds)
                .filter(id => historicalUserIds.has(id)).length;
            uniqueUsersCount += Math.max(0, config.initialUsageOffset.users - duplicateHistoricalUsers);
        }

        usedCount = Math.min(usedCount, 999);

        const now = Date.now();
        let daysRemaining = 0;
        if (now < cycleEnd) {
            daysRemaining = Math.ceil((cycleEnd - now) / (1000 * 60 * 60 * 24));
        }

        return {
            usedCount,
            uniqueUsers: uniqueUsersCount,
            daysRemaining,
            totalRevenue: cycleOrders.reduce((acc, o) => acc + o.price, 0),
            activeCycleStart: cycleStart,
            activeCycleEnd: cycleEnd
        };
    },

    validateOrder: (newOrder, existingOrders, config, currentUserId, isEditMode = false, users = []) => {
        if (!String(newOrder.name || '').trim()) return { valid: false, reason: "ord_err_name" };
        if (!String(newOrder.phone || '').trim()) return { valid: false, reason: "ord_err_phone" };
        if (!newOrder.startTime || !newOrder.endTime) return { valid: false, reason: "ord_err_time" };

        const cycleStart = config.cycleStartDate;
        const cycleEnd = Logic.getCycleEnd(cycleStart);

        if (newOrder.startTime < cycleStart) return { valid: false, reason: "ord_err_cycle_start" };
        if (newOrder.startTime > cycleEnd) return { valid: false, reason: "ord_err_cycle" };
        if (newOrder.endTime <= newOrder.startTime) return { valid: false, reason: "ord_err_time" };
        if (newOrder.endTime > cycleEnd) return { valid: false, reason: "ord_err_cycle" };

        const effectiveOrders = Logic.getEffectiveOrders(existingOrders)
            .filter(o => isEditMode ? o.id !== newOrder.id : true);
        const cycleOrders = effectiveOrders.filter(o => o.startTime >= cycleStart && o.startTime <= cycleEnd);

        let currentSends = cycleOrders.length;
        let currentUniqueUsers = new Set(cycleOrders.map(o => o.userId));

        let offsetUsers = 0;
        if (config.initialUsageOffset && config.initialUsageOffset.cycleId === cycleStart) {
            currentSends += config.initialUsageOffset.sends;
            offsetUsers = config.initialUsageOffset.users;
        }

        if (currentSends >= MAX_SENDS_PER_CYCLE) return { valid: false, reason: "ord_err_quota" };

        const currentUser = users.find(u => u.id === currentUserId);
        const isExistingUserInCycle = currentUniqueUsers.has(currentUserId) ||
            Logic.isHistoricalCycleUser(currentUser, cycleStart);
        if (!isExistingUserInCycle && (currentUniqueUsers.size + offsetUsers) >= MAX_USERS_PER_CYCLE) {
            return { valid: false, reason: "ord_err_users" };
        }

        const hasOverlap = effectiveOrders.some(o => (newOrder.startTime < o.endTime) && (newOrder.endTime > o.startTime));
        if (hasOverlap) return { valid: false, reason: "ord_err_overlap" };

        const isDayOccupied = effectiveOrders.some(o => Logic.isSameDay(o.startTime, newOrder.startTime));
        if (isDayOccupied) return { valid: false, reason: "ord_err_freq" };

        return { valid: true };
    }
};
