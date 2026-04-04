const storeManagers = require('../../../utils/storeManagers.js');
const inspectorStores = require('../../../utils/inspectorStores.js');
const demoSlots = require('../../../utils/demoSlots.js');
const slotOwnership = require('../../../utils/slotOwnership.js');
const slotLatestPhoto = require('../../../utils/slotLatestPhoto.js');
const storeHomeSlotPhotos = require('../../../utils/storeHomeSlotPhotos.js');
const deleteGuard = require('../../../utils/deleteGuard.js');

function resolveSlotWatermark(s) {
  if (s.thumbVacant) {
    return { watermarkTime: '', watermarkAddress: '' };
  }
  const winOwner = slotLatestPhoto.isOwnerThumbWinning(s.code);
  const localRec = storeHomeSlotPhotos.getRecord(s.code);
  if (winOwner && localRec && localRec.path) {
    return { watermarkTime: localRec.time || '', watermarkAddress: localRec.address || '' };
  }
  return { watermarkTime: s.watermarkTime || '', watermarkAddress: s.watermarkAddress || '' };
}

function summarizeSlotByType(slots, allTypes) {
  const types = allTypes && allTypes.length ? allTypes : [];
  const map = {};
  types.forEach((t) => {
    map[t] = { type: t, total: 0, filled: 0, vacant: 0, pending: 0, expiring: 0, expired: 0 };
  });
  slots.forEach((s) => {
    const row = map[s.type];
    if (!row) return;
    row.total += 1;
    if (s.status === '空置') row.vacant += 1;
    else if (s.status === '待定') row.pending += 1;
    else if (s.status === '已到期') row.expired += 1;
    else if (s.status === '即将到期') row.expiring += 1;
    else if (s.status === '已投放') row.filled += 1;
  });
  return types.map((t) => map[t]);
}

Page({
  data: {
    storeNameList: [],
    storeRows: [],
    storePickerIndex: 0,
    selectedStore: '',
    currentStoreId: '',
    slotList: [],
    slotTypeSummary: [],
    slotStats: [],
    hasOwner: false,
    ownerName: '',
    ownerPhone: '',
    showStorePickerModal: false,
  },

  onShow() {
    this.refreshStorePanel(this.data.storePickerIndex);
  },

  getSlotsForStoreRow(storeRow) {
    if (!storeRow) return [];
    return slotOwnership
      .getAllSlots()
      .filter((s) => s.store === storeRow.name)
      .map((s) => {
        const wm = resolveSlotWatermark(s);
        return { ...s, ...wm };
      });
  },

  buildStoreRows() {
    return inspectorStores.getStores().map((s) => ({
      id: s.id,
      name: s.name,
      address: s.address || '',
      phone: s.phone || '',
    }));
  },

  refreshStorePanel(pickerIndex) {
    const rows = this.buildStoreRows();
    if (!rows.length) {
      this.setData({
        storeRows: [],
        storeNameList: [],
        storePickerIndex: 0,
        selectedStore: '',
        currentStoreId: '',
        slotList: [],
        slotTypeSummary: summarizeSlotByType([], demoSlots.ALL_SLOT_TYPES),
        slotStats: [
          { label: '已投放', value: 0, tone: 'success' },
          { label: '空置', value: 0, tone: 'danger' },
          { label: '待定', value: 0, tone: 'default' },
          { label: '即将到期', value: 0, tone: 'warning' },
        ],
        hasOwner: false,
        ownerName: '',
        ownerPhone: '',
      });
      return;
    }

    const i = Math.min(Math.max(0, pickerIndex), rows.length - 1);
    const row = rows[i];
    const name = row.name;
    const slots = this.getSlotsForStoreRow(row);
    const filled = slots.filter((s) => s.status === '已投放').length;
    const vacant = slots.filter((s) => s.status === '空置').length;
    const pending = slots.filter((s) => s.status === '待定').length;
    const expiring = slots.filter((s) => s.status === '即将到期').length;
    const owner = storeManagers.getOwner(name);
    const slotTypeSummary = summarizeSlotByType(slots, demoSlots.ALL_SLOT_TYPES);
    this.setData({
      storeRows: rows,
      storeNameList: rows.map((r) => r.name),
      storePickerIndex: i,
      selectedStore: name,
      currentStoreId: row.id,
      slotList: slots,
      slotTypeSummary,
      slotStats: [
        { label: '已投放', value: filled, tone: 'success' },
        { label: '空置', value: vacant, tone: 'danger' },
        { label: '待定', value: pending, tone: 'default' },
        { label: '即将到期', value: expiring, tone: 'warning' },
      ],
      hasOwner: !!owner,
      ownerName: owner ? owner.name : '',
      ownerPhone: owner ? owner.phone : '',
    });
  },

  openStorePickerModal() {
    this.setData({ showStorePickerModal: true });
  },

  closeStorePickerModal() {
    this.setData({ showStorePickerModal: false });
  },

  stopPickBubble() {},

  onSelectStoreItem(e) {
    const i = Number(e.currentTarget.dataset.index);
    if (Number.isNaN(i)) return;
    this.refreshStorePanel(i);
    this.setData({ showStorePickerModal: false });
  },

  goStoreDetailCurrent() {
    const store = this.data.selectedStore;
    if (!store) return;
    wx.navigateTo({
      url: `/packageAdmin/pages/admin-store-detail/admin-store-detail?store=${encodeURIComponent(store)}`,
    });
  },

  onDeleteCurrentStore() {
    const storeId = this.data.currentStoreId;
    const name = this.data.selectedStore;
    if (!storeId || !name) {
      wx.showToast({ title: '请先选择门店', icon: 'none' });
      return;
    }
    const block = deleteGuard.storeCannotDeleteReason(name);
    if (block) {
      wx.showModal({ title: '无法删除', content: block, showCancel: false });
      return;
    }
    const self = this;
    deleteGuard.confirmDeleteTwice(
      {
        title1: '删除门店',
        content1: '将删除该门店及其巡检广告位记录，并清退店主绑定（演示数据）。',
        title2: '再次确认删除',
        content2: '请确认是否删除该门店？删除后不可恢复。',
      },
      function () {
        const ok = inspectorStores.removeStore(storeId);
        if (!ok) {
          wx.showToast({ title: '删除失败', icon: 'none' });
          return;
        }
        wx.showToast({ title: '已删除', icon: 'success' });
        self.refreshStorePanel(0);
      }
    );
  },
});
