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

        const commonChars = {
            'A':'阿啊哎哀唉埃挨矮爱碍安岸按案暗昂凹熬傲奥',
            'B':'八巴把爸吧白百败拜班般板办半伴扮帮绑棒包宝饱报抱暴爆杯北被本奔鼻比笔闭必壁避边编便变遍标表别冰兵丙并病波玻伯博补捕不布步部',
            'C':'擦才材财采彩菜参餐残蚕灿藏操草册测层曾差拆产长常厂场唱超朝潮车尘沉陈称趁成承城程吃池迟持尺冲充虫抽仇丑初出除楚处川穿传窗创春词此刺从丛凑粗催存寸错',
            'D':'达打大呆代带待袋戴丹单但弹淡当刀导到倒道得的灯登等低底地弟帝点典电店掉丁顶定东冬懂动洞都斗豆读独度短断段堆对队顿多夺朵躲',
            'E':'额恶儿耳尔二',
            'F':'发乏法番翻凡烦反犯方防房仿访飞非肥废分份风封疯逢凤夫服浮福父付妇复富',
            'G':'该改概干甘赶感刚钢高搞告哥歌格给根跟更工公功攻供共够姑孤古谷股固故顾怪关观管光广归贵国果过',
            'H':'哈孩海含寒汉好号喝合何和河核黑很恨红后厚呼湖胡虎互户花华化画话怀坏欢环换皇黄回会活火或获',
            'J':'几击饥机鸡积基及吉级极即急集疾挤计记纪技际济继寄加佳家假价架尖间简见件建剑将江奖讲降交角脚较教接街阶节结姐解介今斤金尽近进京经精景警净竟敬境静纠究九酒久就举句巨具据距剧卷决绝军均',
            'K':'卡开看康抗考靠科可渴克刻客课肯空孔恐口扣苦快块况矿亏困扩',
            'L':'拉啦来兰蓝篮览浪劳老乐了雷冷离礼李里理力历厉立丽利连联脸练良两亮量料列林临灵另令流留六龙笼楼路吕绿乱论轮罗落',
            'M':'妈麻马吗买卖满慢忙毛冒么没美门们闷梦迷米面民名明命摸末莫某木目牧墓幕慕暮',
            'N':'拿哪那奶男南难脑闹内能你年念娘宁牛农浓女暖',
            'O':'哦偶',
            'P':'怕排派盘判旁跑泡赔配喷朋捧碰批皮片漂拼平评凭破扑铺葡朴浦普谱',
            'Q':'七妻期齐其奇骑起气弃汽千前浅枪强桥切亲青轻清情晴请秋求球区曲取去趣全权劝缺却确群',
            'R':'然燃让绕热人仁忍认任日荣容融如入软瑞弱',
            'S':'撒洒三散桑扫色森杀沙山衫闪善伤商赏上少绍设社申身深神甚生声圣胜师失诗十石时实食史使始世市示事是视室适收手首受书殊输熟暑术束树数双谁水睡顺说司丝私思死四松送速算虽随岁碎孙所',
            'T':'他她它台太谈叹探汤逃特提题天田条铁听通同统痛头图土团推退托拖脱',
            'W':'哇外完玩晚万王网往望忘为位文问我无五物误',
            'X':'西希息习系细戏虾下先鲜闲显现限线相香想象小校笑些心信兴星行醒幸性姓兄休修许续选学雪寻训迅',
            'Y':'压呀牙芽雅亚烟言岩沿炎研眼演央羊阳养样要也业叶页一衣医已以易意因阴音引应英影映永泳用由邮有又于鱼娱雨语元原远院愿月云允运',
            'Z':'杂灾载在咱暂赞早造则怎曾张章长找照者这真正之支知值指只纸至志制治中钟终种重周主住注祝著助转装准子自字总走足族组嘴最昨左做作座'
        };

        for (let initial in commonChars) {
            if (commonChars[initial].indexOf(char) !== -1) return initial;
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
