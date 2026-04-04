const slotOwnership = require('../../../utils/slotOwnership.js');

const TABS = ['全部', '已投放', '待定', '空置', '即将到期'];

Page({
  data: {
    tabs: TABS,
    activeTab: '全部',
    slots: [],
    visibleSlots: [],
    groupedSlots: [],
  },

  onLoad(options) {
    const status = decodeURIComponent((options && options.status) || '全部');
    const activeTab = TABS.includes(status) ? status : '全部';
    this.setData({ activeTab });
  },

  onShow() {
    const slots = slotOwnership.getAllSlots();
    this.setData({ slots }, () => {
      this.updateVisibleSlots(this.data.activeTab);
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
      url: `/packageStore/pages/store-slots/store-slots?store=${encodeURIComponent(store)}`,
    });
  },
});
