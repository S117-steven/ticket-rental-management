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
    const orders = wx.getStorageSync('tm_orders') || [];
    const config = wx.getStorageSync('tm_config') || {
      isInitialized: false,
      language: 'zh',
      cycleStartDate: new Date().setHours(0, 0, 0, 0),
      priceMatrix: DEFAULT_PRICE_MATRIX,
      initialUsageOffset: { sends: 0, users: 0, cycleId: 0 },
      swishNumber: ''
    };

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
