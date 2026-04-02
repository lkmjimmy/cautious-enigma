const storeManagers = require('../../utils/storeManagers.js');
const demoSlots = require('../../utils/demoSlots.js');
const inspectorStores = require('../../utils/inspectorStores.js');
const inspectorStoreRecords = require('../../utils/inspectorStoreRecords.js');
const demoClients = require('../../utils/demoClients.js');
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

function sortSlotsByOwner(a, b) {
  const aUnassigned = !a.ownerClientId;
  const bUnassigned = !b.ownerClientId;
  if (aUnassigned !== bUnassigned) return aUnassigned ? -1 : 1;
  return String(a.code).localeCompare(String(b.code), 'zh-CN');
}

Page({
  data: {
    storeName: '',
    hasOwner: false,
    ownerName: '',
    ownerPhone: '',
    stats: [],
    slots: [],
    clientPicker: [],
    clientMap: {},
    showClientSheet: false,
    clientSheetSlotCode: '',
    clientSheetSelectedIndex: 0,
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
    const rawSlots = generated.length
      ? generated.map((s) => ({
          code: s.code,
          type: s.type,
          status: '已投放',
          expireAt: '--',
          thumb: s.photo,
          watermarkTime: s.watermarkTime || '',
          watermarkAddress: s.watermarkAddress || '',
        }))
      : demoSlots.slotsForStore(storeName).map((s) => ({
          ...s,
          thumb: `https://picsum.photos/seed/${encodeURIComponent(s.code)}/220/140`,
          watermarkTime: '',
          watermarkAddress: '',
        }));

    const rawSlotsThumb = rawSlots.map((s) => {
      const thumb = slotLatestPhoto.getLatestThumbForSlot(s.code, s.thumb);
      const wm = resolveSlotWatermark({ ...s, thumb });
      return { ...s, thumb, ...wm };
    });

    const clients = demoClients.CLIENTS || [];
    const clientMap = clients.reduce((acc, c) => {
      acc[c.id] = c.name;
      return acc;
    }, {});
    const clientPicker = [{ id: '', name: '未分配' }, ...clients.map((c) => ({ id: c.id, name: c.name }))];

    const slots = rawSlotsThumb.map((s) => {
      const enriched = slotOwnership.enrichSlot(s);
      const ownerClientId = slotOwnership.getOwner(s.code);
      const ownerClientName = ownerClientId ? (clientMap[ownerClientId] || '未知客户') : '未分配';
      const ownerPickerIndex = clientPicker.findIndex((x) => x.id === ownerClientId);
      return {
        ...enriched,
        ownerClientId,
        ownerClientName,
        ownerPickerIndex: ownerPickerIndex >= 0 ? ownerPickerIndex : 0,
      };
    });

    slots.sort(sortSlotsByOwner);

    const filled = slots.filter((s) => s.status === '已投放').length;
    const vacant = slots.filter((s) => s.status === '空置').length;
    const expiring = slots.filter((s) => s.status === '即将到期').length;
    this.setData({
      hasOwner: !!owner,
      ownerName: owner ? owner.name : '',
      ownerPhone: owner ? owner.phone : '',
      clientPicker,
      clientMap,
      slots,
      stats: [
        { label: '已投放', value: filled, tone: 'success' },
        { label: '空置', value: vacant, tone: 'danger' },
        { label: '即将到期', value: expiring, tone: 'warning' },
      ],
    });
  },

  openClientSheet(e) {
    const code = e.currentTarget.dataset.code;
    const slot = (this.data.slots || []).find((s) => s.code === code);
    this.setData({
      showClientSheet: true,
      clientSheetSlotCode: code,
      clientSheetSelectedIndex: slot ? slot.ownerPickerIndex : 0,
    });
  },

  onClientSheetSelect(e) {
    const idx = e.detail.index;
    const slotCode = this.data.clientSheetSlotCode;
    const picker = this.data.clientPicker || [];
    if (!slotCode || Number.isNaN(idx) || !picker[idx]) {
      this.setData({ showClientSheet: false, clientSheetSlotCode: '' });
      return;
    }
    const selected = picker[idx];
    slotOwnership.setOwner(slotCode, selected.id);
    this.setData({ showClientSheet: false, clientSheetSlotCode: '' });
    this.load();
    wx.showToast({ title: '归属已更新', icon: 'success' });
  },

  onClientSheetClose() {
    this.setData({ showClientSheet: false, clientSheetSlotCode: '' });
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
