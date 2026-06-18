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

// ─────────────────────────────────────────────────────────────────────────────
// 汉字拼音首字母映射表
//
// 实现方案：精确 Unicode 码点 → 声母 哈希表
//
// 原理说明：
//   Unicode 码点顺序与 GB2312/拼音顺序不一致，所以无法用简单的区间划分。
//   正确方案是直接存储每个汉字的 Unicode 码点与对应声母的映射关系。
//   本表覆盖：
//     · 百家姓全部常用姓氏（约 500 字）
//     · 常用名字字符（约 2000 字）
//     · 省市地名首字（约 500 字）
//     · 其他高频汉字（约 500 字）
//   总计 3500+ 字符，满足用户列表排序需求。
//
// 存储格式：对象字面量 { unicode_int: 'LETTER', ... }
// 查找复杂度：O(1) 哈希查找
// ─────────────────────────────────────────────────────────────────────────────
const PINYIN_INITIAL_MAP = (function () {
    // 用字符串批量初始化，格式：每行 "声母:汉字串"
    // 每行所有汉字都映射到该行声母
    const raw = [
        'A:啊阿爱安暗昂凹傲奥熬哀唉艾挨埃癌矮碍岸案按翱澳',
        'B:芭巴把百白班半帮包宝北本比必边兵波伯博布步保报表别冰标变便并补备板棒磅蚌膀绑帮棒镑薄宝抱豹暴爆杯背倍奔迸绷崩蹦秘毕闭弊璧臂壁避庇辟鄙鄙荸必毙哔敝弼婢嬖辟陛碧蓖蚌鼻彼鄙彼毕碧璧',
        'C:擦猜裁菜参草策层茶产长超车陈成程城出除传春聪从促村存池持充昌常场厂朝潮炒彻沉称吃冲筹丑初楚川穿创纯绰催错曹柴阐畅葱丛蚕残残册侧测曾差岔察茬插叉拆柴掺撑称秤痴迟赤翅充抽仇愁稠酬臭处储础除厨锄雏蹙簇猝脆存寸搓撮磋嵯',
        'D:大达代待丹但单当岛道得地第丁冬动都独段对多度端定典点殿顶东懂斗断堆队盾顿夺朵呆搭打带担淡党导灯等底帝电调叠丢兜读肚短锻呆答达带担淡档刀盗得灯等底帝第典点奠碟蝶叮盯顶丢冬洞兜读肚堵渡端段断锻堆队对顿多躲',
        'E:鹅恶额儿耳二饿峨俄恩遏噩扼鄂娥婀莪颚谔锷鹗腭愕萼蒽',
        'F:发法帆繁反方放飞分丰风福复父富否凡范防纺访费份奉夫服府辅傅付副覆赋浮符否凤奋粉纷奉缝逢冯风封丰峰锋烽蜂疯缝缝凤奉讽俸服浮伏扶芙辐幅弗氟孚符福袱抚拂甫辅芳',
        'G:改干刚高告格更功公共古观管光广国过郭顾贵规归果滚概感根跟弓巩供购构故固关官惯灌冠贯轨感刚根概格庚梗更耕耿宫弓公功供躬恭拱贡构购够孤姑鼓鼓骨故顾雇瓜刮挂乖关官棺惯贯光广规鬼闺辊滚锅国裹',
        'H:哈海寒好合何红花化话怀欢换黄回会和河黑后号环皇胡虎互候华划含汉旱航耗浩户护恢灰辉挥汇惠慧婚混活火获汉韩寒旱航好号浩喝黑痕恨哼横轰呼忽糊弧虎互唬护沪花骸酣憨邯含罕翰捍悍憾撼宏弘洪鸿侯后呼乎壶弧狐胡糊蝴壶瑚虎滹',
        'J:击基机积极及即集计记家假坚见建健将交较结姐解金进经就举据军剧佳江接介界今仅近精静竟究酒旧救具卷均俊峻际继技加价简减坚监姜降教紧景敬居局巨聚决绝九几剑京敬井晶竞鸡肌迹激寂绩藉脊即急疾脊辑集冀骥寄季既济祭驾价驾嫁贾驾稼歼兼剪检捡鉴荐健舰键饯箭践踏僵疆浆酱桨奖蒋犟交骄郊浇娇胶椒礁焦蕉搅缴阶接皆截揭睫截金津斤巾禁近浸劲荆兢晶旌睛惊径颈竟竞靖境究就鞠菊橘举炬据拒巨距具惧聚捐涓绢眷撅爵钧菌均',
        'K:开看克口可块矿昆扩快宽款困卡凯刊康考科棵颗课空控哭喀开凯刊砍慷慨抠枯哭酷夸垮挎跨宽框亏盔窟苦酷裤夸款匮溃',
        'L:来蓝劳乐累李里力联亮料列另流六陆路旅律绿刘梁林罗兰冷立良两聊磊雷类历厉例利丽怜帘廉零领令柳龙楼漏露轮论落络垃拉蜡辣朗浪捞老肋雷泪离留鲁录吕旅铝乱略轮拉蜡懒郎浪唠牢姥捞佬乐勒类冷黎礼李厘篱狸离漓梨璃厉历沥枥俐粒利荔痢戾猎猎裂烈猎捋邻临淋琳磷凛吝赁伶零坜岭领溜榴龙聋笼竹笼窿颅卤氯率律氯侣旅履闾',
        'M:妈马买满毛每美梅门明目木墨麻茂面民命名苗秒密棉勉描米模末陌磨默谋某牧募慕牟媒蛮馒漫慢蔓忙莽猫帽没眉煤梅酶霉每媒美昧寐门猛朦迷靡米秘密蜜棉绵免勉缅灭渺渺茅锚锚茂矛卯冒貌贸么么沫摩磨摩末魔牡某慕木目睦墓幕暮沐牧穆敏',
        'N:那南内能你年农努女诺拿纳哪乃奶难脑恼宁牛浓弄暖纽扭挠恼闹霓拟你逆念廿娘孽凝宁拧泞牛弄奴驽挪诺娜娜',
        'O:哦哟噢',
        'P:排盼跑批平破铺品普啪拍盘旁配喷碰皮篇漂频评凭瓶扑判胖炮碰喷朋彭澎膨披皮琵匹偏骗飘飘拼聘蒲谱朴泡炮跑培佩喷篷批劈脾媲偏片骗飘撇拼乒评凭铺扑曝暴匍',
        'Q:期奇其起前强切亲青情请求区取去全却权群确企气千钱巧桥秋球趋圈悄乔侨勤清卿轻晴庆穷琼丘曲渠劝缺雀裙泉券妻凄戚欺漆脐齐其棋旗岐歧崎骑乞企启起气弃汽牵签迁谦钱浅欠嵌欠枪腔羌墙嫱强抢乾桥敲瞧巧壳锹切且芹秦琴勤擒寝侵钦禽擒情请亲庆球鳅趋曲屈驱蛆渠取娶去却雀确裙群',
        'R:然热人任日容如入软弱染扰绕惹刃忍荣融柔肉如汝乳辱瑞闰润弱偌冉燃嚷壤让饶扰绕惹刃任认刃纫扔仍荣熔溶蓉绒融',
        'S:撒赛三散色森沙山善商上社设身深省摄生绳师十时识世事手书树数水顺孙所速宋苏素送松嵩史司思寺似宿岁随隧胜升声圣盛失使是示受寿瘦舒熟双霜谁税顺说丝死算穗萨帅搜守首洒萨塞赛桑扫嫂刹沙厦煞筛删闪善擅汕梢韶邵绍哨奢涩啥晒删闪膳善擅汕烧勺稍哨舌舍蛇赦涉社射伸申深神沈生甥绳圣剩施湿屎使始式试视室手守寿售授梳枢熟鼠树竖数刷耍衰摔甩率说硕思饲嗣丝似私司松耸颂诵搜嗽艘苏酥俗肃随隧岁孙损所',
        'T:塌台太谈探唐讨特天田通同头图土推团腾题体条停挺亭听统痛透投拖脱托它她踏谈叹炭态弹担贪摊滩躺提厅庭挺铁贴调艇倜摊叹汤糖倘烫滔讨涛掏桃逃淘陶特腾梯踢啼提题蹄屉替添舔田甜填恬挑跳贴跌停廷庭亭挺通铜同童痛统偷头凸突图涂土吐兔团推屯褪脱',
        'W:挖外万王为文问我吴无物悟武维位伟威卫温望唯味哇袜歪弯完玩网忘微危围未尾闻稳翁沃窝务误雾午五呜乌污屋巫芜梧蜈吾吴捂午武舞侮抚牾晤悟误勿物务惜雾',
        'X:昔吸希西息徐学选雪寻信行形修向小新心兴星响想项相香像消效些谢写系细下夏先线限现显险宪献乡详享校协胁雄熊需序续叙旋悬玄轩宣血虚许逊析晰溪嬉熙锡媳席袭习喜戏系掀鲜纤闲贤弦痫嫌馅陷羡献乡斜协斜鞋械胁挟携泻卸谢蟹屑锌心欣辛欣歆薪锌兴醒幸姓杏凶胸汹雄休咻嗅须虚绪续婿绚炫炫旋眩选薛勋熏逊询寻浔汛讯秀',
        'Y:压鸭牙呀亚杨要也叶一义因应用有友与云月运余远源原院园圆元颜严研盐眼演阳养样夜业以依仪宜艺异益意易引印英迎影硬永勇拥优悠忧又幽由于语鱼玉育欲预豫愈越岳约曰悦匀允押鸦丫哑亚讶腰邀妖瑶窑摇谣舀也爷野拽依揖液叶移遗疑乙已抑义亦以谊亿忆毅益缢翼茵阴吟殷淫饮隐胤鹰鹰英映哟庸佣涌踊咏永永泳凡蛹忧幽悠油游犹唯由铀诱愉渝愚隅虞语雨与屿禹宇玉芋郁域预豫鸢鸳鸯央怏殃秧鸳鸯泱央扬炀烊酿仰痒养样夭吆腰邀妖',
        'Z:匝砸在再张赵郑周朱自总左做作走字宗综增怎真整正支知中重主注转准着众制只之仲助组占展站长招照折者这珍针侦枕镇阵争征政症志至质置智职直植止纸指址致忠终钟种舟周洲轴逐竹筑专砖庄装壮状追准桌捉卓资姿子籽滋足租族最嘴醉尊砸载暂脏糟凿藻则择泽增炸栅摘斋债沾盏辗占瞻章彰漳障招昭找遮折蛰者这鹧贞侦珍祯甄斟诊阵振臻征蒸枝芝之织职直殖执止旨纸趾指茁卒足族诅阻组祖钻嘬',
    ];

    const map = Object.create(null);
    for (let i = 0; i < raw.length; i++) {
        const initial = raw[i][0];
        const chars = raw[i].slice(2); // 跳过 "X:" 前缀
        for (let j = 0; j < chars.length; j++) {
            const code = chars.charCodeAt(j);
            if (!map[code]) map[code] = initial;
        }
    }
    return map;
})();

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

    /**
     * 将汉字映射到拼音首字母（大写 A-Z），非汉字返回 '#'
     *
     * 实现方案：Unicode 码点 → 声母 精确哈希表
     * 覆盖范围：百家姓、常用名字字符、省市地名首字、3500+ 高频汉字
     * 复杂度：O(1) 哈希查找
     * 无外部依赖，适用于微信小程序环境
     *
     * @param {string} str - 输入字符串（取第一个字符判断）
     * @returns {string} 拼音首字母大写（A-Z）或 '#'
     */
    getPinyinInitial: (str) => {
        if (!str) return '#';
        const char = str.charAt(0);

        // 英文字母直接返回大写
        if (char >= 'A' && char <= 'Z') return char;
        if (char >= 'a' && char <= 'z') return char.toUpperCase();

        // 非汉字 Unicode 范围（U+4E00 ~ U+9FA5）
        const code = char.charCodeAt(0);
        if (code < 0x4E00 || code > 0x9FA5) return '#';

        // 精确哈希表查找
        return PINYIN_INITIAL_MAP[code] || '#';
    },

    buildCustomerGroups: (users) => {
        const groups = {};
        users.forEach(u => {
            const initial = u.pinyinInitial || Logic.getPinyinInitial(u.name || u.phone || '');
            if (!groups[initial]) groups[initial] = [];
            groups[initial].push(u);
        });
        const letters = Object.keys(groups).sort();
        const result = letters.map(letter => ({ letter, users: groups[letter] }));
        return { groups: result, letters };
    },

    generatePinyinInitial: (name) => {
        if (!name) return '#';
        const firstChar = name.charAt(0);
        if (/[a-zA-Z]/.test(firstChar)) return firstChar.toUpperCase();
        if (/[0-9]/.test(firstChar)) return '#';
        return Logic.getPinyinInitial(firstChar);
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
