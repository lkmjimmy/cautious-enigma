const storeRevenueCalc = require('../../utils/storeRevenueCalc.js');
const storeRevenueHistory = require('../../utils/storeRevenueHistory.js');
const demoRevenue = require('../../../utils/demoRevenue.js');

Page({
  data: {
    storeName: '',
    monthLabel: '',
    monthTotalText: '',
    historyTotalText: '',
    rows: [],
  },

  onLoad(options) {
    const name = options.store ? decodeURIComponent(options.store) : '';
    if (!name) {
      wx.showToast({ title: '缺少门店参数', icon: 'none' });
      return;
    }
    this.setData({ storeName: name });
    wx.setNavigationBarTitle({ title: `${name} · 预估收益` });
    this.refresh(name);
  },

  onShow() {
    const name = this.data.storeName;
    if (name) this.refresh(name);
  },

  refresh(storeName) {
    const monthKey = storeRevenueHistory.currentMonthKey();
    const computed = storeRevenueCalc.computeForStore(storeName);
    storeRevenueHistory.saveMonthEstimate(storeName, monthKey, computed.monthTotal);
    const historySum = storeRevenueHistory.historySumBeforeCurrentMonth(storeName, monthKey);
    this.setData({
      monthLabel: demoRevenue.monthLabel(),
      monthTotalText: computed.monthTotalText,
      historyTotalText: demoRevenue.formatYuan(historySum),
      rows: computed.rows,
    });
  },
});
