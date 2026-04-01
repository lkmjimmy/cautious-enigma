Page({
  data: {
    stats: [
      { label: '总广告位', value: 286, tone: 'default', filter: '全部' },
      { label: '已投放', value: 214, tone: 'success', filter: '已投放' },
      { label: '空置中', value: 72, tone: 'danger', filter: '空置' },
      { label: '7天内到期', value: 19, tone: 'warning', filter: '即将到期' },
    ],
    stores: [
      {
        name: '福田中心店',
        types: [
          { type: '灯箱', filled: 5, vacant: 1, expiring: 1 },
          { type: '地贴', filled: 3, vacant: 1, expiring: 0 },
          { type: '货架', filled: 4, vacant: 1, expiring: 1 },
          { type: '出库仪', filled: 2, vacant: 0, expiring: 0 },
          { type: 'LED', filled: 2, vacant: 1, expiring: 0 },
          { type: '门头', filled: 2, vacant: 0, expiring: 0 },
        ],
      },
      {
        name: '南山科技园店',
        types: [
          { type: '灯箱', filled: 6, vacant: 0, expiring: 1 },
          { type: '地贴', filled: 4, vacant: 0, expiring: 1 },
          { type: '货架', filled: 5, vacant: 0, expiring: 1 },
          { type: '出库仪', filled: 2, vacant: 1, expiring: 0 },
          { type: 'LED', filled: 3, vacant: 0, expiring: 1 },
          { type: '门头', filled: 2, vacant: 0, expiring: 0 },
        ],
      },
      {
        name: '宝安壹方城店',
        types: [
          { type: '灯箱', filled: 4, vacant: 2, expiring: 1 },
          { type: '地贴', filled: 2, vacant: 2, expiring: 0 },
          { type: '货架', filled: 4, vacant: 1, expiring: 1 },
          { type: '出库仪', filled: 1, vacant: 1, expiring: 1 },
          { type: 'LED', filled: 2, vacant: 1, expiring: 0 },
          { type: '门头', filled: 3, vacant: 1, expiring: 0 },
        ],
      },
    ],
    typeStats: [
      { type: '灯箱', filled: 62, vacant: 14, expiring: 6 },
      { type: '地贴', filled: 38, vacant: 18, expiring: 3 },
      { type: '货架', filled: 54, vacant: 11, expiring: 4 },
      { type: '出库仪', filled: 27, vacant: 9, expiring: 2 },
      { type: 'LED', filled: 18, vacant: 9, expiring: 2 },
      { type: '门头', filled: 15, vacant: 11, expiring: 2 },
    ],
    urgentSlots: [
      { code: 'SZ-FT-01-A3', store: '福田中心店', status: '空置', expireAt: '--' },
      { code: 'SZ-NS-03-B2', store: '南山科技园店', status: '即将到期', expireAt: '2026-04-07' },
      { code: 'SZ-BA-02-C1', store: '宝安壹方城店', status: '即将到期', expireAt: '2026-04-05' },
    ],
  },

  goSlots() {
    wx.navigateTo({
      url: '/pages/slots/slots',
    });
  },

  goFilteredSlots(e) {
    const filter = e.currentTarget.dataset.filter || '全部';
    wx.navigateTo({
      url: `/pages/slots/slots?status=${encodeURIComponent(filter)}`,
    });
  },
});
