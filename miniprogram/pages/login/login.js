const STORAGE_LOGGED = 'loggedIn';
const STORAGE_PHONE = 'userPhone';
const STORAGE_ROLE = 'userRole';
const apiConfig = require('../../utils/apiConfig.js');
const apiRequest = require('../../utils/apiRequest.js');

function syncServerSession(code, role) {
  if (!apiConfig.useServer || !apiConfig.baseUrl) return Promise.resolve(null);
  return apiRequest
    .request({
      path: '/api/v1/auth/wechat',
      method: 'POST',
      data: { code, role: role === 'admin' ? 'admin' : 'user' },
    })
    .then((data) => {
      if (data && data.token) apiRequest.setApiToken(data.token);
      return data || null;
    });
}

Page({
  data: {
    loading: false,
  },

  onLoad() {
    if (wx.getStorageSync(STORAGE_LOGGED)) {
      wx.reLaunch({ url: '/pages/index/index' });
    }
  },

  /** 微信一键登录：先换票（若启用后端）再写入本地并进入首页，减少 token 未就绪的竞态 */
  _doWechatLogin(role) {
    if (this.data.loading) return;

    this.setData({ loading: true });
    const r = role || 'user';
    const self = this;

    const persistLocalAndEnter = function (toastTitle, toastIcon, delayMs, serverData) {
      wx.setStorageSync(STORAGE_LOGGED, true);
      wx.setStorageSync(STORAGE_PHONE, '微信用户');
      const roleToSave =
        serverData && (serverData.role === 'admin' || serverData.role === 'user')
          ? serverData.role
          : r;
      wx.setStorageSync(STORAGE_ROLE, roleToSave);
      self.setData({ loading: false });
      if (toastTitle) {
        wx.showToast({ title: toastTitle, icon: toastIcon || 'none' });
      }
      setTimeout(function () {
        wx.reLaunch({ url: '/pages/index/index' });
      }, delayMs == null ? 450 : delayMs);
    };

    wx.login({
      success: function (res) {
        if (!res.code) {
          self.setData({ loading: false });
          wx.showToast({ title: '未获取到登录凭证', icon: 'none' });
          return;
        }

        if (!apiConfig.useServer || !apiConfig.baseUrl) {
          persistLocalAndEnter('登录成功', 'success', 450, null);
          return;
        }

        syncServerSession(res.code, r)
          .then(function (data) {
            const serverDataSync = require('../../utils/serverDataSync.js');
            return serverDataSync.pullCoreData({ force: true }).then(function () {
              return data;
            });
          })
          .then(function (data) {
            persistLocalAndEnter('登录成功', 'success', 450, data);
          })
          .catch(function (err) {
            console.error('[login] 后端 /api/v1/auth/wechat 失败', err);
            const msg = err && (err.errMsg || err.message || '');
            const isTimeout = /timeout/i.test(String(msg));
            wx.showToast({
              title: isTimeout ? '后端超时：请核对 apiConfig 里 IP 与后端' : '后端未连通，已仅本地登录',
              icon: 'none',
              duration: isTimeout ? 3500 : 2800,
            });
            persistLocalAndEnter(null, null, isTimeout ? 3200 : 2600, null);
          });
      },
      fail: function () {
        self.setData({ loading: false });
        wx.showToast({ title: '微信登录失败', icon: 'none' });
      },
    });
  },

  onWechatLogin() {
    this._doWechatLogin('user');
  },

  onAdminWechatLogin() {
    this._doWechatLogin('admin');
  },
});
