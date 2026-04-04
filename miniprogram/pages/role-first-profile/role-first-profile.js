const userRoleProfile = require('../../utils/userRoleProfile.js');
const phoneValidate = require('../../utils/phoneValidate.js');

const ROLE_META = {
  store: {
    title: '门店信息',
    subtitle: '请填写您负责的门店名称与联系电话',
  },
  advertiser: {
    title: '广告主信息',
    subtitle: '请填写联系人、公司与电话',
  },
  inspector: {
    title: '巡店员信息',
    subtitle: '请填写姓名与联系电话',
  },
};

Page({
  data: {
    role: '',
    meta: null,
    redirect: '',
    storeName: '',
    companyName: '',
    name: '',
    phone: '',
    submitting: false,
  },

  onLoad(options) {
    const role = (options && options.role) || '';
    const redirect = (options && options.redirect) || '';
    const meta = ROLE_META[role];
    if (!meta || !redirect) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 400);
      return;
    }
    const existing = userRoleProfile.getRoleProfile(role) || {};
    this.setData({
      role,
      meta,
      redirect: decodeURIComponent(redirect),
      storeName: existing.storeName || '',
      companyName: existing.companyName || '',
      name: existing.name || '',
      phone: phoneValidate.sanitizePhoneInput(existing.phone || ''),
    });
    wx.setNavigationBarTitle({ title: meta.title });
  },

  onStoreNameInput(e) {
    this.setData({ storeName: e.detail.value });
  },
  onCompanyNameInput(e) {
    this.setData({ companyName: e.detail.value });
  },
  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },
  onPhoneInput(e) {
    this.setData({ phone: phoneValidate.sanitizePhoneInput(e.detail.value) });
  },

  submit() {
    const { role, redirect, storeName, companyName, name, phone } = this.data;
    if (this.data.submitting) return;

    const t = function (s) {
      return String(s || '').trim();
    };

    let payload = {};
    if (role === 'store') {
      if (!t(storeName) || !t(phone)) {
        wx.showToast({ title: '请填写门店名称与联系电话', icon: 'none' });
        return;
      }
      if (!phoneValidate.isValidMainlandMobile(phone)) {
        wx.showToast({ title: phoneValidate.invalidToastTitle(), icon: 'none' });
        return;
      }
      payload = { storeName: t(storeName), phone: t(phone) };
    } else if (role === 'advertiser') {
      if (!t(name) || !t(companyName) || !t(phone)) {
        wx.showToast({ title: '请填写姓名、公司与联系电话', icon: 'none' });
        return;
      }
      if (!phoneValidate.isValidMainlandMobile(phone)) {
        wx.showToast({ title: phoneValidate.invalidToastTitle(), icon: 'none' });
        return;
      }
      payload = { name: t(name), companyName: t(companyName), phone: t(phone) };
    } else if (role === 'inspector') {
      if (!t(name) || !t(phone)) {
        wx.showToast({ title: '请填写姓名与电话', icon: 'none' });
        return;
      }
      if (!phoneValidate.isValidMainlandMobile(phone)) {
        wx.showToast({ title: phoneValidate.invalidToastTitle(), icon: 'none' });
        return;
      }
      payload = { name: t(name), phone: t(phone) };
    } else {
      return;
    }

    this.setData({ submitting: true });
    userRoleProfile.setRoleProfile(role, payload);
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => {
      wx.redirectTo({ url: redirect });
    }, 350);
  },
});
