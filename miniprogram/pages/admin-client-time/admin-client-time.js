const demoClients = require('../../utils/demoClients.js');
const demoSlots = require('../../utils/demoSlots.js');
const clientPlacementSchedule = require('../../utils/clientPlacementSchedule.js');

function todayStr() {
  const t = new Date();
  const p = (n) => (n < 10 ? `0${n}` : `${n}`);
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
}

Page({
  data: {
    clientId: '',
    clientName: '',
    typeRows: [],
    defaultDate: todayStr(),
  },

  onLoad(options) {
    const id = options.clientId || '';
    const client = demoClients.getById(id);
    if (!client) {
      wx.showToast({ title: '客户不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 400);
      return;
    }
    this.setData({ clientId: id, clientName: client.name });
    this.buildRows();
  },

  buildRows() {
    const schedule = clientPlacementSchedule.getForClient(this.data.clientId);
    const typeRows = demoSlots.ALL_SLOT_TYPES.map((type) => ({
      type,
      dateValue: schedule[type] || '',
    }));
    this.setData({ typeRows, defaultDate: todayStr() });
  },

  onDateChange(e) {
    const idx = Number(e.currentTarget.dataset.index);
    if (Number.isNaN(idx)) return;
    const v = e.detail.value;
    const typeRows = (this.data.typeRows || []).map((row, i) =>
      i === idx ? { ...row, dateValue: v } : row
    );
    this.setData({ typeRows });
  },

  onClearType(e) {
    const idx = Number(e.currentTarget.dataset.index);
    if (Number.isNaN(idx)) return;
    const typeRows = (this.data.typeRows || []).map((row, i) =>
      i === idx ? { ...row, dateValue: '' } : row
    );
    this.setData({ typeRows });
  },

  saveAll() {
    const clientId = this.data.clientId;
    const rows = this.data.typeRows || [];
    const map = {};
    rows.forEach((r) => {
      if (r.dateValue) map[r.type] = r.dateValue;
    });
    clientPlacementSchedule.setForClient(clientId, map);
    wx.showToast({ title: '已同步到该客户广告位', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 500);
  },
});
