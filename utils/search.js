export const SearchUtils = {
    /**
     * 搜索订单
     * @param {Array} orders - 订单列表
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

        // 状态筛选
        if (filters.status) {
            result = result.filter(order => order.status === filters.status);
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
    },

    /**
     * 获取订单状态列表
     */
    getStatusList() {
        return [
            { value: '', label: '全部' },
            { value: 'Pending', label: '待开始' },
            { value: 'Active', label: '进行中' },
            { value: 'Completed', label: '已完成' },
            { value: 'Cancelled', label: '已取消' }
        ];
    }
};
