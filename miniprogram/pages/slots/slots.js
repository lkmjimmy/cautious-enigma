const demoSlots = require('../../utils/demoSlots.js');

Page({
  data: {
    tabs: ['全部', '已投放', '空置', '即将到期'],
    activeTab: '全部',
    slots: [],
    visibleSlots: [],
    groupedSlots: [],
  },

  onLoad(options) {
    const slots = (demoSlots.RAW_SLOTS || []).map((s) => ({
      code: s.code,
      store: s.store,
      type: s.type,
      status: s.status,
      expireAt: s.expireAt,
    }));
    const status = decodeURIComponent((options && options.status) || '全部');
    const activeTab = this.data.tabs.includes(status) ? status : '全部';
    this.setData({ slots, activeTab }, () => {
      this.updateVisibleSlots(activeTab);
    });
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
