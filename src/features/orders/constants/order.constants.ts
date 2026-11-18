// ============================================================================
// Order Constants: Statuses, Payment Methods & Void Reasons
// QuickOne Cafe & Bakery POS
// ============================================================================

export const ORDER_PAYMENT_METHODS: Record<string, { label_lo: string; short_lo: string; badgeClass: string }> = {
  cash: {
    label_lo: "ເງິນສົດ ",
    short_lo: "ເງິນສົດ",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  lao_qr: {
    label_lo: "ໂອນ LAO QR ",
    short_lo: "LAO QR",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  transfer: {
    label_lo: "ໂອນ LAO QR ",
    short_lo: "LAO QR",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  split: {
    label_lo: "ຊຳລະປະສົມ ",
    short_lo: "ປະສົມ",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
};

export const ORDER_STATUS_CONFIG: Record<string, { label_lo: string; bgClass: string }> = {
  preparing: {
    label_lo: "ກຳລັງຊົງ ",
    bgClass: "bg-amber-100 text-amber-900 border-amber-300",
  },
  ready: {
    label_lo: "ພ້ອມເສີບ ",
    bgClass: "bg-blue-100 text-blue-900 border-blue-300",
  },
  completed: {
    label_lo: "ສຳເລັດແລ້ວ ",
    bgClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  cancelled: {
    label_lo: "ຍົກເລີກແລ້ວ ",
    bgClass: "bg-rose-100 text-rose-900 border-rose-300",
  },
};

export const ORDER_MODE_CONFIG: Record<string, { label_lo: string; icon: string }> = {
  dine_in: {
    label_lo: "ກິນທີ່ຮ້ານ ",
    icon: "",
  },
  takeaway: {
    label_lo: "ສັ່ງກັບບ້ານ ",
    icon: "",
  },
  delivery: {
    label_lo: "Delivery",
    icon: "",
  },
};

export const VOID_ORDER_REASONS = [
  {
    code: "BARISTA_ERROR",
    label_lo: "ກົດລາຍການເຄື່ອງດື່ມ / ໄຊສ໌ຜິດ",
    description_lo: "ກົດຜິດຂະໜາດ, ລະດັບຄວາມຫວານ ຫຼື ທ໊ອບປິ້ງ",
  },
  {
    code: "CUSTOMER_CHANGE_MIND",
    label_lo: "ລູກຄ້າປ່ຽນໃຈ / ຍົກເລີກອໍເດີ",
    description_lo: "ລູກຄ້າປ່ຽນເມນູ ຫຼື ບໍ່ຕ້ອງການເຄື່ອງດື່ມແລ້ວ",
  },
  {
    code: "OUT_OF_INGREDIENT",
    label_lo: "ວັດຖຸດິບໝົດ (Out of Stock)",
    description_lo: "ເມັດກາເຟ, ນົມ ຫຼື ທ໊ອບປິ້ງໝົດບໍ່ສາມາດຊົງໄດ້",
  },
  {
    code: "PAYMENT_FAILED",
    label_lo: "ລະບົບຊຳລະເງິນຂັດຂ້ອງ",
    description_lo: "ການໂອນເງິນ LAO QR ບໍ່ສຳເລັດ",
  },
  {
    code: "OTHER",
    label_lo: "ເຫດຜົນອື່ນໆ",
    description_lo: "ລະບຸໃນໝາຍເຫດເພີ່ມເຕີມ",
  },
];
