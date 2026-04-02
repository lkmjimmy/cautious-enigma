const claim = require('../../utils/claim.js');

Page({
  data: {
    stores: [],
    approvedList: [],
    canEnterWorkbench: false,
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    claim.ensureUserId();
    const approvedList = claim.getMyApprovedStores(claim.ensureUserId());
    this.setData({
      stores: claim.buildStoreRows(),
      approvedList,
      canEnterWorkbench: approvedList.length > 0,
    });
  },

  onClaimTap(e) {
    const name = e.currentTarget.dataset.name;
    const status = e.currentTarget.dataset.status;
    if (status !== 'free' && status !== 'pending') {
      if (status === 'taken') {
        wx.showToast({ title: '该门店已被他人认领', icon: 'none' });
      }
      return;
    }
    if (status === 'pending') {
      wx.showToast({ title: '请等待中台审核', icon: 'none' });
      return;
    }

    const res = claim.requestClaim(name);
    if (!res.ok) {
      wx.showToast({ title: res.message || '无法认领', icon: 'none' });
      return;
    }
    if (res.mode === 'immediate') {
      claim.setCurrentStoreView(name);
      wx.showToast({ title: '认领成功', icon: 'success' });
    } else if (res.mode === 'pending') {
      wx.showToast({ title: '已提交审核，请等待中台通过', icon: 'none' });
    }
    this.refresh();
  },

  goWorkbench() {
    if (!this.data.canEnterWorkbench) return;
    const name = claim.getCurrentStoreView();
    claim.setCurrentStoreView(name);
    wx.navigateTo({
      url: `/pages/store-home/store-home?store=${encodeURIComponent(name)}`,
    });
  },
});
