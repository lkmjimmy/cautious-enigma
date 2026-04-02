const inspectorStores = require('../../utils/inspectorStores.js');
const inspectorStoreRecords = require('../../utils/inspectorStoreRecords.js');
const demoSlots = require('../../utils/demoSlots.js');

Page({
  data: {
    storeId: '',
    storeName: '',
    address: '',
    phone: '',

    typePlans: [],
  },

  onLoad(options) {
    const storeId = options.storeId ? String(options.storeId) : '';
    const stores = inspectorStores.getStores();
    const store = stores.find((s) => s.id === storeId) || null;

    const typeInventory = (store && store.typeInventory) || {};

    const typePlans = (demoSlots.ALL_SLOT_TYPES || []).map((type) => {
      const actualMax = Math.max(0, Number(typeInventory[type] || 0));
      const countOptions = actualMax > 0 ? ['无', ...Array.from({ length: actualMax }, (_, i) => String(i + 1))] : ['无'];
      return {
        type,
        actualMax,
        pickerIndex: 0, // 0=无
        countOptions,
      };
    });

    this.setData({
      storeId,
      storeName: store ? store.name : '',
      address: store ? store.address : '',
      phone: store ? store.phone : '',
      typePlans,
    });
  },

  onCountChange(e) {
    const type = e.currentTarget.dataset.type;
    const idx = Number(e.detail.value);
    if (!type || Number.isNaN(idx)) return;
    const typePlans = this.data.typePlans.map((p) => (p.type === type ? { ...p, pickerIndex: idx } : p));
    this.setData({ typePlans });
  },

  onCancel() {
    wx.navigateBack({ delta: 1 });
  },

  onConfirm() {
    if (!this.data.storeId) return;

    const typeCounts = {};
    let total = 0;
    const typeOrder = this.data.typePlans.map((p) => p.type);
    this.data.typePlans.forEach((p) => {
      const idx = Number(p.pickerIndex || 0);
      // pickerIndex: 0=无；1..N 对应“拍 idx 张”
      const selectedCount = idx === 0 ? 0 : idx;
      if (selectedCount > p.actualMax) {
        wx.showToast({ title: '选择超过实际广告位数量，请调整', icon: 'none' });
        return;
      }
      typeCounts[p.type] = selectedCount;
      total += selectedCount;
    });

    if (total <= 0) {
      wx.showToast({ title: '至少选择一种广告位（不能全部为“无”）', icon: 'none' });
      return;
    }

    inspectorStoreRecords.initSlotsForStore(this.data.storeId, typeCounts, typeOrder);
    wx.showToast({ title: '已生成待拍广告位', icon: 'success' });

    wx.redirectTo({ url: '/pages/inspector/inspector' });
  },
});

