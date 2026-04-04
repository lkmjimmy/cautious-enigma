const storeManagers = require('../../../utils/storeManagers.js');
const demoClients = require('../../../utils/demoClients.js');
const slotOwnership = require('../../../utils/slotOwnership.js');
const slotLatestPhoto = require('../../../utils/slotLatestPhoto.js');
const storeHomeSlotPhotos = require('../../../utils/storeHomeSlotPhotos.js');

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

function clientLabel(c) {
  if (!c || !c.name) return '';
  return c.company ? `${c.name} · ${c.company}` : c.name;
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
    const enrichedList = slotOwnership.getAllSlots().filter((s) => s.store === storeName);

    const clients = demoClients.getList() || [];
    const clientMap = clients.reduce((acc, c) => {
      acc[c.id] = clientLabel(c);
      return acc;
    }, {});
    const clientPicker = [
      { id: '', name: '未分配', label: '未分配' },
      ...clients.map((c) => ({ id: c.id, name: c.name, label: clientLabel(c) })),
    ];

    const slots = enrichedList.map((s) => {
      const ownerClientId = slotOwnership.getOwner(s.code);
      const ownerClientName = ownerClientId ? (clientMap[ownerClientId] || '未知客户') : '未分配';
      const ownerPickerIndex = clientPicker.findIndex((x) => x.id === ownerClientId);
      const wm = resolveSlotWatermark(s);
      return {
        ...s,
        ...wm,
        ownerClientId,
        ownerClientName,
        ownerPickerIndex: ownerPickerIndex >= 0 ? ownerPickerIndex : 0,
      };
    });

    slots.sort(sortSlotsByOwner);

    const filled = slots.filter((s) => s.status === '已投放').length;
    const vacant = slots.filter((s) => s.status === '空置').length;
    const pending = slots.filter((s) => s.status === '待定').length;
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
        { label: '待定', value: pending, tone: 'default' },
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
      url: `/packageStore/pages/store-slots/store-slots?store=${encodeURIComponent(this.data.storeName)}`,
    });
  },
});
