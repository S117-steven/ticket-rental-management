import { DEFAULT_PRICE_MATRIX, Logic } from './utils/util';

App({
  globalData: {
    users: [],
    orders: [],
    config: null,
    stats: null
  },

  onLaunch() {
    this.initData();
  },

  initData() {
    let users = wx.getStorageSync('tm_users') || [];
    let orders = wx.getStorageSync('tm_orders') || [];
    let config = wx.getStorageSync('tm_config');

    if (!config) {
      config = {
        isInitialized: false,
        language: 'zh',
        version: 2,
        activeTicketId: '',
        tickets: [],
        swishNumber: ''
      };
    } else if (!config.version || config.version < 2) {
      config = this.migrateV1ToV2(config, orders);
      orders = wx.getStorageSync('tm_orders');
    }

    let needSaveUsers = false;
    users = users.map(u => {
      if (!u.pinyinInitial) {
        needSaveUsers = true;
        return { ...u, pinyinInitial: Logic.generatePinyinInitial(u.name) };
      }
      return u;
    });
    if (needSaveUsers) {
      wx.setStorageSync('tm_users', users);
    }

    this.globalData.users = users;
    this.globalData.orders = orders;
    this.globalData.config = config;
  },

  migrateV1ToV2(oldConfig, orders) {
    const ticketId = Logic.uuid();
    const migratedOrders = orders.map(o => ({
      ...o,
      ticketId: o.ticketId || ticketId
    }));
    wx.setStorageSync('tm_orders', migratedOrders);

    const newConfig = {
      isInitialized: oldConfig.isInitialized,
      language: oldConfig.language || 'zh',
      version: 2,
      activeTicketId: ticketId,
      tickets: [{
        id: ticketId,
        type: 'monthly',
        label: '月票 #1',
        cycleStartDate: oldConfig.cycleStartDate,
        priceMatrix: oldConfig.priceMatrix || DEFAULT_PRICE_MATRIX,
        initialUsageOffset: oldConfig.initialUsageOffset || { sends: 0, users: 0, cycleId: 0 }
      }],
      swishNumber: oldConfig.swishNumber || ''
    };
    wx.setStorageSync('tm_config', newConfig);
    return newConfig;
  },

  updateConfig(newConfig) {
    this.globalData.config = newConfig;
    wx.setStorageSync('tm_config', newConfig);
  },

  saveUser(user) {
    const users = this.globalData.users;
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = { ...users[idx], ...user }; else users.push(user);
    this.globalData.users = users;
    wx.setStorageSync('tm_users', users);
  },

  saveOrder(order) {
    const orders = this.globalData.orders;
    const idx = orders.findIndex(o => o.id === order.id);
    if (idx >= 0) orders[idx] = order; else orders.push(order);
    this.globalData.orders = orders;
    wx.setStorageSync('tm_orders', orders);
  }
})
