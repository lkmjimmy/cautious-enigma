const userRoleProfile = require('../../utils/userRoleProfile.js');

const ROLE_REDIRECT = {
  store: '/packageStore/pages/store-claim/store-claim',
  advertiser: '/packageBiz/pages/advertiser/advertiser',
  inspector: '/packageBiz/pages/inspector/inspector',
};

function goRole(role) {
  const target = ROLE_REDIRECT[role];
  if (!target) return;
  if (!userRoleProfile.hasCompleteProfile(role)) {
    wx.navigateTo({
      url: `/pages/role-first-profile/role-first-profile?role=${role}&redirect=${encodeURIComponent(target)}`,
    });
    return;
  }
  wx.navigateTo({ url: target });
}

Page({
  data: {
    isAdmin: false,
  },

  onShow() {
    if (!wx.getStorageSync('loggedIn')) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    const role = wx.getStorageSync('userRole') || 'user';
    this.setData({ isAdmin: role === 'admin' });
  },

  logout() {
    wx.removeStorageSync('loggedIn');
    wx.removeStorageSync('userPhone');
    wx.removeStorageSync('currentAdvertiserClientId');
    wx.removeStorageSync('userRole');
    wx.removeStorageSync('apiToken');
    wx.reLaunch({ url: '/pages/login/login' });
  },

  goAdmin() {
    wx.navigateTo({
      url: '/packageAdmin/pages/admin/admin',
    });
  },

  goStore() {
    goRole('store');
  },

  goAdvertiser() {
    goRole('advertiser');
  },

  goInspector() {
    goRole('inspector');
  },
});
