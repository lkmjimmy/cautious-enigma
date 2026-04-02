Page({
  goPersonnel() {
    wx.navigateTo({ url: '/pages/admin-personnel/admin-personnel' });
  },

  goSlotManage() {
    wx.navigateTo({ url: '/pages/admin-slot-manage/admin-slot-manage' });
  },

  goClients() {
    wx.navigateTo({ url: '/pages/admin-clients/admin-clients' });
  },

  goStoreDetailCurrent() {
    wx.navigateTo({ url: '/pages/admin-store-manage/admin-store-manage' });
  },
});
