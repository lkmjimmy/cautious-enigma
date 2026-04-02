const claim = require('../../utils/claim.js');
const promoteRequestInbox = require('../../utils/promoteRequestInbox.js');

function formatPromoteTime(ts) {
  const d = new Date(ts);
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function mapPromoteRequestsForView() {
  return promoteRequestInbox.list().map((r) => {
    const planMode = r.planMode || 'renew';
    const expandSelections = r.expandSelections || [];
    const expandDetailText =
      planMode === 'expand' && expandSelections.length
        ? expandSelections
            .map((s) => `${s.store} · ${s.code}（${s.type}）`)
            .join('；')
        : '';
    return {
      ...r,
      planMode,
      planModeLabel: planMode === 'expand' ? '加大推广计划' : '原推广计划续期',
      typesText: (r.types || []).join('、'),
      timeText: formatPromoteTime(r.createdAt),
      expandDetailText,
    };
  });
}

Page({
  data: {
    claimPending: [],
    promoteRequests: [],
  },

  onShow() {
    this.setData({
      claimPending: claim.getPendingForAdmin(),
      promoteRequests: mapPromoteRequestsForView(),
    });
  },

  onApproveClaim(e) {
    const id = e.currentTarget.dataset.id;
    const r = claim.approvePending(id);
    wx.showToast({
      title: r.ok ? (r.mode === 'noop' ? '已是认领状态' : '已通过') : (r.message || '处理失败'),
      icon: r.ok ? 'success' : 'none',
    });
    this.setData({ claimPending: claim.getPendingForAdmin() });
  },

  onRejectClaim(e) {
    const id = e.currentTarget.dataset.id;
    claim.rejectPending(id);
    wx.showToast({ title: '已拒绝', icon: 'success' });
    this.setData({ claimPending: claim.getPendingForAdmin() });
  },

  onDismissPromoteRequest(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    promoteRequestInbox.removeById(id);
    this.setData({ promoteRequests: mapPromoteRequestsForView() });
    wx.showToast({ title: '已标记', icon: 'success' });
  },
});
