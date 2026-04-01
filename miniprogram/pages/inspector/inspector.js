Page({
  data: {
    completion: '2 / 5',
    tasks: [
      { store: '福田中心店', slots: 4, distance: '1.2km', done: false },
      { store: '南山科技园店', slots: 3, distance: '2.8km', done: false },
      { store: '宝安壹方城店', slots: 2, distance: '7.1km', done: true },
    ],
    checkedInStore: '',
    photo: '',
    status: '正常',
  },

  choosePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        const file = (res.tempFiles || [])[0];
        this.setData({ photo: file ? file.tempFilePath : '' });
      },
    });
  },

  onStatusChange(e) {
    this.setData({ status: e.currentTarget.dataset.status });
  },

  onCheckIn(e) {
    this.setData({ checkedInStore: e.currentTarget.dataset.store });
    wx.showToast({ title: '打卡成功', icon: 'success' });
  },

  onSubmit() {
    if (!this.data.checkedInStore || !this.data.photo) {
      wx.showToast({ title: '请先打卡并拍照', icon: 'none' });
      return;
    }
    wx.showToast({ title: '巡检已提交', icon: 'success' });
  },
});
