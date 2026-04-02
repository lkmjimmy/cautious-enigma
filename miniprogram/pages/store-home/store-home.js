const claim = require('../../utils/claim.js');
const demoSlots = require('../../utils/demoSlots.js');

Page({
  data: {
    storeName: '',
    approvedStores: [],
    storeIndex: 0,
    stats: [],
    slots: [],
  },

  onLoad(options) {
    if (options.store) {
      claim.setCurrentStoreView(decodeURIComponent(options.store));
    }
  },

  onShow() {
    claim.ensureUserId();
    if (!claim.hasAnyApprovedStore()) {
      wx.redirectTo({ url: '/pages/store-claim/store-claim' });
      return;
    }
    const approved = claim.getMyApprovedStores(claim.ensureUserId());
    let name = claim.getCurrentStoreView();
    if (!approved.includes(name)) {
      name = approved[0];
    }
    const storeIndex = Math.max(0, approved.indexOf(name));
    this.setData({ approvedStores: approved, storeIndex });
    this.loadStore(name);
  },

  loadStore(name) {
    claim.setCurrentStoreView(name);
    const slots = demoSlots.slotsForStore(name);
    const filled = slots.filter((s) => s.status === '已投放').length;
    const vacant = slots.filter((s) => s.status === '空置').length;
    const expiring = slots.filter((s) => s.status === '即将到期').length;
    this.setData({
      storeName: name,
      slots,
      stats: [
        { label: '已投放', value: filled, tone: 'success' },
        { label: '空置', value: vacant, tone: 'danger' },
        { label: '即将到期', value: expiring, tone: 'warning' },
      ],
    });
  },

  onStorePick(e) {
    const i = Number(e.detail.value);
    const name = this.data.approvedStores[i];
    if (name) {
      this.setData({ storeIndex: i });
      this.loadStore(name);
    }
  },

  goStoreVisual() {
    wx.navigateTo({
      url: `/pages/store-slots/store-slots?store=${encodeURIComponent(this.data.storeName)}`,
    });
  },

  goClaimMore() {
    wx.navigateTo({
      url: '/pages/store-claim/store-claim',
    });
  },

  goRevenue() {
    wx.navigateTo({
      url: `/pages/store-revenue/store-revenue?store=${encodeURIComponent(this.data.storeName)}`,
    });
  },
});
