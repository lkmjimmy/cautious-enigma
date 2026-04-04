const slotOwnership = require('./slotOwnership.js');
const clientAdStatus = require('./clientAdStatus.js');

/** 与列表「在投」一致：有分配且投放期内 */
function clientCannotDeleteReason(clientId) {
  if (!clientId) return '';
  if (clientAdStatus.computeForClient(clientId).inAd) {
    return '该客户存在在投广告，无法删除。请先调整投放或到期后再试。';
  }
  return '';
}

/** 门店下存在已投放或即将到期（仍属在投周期内）的广告位则不可删 */
function storeCannotDeleteReason(storeName) {
  if (!storeName) return '';
  const slots = slotOwnership.getAllSlots();
  for (let i = 0; i < slots.length; i += 1) {
    const s = slots[i];
    if (s.store !== storeName) continue;
    if (s.status === '已投放' || s.status === '即将到期') {
      return '该门店存在在投或即将到期的广告位，无法删除。请先处理相关投放后再试。';
    }
  }
  return '';
}

/**
 * 两次确认后再执行删除
 * @param {{ title1?: string, content1?: string, title2?: string, content2?: string }} opts
 * @param {() => void} onFinal
 */
function confirmDeleteTwice(opts, onFinal) {
  const o = opts || {};
  wx.showModal({
    title: o.title1 || '确认删除',
    content: o.content1 || '',
    confirmText: '下一步',
    confirmColor: '#dc2626',
    success: function (r1) {
      if (!r1.confirm) return;
      wx.showModal({
        title: o.title2 || '再次确认',
        content: o.content2 || '确定删除？此操作不可恢复。',
        confirmText: '确定删除',
        confirmColor: '#dc2626',
        success: function (r2) {
          if (r2.confirm && typeof onFinal === 'function') onFinal();
        },
      });
    },
  });
}

module.exports = {
  clientCannotDeleteReason,
  storeCannotDeleteReason,
  confirmDeleteTwice,
};
