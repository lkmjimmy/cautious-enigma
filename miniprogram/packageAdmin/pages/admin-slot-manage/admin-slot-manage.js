const demoClients = require('../../../utils/demoClients.js');
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

function clientLabel(c) {
  if (!c || !c.name) return '';
  return c.company ? `${c.name} · ${c.company}` : c.name;
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
    const clients = demoClients.getList() || [];
    const clientPicker = [
      { id: '', name: '未分配', label: '未分配' },
      ...clients.map((c) => ({ id: c.id, name: c.name, label: clientLabel(c) })),
    ];
    const clientMap = clients.reduce((acc, c) => {
      acc[c.id] = clientLabel(c);
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
    this.setData({ showClientSheet: false, clientSheetSlotCode: '' });
    this.load();
    wx.showToast({ title: '绑定成功', icon: 'success' });
  },

  onClientSheetClose() {
    this.setData({ showClientSheet: false, clientSheetSlotCode: '' });
  },

  onDeleteSlot(e) {
    const code = e.currentTarget.dataset.code;
    if (!code) return;
    const self = this;
    deleteGuard.confirmDeleteTwice(
      {
        title1: '删除广告位',
        content1: '将从列表中移除该广告位（演示：含巡检生成位与演示静态位）。',
        title2: '再次确认删除',
        content2: '请确认是否删除该广告位？删除后不可恢复。',
      },
      function () {
        slotOwnership.adminRemoveSlotByCode(code);
        self.load();
        wx.showToast({ title: '已删除', icon: 'success' });
      }
    );
  },
});
