const slotOwnership = require('./slotOwnership.js');
const clientPlacementSchedule = require('./clientPlacementSchedule.js');

/**
 * 在投：至少拥有一个已分配广告位，且该广告位类型在客户投放设置里已配置到期日，且未过期。
 */
function computeForClient(clientId) {
  if (!clientId) return { inAd: false, placementLines: [] };
  const owned = slotOwnership.getOwnedSlots(clientId);
  const types = [...new Set(owned.map((s) => s.type).filter(Boolean))];
  const sched = clientPlacementSchedule.getForClient(clientId);
  const now = new Date();
  const lines = [];
  types.forEach((type) => {
    const entry = sched[type];
    const exp = clientPlacementSchedule.expireAtFromEntry(entry);
    if (!exp || exp === '--') return;
    const d = clientPlacementSchedule.daysUntilExpire(exp, now);
    if (d === null || d < 0) return;
    lines.push(`${type} · 至 ${exp}`);
  });
  lines.sort((a, b) => a.localeCompare(b, 'zh-CN'));
  return { inAd: lines.length > 0, placementLines: lines };
}

function enrichClientsForList(clients) {
  return (clients || []).map((c) => {
    const { inAd, placementLines } = computeForClient(c.id);
    return { ...c, inAd, placementLines };
  });
}

module.exports = {
  computeForClient,
  enrichClientsForList,
};
