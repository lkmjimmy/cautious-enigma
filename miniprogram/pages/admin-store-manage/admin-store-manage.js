const storeManagers = require('../../utils/storeManagers.js');
const demoSlots = require('../../utils/demoSlots.js');
const inspectorStores = require('../../utils/inspectorStores.js');
const inspectorStoreRecords = require('../../utils/inspectorStoreRecords.js');
const slotOwnership = require('../../utils/slotOwnership.js');
const slotLatestPhoto = require('../../utils/slotLatestPhoto.js');
const storeHomeSlotPhotos = require('../../utils/storeHomeSlotPhotos.js');

function resolveSlotWatermark(s) {
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
    map[t] = { type: t, total: 0, filled: 0, vacant: 0, expiring: 0, expired: 0 };
  });
  slots.forEach((s) => {
    const row = map[s.type];
    if (!row) return;
    row.total += 1;
    if (s.status === '空置') row.vacant += 1;
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

    const rec = inspectorStoreRecords.getRecord(storeRow.id);
    const generated = ((rec && rec.slots) || []).filter((s) => !!s.photo);
    if (generated.length) {
      return generated.map((s) => {
        const enriched = slotOwnership.enrichSlot({
          code: s.code,
          type: s.type,
          status: '已投放',
          expireAt: '--',
        });
        const fb = s.photo || `https://picsum.photos/seed/${encodeURIComponent(s.code)}/220/140`;
        const thumb = slotLatestPhoto.getLatestThumbForSlot(s.code, fb);
        const wm = resolveSlotWatermark({
          ...enriched,
          thumb,
          watermarkTime: s.watermarkTime || '',
          watermarkAddress: s.watermarkAddress || '',
        });
        return {
          ...enriched,
          thumb,
          ...wm,
        };
      });
    }

    return demoSlots.slotsForStore(storeRow.name).map((s) => {
      const enriched = slotOwnership.enrichSlot(s);
      const fb = `https://picsum.photos/seed/${encodeURIComponent(s.code)}/220/140`;
      const thumb = slotLatestPhoto.getLatestThumbForSlot(s.code, fb);
      const wm = resolveSlotWatermark({ ...enriched, thumb, watermarkTime: '', watermarkAddress: '' });
      return {
        ...enriched,
        thumb,
        ...wm,
      };
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
        slotList: [],
        slotTypeSummary: summarizeSlotByType([], demoSlots.ALL_SLOT_TYPES),
        slotStats: [
          { label: '已投放', value: 0, tone: 'success' },
          { label: '空置', value: 0, tone: 'danger' },
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
    const expiring = slots.filter((s) => s.status === '即将到期').length;
    const owner = storeManagers.getOwner(name);
    const slotTypeSummary = summarizeSlotByType(slots, demoSlots.ALL_SLOT_TYPES);
    this.setData({
      storeRows: rows,
      storeNameList: rows.map((r) => r.name),
      storePickerIndex: i,
      selectedStore: name,
      slotList: slots,
      slotTypeSummary,
      slotStats: [
        { label: '已投放', value: filled, tone: 'success' },
        { label: '空置', value: vacant, tone: 'danger' },
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
      url: `/pages/admin-store-detail/admin-store-detail?store=${encodeURIComponent(store)}`,
    });
  },
});
