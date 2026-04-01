const app = getApp();

Page({
  data: {
    orderId: '',
    photoLimit: 10,
    photos: [],
  },
  onLoad(options) {
    const orderId = options.order_id || app.globalData.orderId || '';
    const limit = parseInt(options.limit, 10) || app.globalData.photoLimit || 10;
    this.setData({ orderId, photoLimit: limit });
  },
  onChoose() {
    const { photoLimit, photos } = this.data;
    const remain = photoLimit - photos.length;
    if (remain <= 0) {
      wx.showToast({ title: '已达上传上限', icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newPaths = (res.tempFiles || []).map(f => f.tempFilePath);
        this.setData({ photos: [...photos, ...newPaths].slice(0, photoLimit) });
      },
    });
  },
  onDel(e) {
    const i = e.currentTarget.dataset.i;
    const photos = this.data.photos.filter((_, idx) => idx !== i);
    this.setData({ photos });
  },
  onSubmit() {
    if (this.data.photos.length === 0) return;
    wx.showLoading({ title: '上传中...' });
    const upload = (files, index) => {
      if (index >= files.length) {
        wx.hideLoading();
        wx.showToast({ title: '提交成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1500);
        return;
      }
      wx.uploadFile({
        url: `${app.globalData.apiBase}/api/upload`,
        filePath: files[index],
        name: 'photos',
        formData: { order_id: this.data.orderId },
        success: () => upload(files, index + 1),
        fail: () => {
          wx.hideLoading();
          wx.showToast({ title: '上传失败', icon: 'none' });
        },
      });
    };
    upload(this.data.photos, 0);
  },
});
