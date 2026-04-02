Page({
  onShow() {
    if (!wx.getStorageSync('loggedIn')) {
      wx.reLaunch({ url: '/pages/login/login' });
    }
  },

  logout() {
    wx.removeStorageSync('loggedIn');
    wx.removeStorageSync('userPhone');
    wx.removeStorageSync('currentAdvertiserClientId');
    wx.reLaunch({ url: '/pages/login/login' });
  },

  goAdmin() {
    wx.navigateTo({
      url: '/pages/admin/admin',
    });
  },

  goStore() {
    wx.navigateTo({
      url: '/pages/store-claim/store-claim',
    });
  },

  goAdvertiser() {
    wx.navigateTo({
      url: '/pages/advertiser/advertiser',
    });
  },

  goInspector() {
    wx.navigateTo({
      url: '/pages/inspector/inspector',
    });
  },
});
