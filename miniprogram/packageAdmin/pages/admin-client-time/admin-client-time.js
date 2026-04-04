const demoClients = require('../../../utils/demoClients.js');
const demoSlots = require('../../../utils/demoSlots.js');
const clientPlacementSchedule = require('../../../utils/clientPlacementSchedule.js');

function todayStr() {
  const t = new Date();
  const p = (n) => (n < 10 ? `0${n}` : `${n}`);
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
}

function parseNonNegInt(str) {
  const n = parseInt(String(str || '').trim(), 10);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

function computeExpirePreview(row) {
  const placementStr = String(row.placementDays || '').trim();
  if (!placementStr) {
    return row.legacyExpire || '';
  }
  const p = parseNonNegInt(placementStr);
  if (p === null) return '';
  const bRaw = String(row.bonusDays || '').trim();
  const b = bRaw === '' ? 0 : parseNonNegInt(bRaw);
  const bonus = b === null ? 0 : b;
  let anchor = row.anchorDate || '';
  if (!anchor) anchor = todayStr();
  return clientPlacementSchedule.addDaysFromYmd(anchor, p + bonus);
}

function normalizeRowFromSchedule(type, raw) {
  if (typeof raw === 'string' && raw) {
    return {
      type,
      placementDays: '',
      bonusDays: '',
      anchorDate: '',
      legacyExpire: raw,
    };
  }
  if (raw && typeof raw === 'object') {
    return {
      type,
      placementDays: raw.placementDays != null ? String(raw.placementDays) : '',
      bonusDays: raw.bonusDays != null ? String(raw.bonusDays) : '',
      anchorDate: raw.anchorDate || '',
      legacyExpire: '',
    };
  }
  return {
    type,
    placementDays: '',
    bonusDays: '',
    anchorDate: '',
    legacyExpire: '',
  };
}

Page({
  data: {
    clientId: '',
    clientName: '',
    typeRows: [],
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
    const typeRows = demoSlots.ALL_SLOT_TYPES.map((type) => {
      const row = normalizeRowFromSchedule(type, schedule[type]);
      return { ...row, expirePreview: computeExpirePreview(row) };
    });
    this.setData({ typeRows });
  },

  onDaysInput(e) {
    const idx = Number(e.currentTarget.dataset.index);
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    if (Number.isNaN(idx)) return;
    const typeRows = (this.data.typeRows || []).map((row, i) => {
      if (i !== idx) return row;
      let next = { ...row, [field]: value };
      const placementStr = String(field === 'placementDays' ? value : next.placementDays || '').trim();
      if (field === 'placementDays' && !placementStr) {
        next = {
          ...next,
          anchorDate: '',
          legacyExpire: '',
        };
      } else if (placementStr && !next.anchorDate) {
        next = { ...next, anchorDate: todayStr() };
      }
      return { ...next, expirePreview: computeExpirePreview(next) };
    });
    this.setData({ typeRows });
  },

  onClearType(e) {
    const idx = Number(e.currentTarget.dataset.index);
    if (Number.isNaN(idx)) return;
    const typeRows = (this.data.typeRows || []).map((row, i) => {
      if (i !== idx) return row;
      const cleared = {
        type: row.type,
        placementDays: '',
        bonusDays: '',
        anchorDate: '',
        legacyExpire: '',
      };
      return { ...cleared, expirePreview: '' };
    });
    this.setData({ typeRows });
  },

  saveAll() {
    const clientId = this.data.clientId;
    const rows = this.data.typeRows || [];
    const map = {};
    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i];
      const placementStr = String(r.placementDays || '').trim();
      if (!placementStr) {
        if (r.legacyExpire) {
          map[r.type] = r.legacyExpire;
        }
        continue;
      }
      const p = parseNonNegInt(placementStr);
      if (p === null) {
        wx.showToast({ title: `「${r.type}」投放天数须为非负整数`, icon: 'none' });
        return;
      }
      const bRaw = String(r.bonusDays || '').trim();
      const bParsed = bRaw === '' ? 0 : parseNonNegInt(bRaw);
      if (bParsed === null) {
        wx.showToast({ title: `「${r.type}」赠送天数须为非负整数`, icon: 'none' });
        return;
      }
      const bonus = bParsed;
      let anchor = r.anchorDate || todayStr();
      const expireAt = clientPlacementSchedule.addDaysFromYmd(anchor, p + bonus);
      if (!expireAt) {
        wx.showToast({ title: '日期计算失败，请重试', icon: 'none' });
        return;
      }
      map[r.type] = {
        expireAt,
        placementDays: String(p),
        bonusDays: String(bonus),
        anchorDate: anchor,
      };
    }
    clientPlacementSchedule.setForClient(clientId, map);
    wx.showToast({ title: '已同步到该客户广告位', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 500);
  },
});
