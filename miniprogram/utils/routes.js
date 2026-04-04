/**
 * 页面路径（与 app.json 主包 / 分包一致）。
 */
module.exports = {
  login: '/pages/login/login',
  index: '/pages/index/index',
  roleFirstProfile: '/pages/role-first-profile/role-first-profile',

  packageStore: {
    storeClaim: '/packageStore/pages/store-claim/store-claim',
    storeHome: '/packageStore/pages/store-home/store-home',
    storeRevenue: '/packageStore/pages/store-revenue/store-revenue',
    storeSlots: '/packageStore/pages/store-slots/store-slots',
  },

  packageAdmin: {
    admin: '/packageAdmin/pages/admin/admin',
    adminPublish: '/packageAdmin/pages/admin-publish/admin-publish',
    adminTodo: '/packageAdmin/pages/admin-todo/admin-todo',
    adminMine: '/packageAdmin/pages/admin-mine/admin-mine',
    adminSlotPrices: '/packageAdmin/pages/admin-slot-prices/admin-slot-prices',
    adminStoreManage: '/packageAdmin/pages/admin-store-manage/admin-store-manage',
    adminPersonnel: '/packageAdmin/pages/admin-personnel/admin-personnel',
    adminSlotManage: '/packageAdmin/pages/admin-slot-manage/admin-slot-manage',
    adminClients: '/packageAdmin/pages/admin-clients/admin-clients',
    adminClientDetail: '/packageAdmin/pages/admin-client-detail/admin-client-detail',
    adminClientTime: '/packageAdmin/pages/admin-client-time/admin-client-time',
    adminStoreDetail: '/packageAdmin/pages/admin-store-detail/admin-store-detail',
    slots: '/packageAdmin/pages/slots/slots',
  },

  packageBiz: {
    advertiser: '/packageBiz/pages/advertiser/advertiser',
    advertiserContract: '/packageBiz/pages/advertiser-contract/advertiser-contract',
    advertiserPlacements: '/packageBiz/pages/advertiser-placements/advertiser-placements',
    inspector: '/packageBiz/pages/inspector/inspector',
    inspectorCheck: '/packageBiz/pages/inspector-check/inspector-check',
    inspectorStoreCheckin: '/packageBiz/pages/inspector-store-checkin/inspector-store-checkin',
    inspectorStoreInit: '/packageBiz/pages/inspector-store-init/inspector-store-init',
    inspectorAddStore: '/packageBiz/pages/inspector-add-store/inspector-add-store',
  },
};
