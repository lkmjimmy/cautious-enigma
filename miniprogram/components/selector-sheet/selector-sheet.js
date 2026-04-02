Component({
  properties: {
    show: { type: Boolean, value: false },
    title: { type: String, value: '请选择' },
    options: { type: Array, value: [] },
    rangeKey: { type: String, value: '' },
    selectedIndex: { type: Number, value: 0 },
  },
  methods: {
    noop() {},
    onMask() {
      this.triggerEvent('close', {});
    },
    onCancel() {
      this.triggerEvent('close', {});
    },
    onPick(e) {
      const idx = Number(e.currentTarget.dataset.index);
      if (Number.isNaN(idx)) return;
      this.triggerEvent('select', { index: idx });
    },
  },
});
