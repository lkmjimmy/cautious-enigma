const storeManagers = require('../../utils/storeManagers.js');
const demoSlots = require('../../utils/demoSlots.js');
const inspectorStores = require('../../utils/inspectorStores.js');
const inspectorStoreRecords = require('../../utils/inspectorStoreRecords.js');

Page({
  data: {
    storeName: '',
    hasOwner: false,
    ownerName: '',
    ownerPhone: '',
    stats: [],
    slots: [],
  },

  onLoad(options) {
    const name = options.store ? decodeURIComponent(options.store) : '';
    if (!name) {
      wx.showToast({ title: '缺少门店参数', icon: 'none' });
      return;
    }
    this.setData({ storeName: name });
    wx.setNavigationBarTitle({ title: name });
  },

  onShow() {
    const { storeName } = this.data;
    if (!storeName) return;
    this.load();
  },

  load() {
    const { storeName } = this.data;
    const owner = storeManagers.getOwner(storeName);
    const storeRow = inspectorStores.getStores().find((s) => s.name === storeName);
    const rec = storeRow ? inspectorStoreRecords.getRecord(storeRow.id) : null;
    const generated = ((rec && rec.slots) || []).filter((s) => !!s.photo);
    const slots = generated.length
      ? generated.map((s) => ({
          code: s.code,
          type: s.type,
          status: '已投放',
          expireAt: '--',
        }))
      : demoSlots.slotsForStore(storeName);
    const filled = slots.filter((s) => s.status === '已投放').length;
    const vacant = slots.filter((s) => s.status === '空置').length;
    const expiring = slots.filter((s) => s.status === '即将到期').length;
    this.setData({
      hasOwner: !!owner,
      ownerName: owner ? owner.name : '',
      ownerPhone: owner ? owner.phone : '',
      slots,
      stats: [
        { label: '已投放', value: filled, tone: 'success' },
        { label: '空置', value: vacant, tone: 'danger' },
        { label: '即将到期', value: expiring, tone: 'warning' },
      ],
    });
  },

  onRemoveOwner() {
    const { storeName, hasOwner } = this.data;
    if (!hasOwner) return;
    wx.showModal({
      title: '清退店主',
      content: `确定清退「${storeName}」的店主吗？清退后门店恢复无主，原认领关系解除，他人可重新认领；广告位等数据仍保留（演示为本地数据）。`,
      confirmText: '清退店主',
      confirmColor: '#dc2626',
      success: (res) => {
        if (!res.confirm) return;
        storeManagers.removeOwner(storeName);
        wx.showToast({ title: '已清退，门店可重新认领', icon: 'success' });
        this.load();
      },
    });
  },

  goStoreVisual() {
    wx.navigateTo({
      url: `/pages/store-slots/store-slots?store=${encodeURIComponent(this.data.storeName)}`,
    });
  },
});
