const priceNotice = require('../../../utils/priceNotice.js');

Page({
  data: {
    currentPublishedNotice: '',
    showNoticeModal: false,
    noticeModalDraft: '',
  },

  onShow() {
    this.setData({ currentPublishedNotice: priceNotice.get() || '' });
  },

  openNoticeModal() {
    this.setData({
      showNoticeModal: true,
      noticeModalDraft: priceNotice.get() || '',
    });
  },

  closeNoticeModal() {
    this.setData({ showNoticeModal: false });
  },

  stopNoticeBubble() {},

  onNoticeModalInput(e) {
    this.setData({ noticeModalDraft: e.detail.value });
  },

  publishNoticeFromModal() {
    const t = (this.data.noticeModalDraft || '').trim();
    priceNotice.set(t);
    this.setData({
      currentPublishedNotice: t,
      showNoticeModal: false,
    });
    wx.showToast({ title: '已发布', icon: 'success' });
  },

  clearPublishedNotice() {
    priceNotice.set('');
    this.setData({ currentPublishedNotice: '' });
    wx.showToast({ title: '已清空', icon: 'success' });
  },
});
