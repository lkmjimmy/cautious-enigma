const adminPersonnel = require('../../utils/adminPersonnel.js');
const deleteGuard = require('../../utils/deleteGuard.js');

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

  onDeletePerson(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    const self = this;
    deleteGuard.confirmDeleteTwice(
      {
        title1: '删除人员',
        content1: '将从列表中移除该人员（演示数据）。',
        title2: '再次确认删除',
        content2: '请确认是否删除该人员？',
      },
      function () {
        const personnel = adminPersonnel.removeById(id);
        self.setData({ personnel: personnel });
        wx.showToast({ title: '已删除', icon: 'success' });
      }
    );
  },
});
