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

    getPinyinInitial: (str) => {
        if (!str) return '#';
        const char = str.charAt(0);
        if (/[a-zA-Z]/.test(char)) return char.toUpperCase();
        if (/[0-9]/.test(char)) return '#';
        
        const code = char.charCodeAt(0);
        if (code < 0x4E00 || code > 0x9FFF) return '#';

        const pyTable = 'ABCDEFGHJKLMNOPQRSTWXYZ';
        const offsets = [
            0x4E00,0x4E28,0x4E36,0x4E3F,0x4E59,0x4E85,0x4E8C,0x4EA0,
            0x4EBA,0x513F,0x5165,0x516B,0x5182,0x5196,0x51AB,0x51E0,
            0x51F5,0x5200,0x529B,0x52F9,0x5315,0x531A,0x5338,0x5341,
            0x535C,0x5369,0x5382,0x53B6,0x53C8,0x53E3,0x56D7,0x571F,
            0x58EB,0x5902,0x590A,0x5915,0x5927,0x5973,0x5B50,0x5B80,
            0x5BF8,0x5C0F,0x5C22,0x5C38,0x5C6E,0x5C71,0x5DDB,0x5DF1,
            0x5E72,0x5E7A,0x5E7F,0x5EF4,0x5EFE,0x5F0B,0x5F13,0x5F50,
            0x5F61,0x5F73,0x5FC3,0x6208,0x6236,0x624B,0x652F,0x6534,
            0x6587,0x6597,0x65A4,0x65B9,0x65E0,0x65E5,0x66F0,0x6708,
            0x6728,0x6B20,0x6B62,0x6B79,0x6BB3,0x6BCB,0x6BD4,0x6BDB,
            0x6C0F,0x6C14,0x6C34,0x706B,0x722A,0x7236,0x723B,0x723F,
            0x7247,0x7259,0x725B,0x72AC,0x7384,0x7389,0x74DC,0x74E6,
            0x7518,0x751F,0x7528,0x7530,0x758B,0x7592,0x7676,0x767D,
            0x76AE,0x76BF,0x76EE,0x77DB,0x77E2,0x77F3,0x793A,0x79B8,
            0x79BE,0x7A74,0x7ACB,0x7AF9,0x7C73,0x7CF8,0x7F36,0x7F51,
            0x7F8A,0x7FBD,0x8001,0x800C,0x8012,0x8033,0x807F,0x8089,
            0x81E3,0x81EA,0x81F3,0x81FC,0x820C,0x821B,0x821F,0x826E,
            0x8272,0x8278,0x864D,0x866B,0x8840,0x8863,0x897E,0x898B,
            0x89D2,0x8BA0,0x8D1D,0x8D64,0x8D70,0x8DB3,0x8EAB,0x8ECA,
            0x8F66,0x8F69,0x8FBE,0x9093,0x90E8,0x91D1,0x9485,0x957F,
            0x9580,0x95F4,0x961D,0x96B6,0x96B9,0x96E8,0x9751,0x975E,
            0x97E6,0x9875,0x98CE,0x98DE,0x9965,0x9996,0x9999,0x9A6C,
            0x9AA8,0x9AD8,0x9E1F,0x9EBB,0x9EC4,0x9EFE,0x9F99,0x9FA5
        ];
        
        for (let i = offsets.length - 1; i >= 0; i--) {
            if (code >= offsets[i]) return pyTable[i] || '#';
        }
        return '#';
    },

    buildCustomerGroups: (users) => {
        const groups = {};
        users.forEach(u => {
            const initial = Logic.getPinyinInitial(u.name || u.phone || '');
            if (!groups[initial]) groups[initial] = [];
            groups[initial].push(u);
        });
        const letters = Object.keys(groups).sort();
        const result = letters.map(letter => ({ letter, users: groups[letter] }));
        return { groups: result, letters };
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
        if (newOrder.endTime > cycleEnd) {
            newOrder.endTime = cycleEnd;
        }

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
