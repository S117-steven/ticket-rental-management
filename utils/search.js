export const SearchUtils = {
    /**
     * 搜索订单
     * @param {Array} orders - 订单列表（需要包含 displayStatus 字段）
     * @param {string} query - 搜索关键词
     * @param {Object} filters - 筛选条件
     * @returns {Array} 过滤后的订单
     */
    searchOrders(orders, query = '', filters = {}) {
        let result = [...orders];

        // 关键词搜索
        if (query.trim()) {
            const normalizedQuery = query.trim().toLowerCase();
            result = result.filter(order => {
                const name = (order.userParams?.name || '').toLowerCase();
                const phone = (order.userParams?.phone || '').toLowerCase();
                return name.includes(normalizedQuery) || phone.includes(normalizedQuery);
            });
        }

        // 状态筛选（使用 displayStatus 而非 order.status）
        if (filters.status) {
            result = result.filter(order => order.displayStatus === filters.status);
        }

        // 日期范围筛选
        if (filters.startDate) {
            const startTime = new Date(filters.startDate).getTime();
            result = result.filter(order => order.startTime >= startTime);
        }
        if (filters.endDate) {
            const endTime = new Date(filters.endDate).getTime() + 24 * 60 * 60 * 1000;
            result = result.filter(order => order.startTime < endTime);
        }

        return result;
    }
};
