const slotPriceBook = require('../../../utils/slotPriceBook.js');

Page({
  data: {
    rows: [],
    saveBtnText: '保存',
  },

  onShow() {
    const rows = slotPriceBook.getRowsForView();
    const hasAnyPrice = (rows || []).some((r) => (r.makeCost || '').trim() !== '');
    this.setData({
      rows,
      saveBtnText: hasAnyPrice ? '修改价格' : '保存',
    });
  },

  onPriceInput(e) {
    const type = e.currentTarget.dataset.type;
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    const rows = (this.data.rows || []).map((r) =>
      r.type === type ? { ...r, [field]: value } : r
    );
    this.setData({ rows });
  },

  onSave() {
    const map = {};
    (this.data.rows || []).forEach((r) => {
      map[r.type] = {
        makeCost: (r.makeCost || '').trim(),
      };
    });
    slotPriceBook.setAll(map);
    this.setData({ saveBtnText: '修改价格' });
    wx.showToast({ title: '已保存', icon: 'success' });
  },
});
