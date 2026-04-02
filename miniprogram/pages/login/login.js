const STORAGE_LOGGED = 'loggedIn';
const STORAGE_PHONE = 'userPhone';

Page({
  data: {
    loading: false,
  },

  onLoad() {
    if (wx.getStorageSync(STORAGE_LOGGED)) {
      wx.reLaunch({ url: '/pages/index/index' });
    }
  },

  /** 微信一键登录：wx.login 仅拿到 code，必须由服务端换 openid / session */
  onWechatLogin() {
    if (this.data.loading) return;

    this.setData({ loading: true });
    wx.login({
      success: (res) => {
        if (!res.code) {
          this.setData({ loading: false });
          wx.showToast({ title: '未获取到登录凭证', icon: 'none' });
          return;
        }
        // 生产环境：wx.request({ url: '你的后端/login', data: { code: res.code }, ... })
        wx.setStorageSync(STORAGE_LOGGED, true);
        wx.setStorageSync(STORAGE_PHONE, '微信用户');
        this.setData({ loading: false });
        wx.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => {
          wx.reLaunch({ url: '/pages/index/index' });
        }, 450);
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({ title: '微信登录失败', icon: 'none' });
      },
    });
  },
});
