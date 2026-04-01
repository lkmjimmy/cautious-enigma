Page({
  data: {
    stats: [
      { label: '在投广告位', value: 6 },
      { label: '7天内到期', value: 2 },
      { label: '历史投放', value: 14 },
    ],
    records: [
      {
        slot: 'SZ-FT-01-A5',
        store: '福田中心店',
        period: '2026-03-01 ~ 2026-05-20',
        status: '正常',
        photo: 'https://picsum.photos/seed/ad1/300/180',
      },
      {
        slot: 'SZ-NS-03-B2',
        store: '南山科技园店',
        period: '2026-02-15 ~ 2026-04-07',
        status: '即将到期',
        photo: 'https://picsum.photos/seed/ad2/300/180',
      },
    ],
  },
});
