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

function sortSlots(items) {
  return (items || []).slice().sort((a, b) => {
    const aUnassigned = !a.ownerClientId;
    const bUnassigned = !b.ownerClientId;
    if (aUnassigned !== bUnassigned) return aUnassigned ? -1 : 1;
    return String(a.code).localeCompare(String(b.code), 'zh-CN');
  });
}

Page({
  data: {
    slots: [],
    clientPicker: [],
    keyword: '',
    showClientSheet: false,
    clientSheetSlotCode: '',
    clientSheetSelectedIndex: 0,
  },

  onShow() {
    this.load();
  },

  load() {
    const clients = demoClients.CLIENTS || [];
    const clientPicker = [{ id: '', name: '未分配' }, ...clients.map((c) => ({ id: c.id, name: c.name }))];
    const clientMap = clients.reduce((acc, c) => {
      acc[c.id] = c.name;
      return acc;
    }, {});
    const slots = slotOwnership.getAllSlots().map((s) => {
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
    this.setData({
      clientPicker,
      slots: sortSlots(slots),
    });
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value || '' });
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
    const slots = (this.data.slots || []).map((s) => (s.code === slotCode
      ? {
          ...s,
          ownerClientId: selected.id,
          ownerClientName: selected.name,
          ownerPickerIndex: idx,
        }
      : s));
    this.setData({ slots: sortSlots(slots), showClientSheet: false, clientSheetSlotCode: '' });
    wx.showToast({ title: '绑定成功', icon: 'success' });
  },

  onClientSheetClose() {
    this.setData({ showClientSheet: false, clientSheetSlotCode: '' });
  },
});
