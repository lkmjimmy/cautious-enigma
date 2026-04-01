Page({
  data: {
    tabs: ['全部', '已投放', '空置', '即将到期'],
    activeTab: '全部',
    slots: [
      { code: 'SZ-FT-LX-01', store: '福田中心店', type: '灯箱', status: '空置', expireAt: '--' },
      { code: 'SZ-FT-LX-02', store: '福田中心店', type: '灯箱', status: '已投放', expireAt: '2026-05-20' },
      { code: 'SZ-FT-DT-01', store: '福田中心店', type: '地贴', status: '空置', expireAt: '--' },
      { code: 'SZ-FT-HJ-01', store: '福田中心店', type: '货架', status: '即将到期', expireAt: '2026-04-06' },
      { code: 'SZ-NS-LED-01', store: '南山科技园店', type: 'LED', status: '即将到期', expireAt: '2026-04-07' },
      { code: 'SZ-NS-MT-01', store: '南山科技园店', type: '门头', status: '已投放', expireAt: '2026-05-18' },
      { code: 'SZ-NS-CKY-01', store: '南山科技园店', type: '出库仪', status: '空置', expireAt: '--' },
      { code: 'SZ-BA-HJ-01', store: '宝安壹方城店', type: '货架', status: '即将到期', expireAt: '2026-04-05' },
      { code: 'SZ-BA-DT-01', store: '宝安壹方城店', type: '地贴', status: '空置', expireAt: '--' },
      { code: 'SZ-BA-MT-01', store: '宝安壹方城店', type: '门头', status: '已投放', expireAt: '2026-05-11' },
    ],
    visibleSlots: [],
    groupedSlots: [],
  },

  onLoad(options) {
    const status = decodeURIComponent((options && options.status) || '全部');
    const activeTab = this.data.tabs.includes(status) ? status : '全部';
    this.setData({ activeTab });
    this.updateVisibleSlots(activeTab);
  },

  onTabTap(e) {
    const activeTab = e.currentTarget.dataset.tab;
    this.setData({ activeTab });
    this.updateVisibleSlots(activeTab);
  },

  updateVisibleSlots(tab) {
    const visibleSlots = tab === '全部'
      ? this.data.slots
      : this.data.slots.filter((slot) => slot.status === tab);
    this.setData({
      visibleSlots,
      groupedSlots: this.groupSlotsByStoreAndType(visibleSlots),
    });
  },

  groupSlotsByStoreAndType(slots) {
    const byStore = {};
    slots.forEach((slot) => {
      if (!byStore[slot.store]) byStore[slot.store] = {};
      if (!byStore[slot.store][slot.type]) byStore[slot.store][slot.type] = [];
      byStore[slot.store][slot.type].push(slot);
    });
    return Object.keys(byStore).map((store) => ({
      store,
      types: Object.keys(byStore[store]).map((type) => ({
        type,
        count: byStore[store][type].length,
        codes: byStore[store][type].map((item) => item.code).join('、'),
      })),
    }));
  },

  goStore(e) {
    const store = e.currentTarget.dataset.store;
    wx.navigateTo({
      url: `/pages/store-slots/store-slots?store=${encodeURIComponent(store)}`,
    });
  },
});
