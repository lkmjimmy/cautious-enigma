const adminPersonnel = require('../../utils/adminPersonnel.js');

Page({
  data: {
    roleOptions: adminPersonnel.ROLE_OPTIONS,
    personnel: [],
    showRoleSheet: false,
    roleSheetPersonId: '',
    roleSheetSelectedIndex: 0,
  },

  onShow() {
    this.setData({ personnel: adminPersonnel.getList() });
  },

  openRoleSheet(e) {
    const id = e.currentTarget.dataset.id;
    const row = (this.data.personnel || []).find((p) => p.id === id);
    this.setData({
      showRoleSheet: true,
      roleSheetPersonId: id,
      roleSheetSelectedIndex: row ? row.roleIndex : 0,
    });
  },

  onRoleSheetSelect(e) {
    const idx = e.detail.index;
    const id = this.data.roleSheetPersonId;
    if (!id || Number.isNaN(idx)) {
      this.setData({ showRoleSheet: false, roleSheetPersonId: '' });
      return;
    }
    const personnel = adminPersonnel.updateRole(id, idx);
    this.setData({ personnel, showRoleSheet: false, roleSheetPersonId: '' });
    wx.showToast({ title: '已保存', icon: 'success' });
  },

  onRoleSheetClose() {
    this.setData({ showRoleSheet: false, roleSheetPersonId: '' });
  },
});
