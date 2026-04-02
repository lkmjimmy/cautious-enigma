const adminPersonnel = require('../../utils/adminPersonnel.js');

Page({
  data: {
    roleOptions: adminPersonnel.ROLE_OPTIONS,
    personnel: [],
  },

  onShow() {
    this.setData({ personnel: adminPersonnel.getList() });
  },

  onRoleChange(e) {
    const id = e.currentTarget.dataset.id;
    const idx = Number(e.detail.value);
    if (!id || Number.isNaN(idx)) return;
    const personnel = adminPersonnel.updateRole(id, idx);
    this.setData({ personnel });
    wx.showToast({ title: '已保存', icon: 'success' });
  },
});
