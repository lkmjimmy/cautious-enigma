const demoRevenue = require('../../utils/demoRevenue.js');

Page({
  data: {
    storeName: '',
    monthLabel: '',
    totalText: '',
    rows: [],
  },

  onLoad(options) {
    const name = options.store ? decodeURIComponent(options.store) : '';
    if (!name) {
      wx.showToast({ title: '缺少门店参数', icon: 'none' });
      return;
    }
    const monthLabel = demoRevenue.monthLabel();
    const rows = demoRevenue.rowsForStore(name);
    const total = demoRevenue.totalForStore(name);
    this.setData({
      storeName: name,
      monthLabel,
      rows,
      totalText: demoRevenue.formatYuan(total),
    });
    wx.setNavigationBarTitle({ title: `${name} · 预估收益` });
  },
});
