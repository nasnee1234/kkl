// ธีมสีกลางของแอป — ดึงค่าจริงจาก design token ของ "Kaemah Queue App"
// (claude.ai/design, ds/styles.css: --color-accent #c67139, --color-accent-2 #7a8a5e)
// ใช้ค่าจากที่นี่แทนการเขียนสี hex กระจายในแต่ละไฟล์ เวลาจะปรับธีมทั้งแอปแก้ที่เดียวจบ

export const colors = {
  // ส้มอมน้ำตาลไหม้ terracotta — สีหลัก (--color-accent)
  primary: '#C67139',
  primaryDark: '#B2622D', // --color-accent-600 (hover)
  primaryDeep: '#8C491A', // --color-accent-700 (active)
  primaryGlow: '#F6A06B', // --color-accent-400

  // เดิมเรียก "ทอง" แต่จริงๆ คือส้มอ่อนไล่ระดับเดียวกับ primary (ไม่มีสีที่ 3 ในดีไซน์ต้นแบบ)
  gold: '#F6A06B', // --color-accent-400
  goldLight: '#FFC6A5', // --color-accent-300

  // เขียวมะกอกอ่อน (--color-accent-2) — ใช้กับปุ่ม positive/เสร็จแล้ว/เรียกคิวถัดไป
  leaf: '#728157', // --color-accent-2-600
  leafLight: '#F0FAE1', // --color-accent-2-100

  // โทนเข้ม (พื้นหลังลึก, แอดมิน) — --color-neutral-800/900
  charcoal: '#2E2B25', // --color-neutral-900
  charcoalSoft: '#474238', // --color-neutral-800

  // พื้นหลัง/กลาง — --color-bg / --color-surface / --color-neutral-100
  cream: '#F5EAD8', // --color-bg
  creamSoft: '#EBDDC5', // --color-surface
  card: '#F9F4ED', // --color-neutral-100
  border: '#DCD3C4', // --color-neutral-300

  // ตัวหนังสือ — --color-text / --color-neutral-700
  textDark: '#201E1D',
  textMuted: '#645C50',

  // สถานะ
  success: '#728157',
  successBg: '#F0FAE1',
  warning: '#82796A', // --color-neutral-600 (ดีไซน์ต้นแบบไม่มีสีเหลือง/ส้มแยกสำหรับ "รอ" ใช้กลาง ๆ)
  warningBg: '#EEE7DB', // --color-neutral-200
  info: '#8C491A',
  infoBg: '#FFF2EB',
  danger: '#B2622D',
  dangerBg: '#FFE1D0',
};

// ไล่สีสำหรับ hero / ปุ่มหลัก — ดีไซน์ต้นแบบใช้สีล้วน (flat) เป็นหลัก ไม่ใช่กราเดียนต์จัด
// ใช้เฉดใกล้กันมากเพื่อให้ยังคงความรู้สึก "เกือบ flat" เหมือนต้นฉบับ
export const gradients = {
  primary: [colors.primary, colors.primaryDark],
  primaryGlow: [colors.primaryGlow, colors.primary],
  dark: [colors.charcoalSoft, colors.charcoal],
};

// ธีมเข้มสำหรับฝั่งแอดมิน — ตรงกับหน้าแอดมินของดีไซน์ต้นแบบ (พื้นหลัง --color-neutral-900)
export const adminTheme = {
  bg: '#2E2B25',
  surface: '#3B372E', // ระหว่าง neutral-800/900 ให้การ์ดเด่นจากพื้นหลังนิดหน่อย
  surfaceAlt: colors.charcoalSoft,
  border: '#4C463B',
  text: '#F9F4ED',
  textMuted: '#C0B6A5', // --color-neutral-400
  accent: colors.primary,
  accentDark: colors.primaryDark,
  cta: '#8FA073', // --color-accent-2-500
  ctaText: '#2E2B25', // --color-neutral-900 (ตัวหนังสือเข้มบนปุ่มเขียว ตามต้นฉบับ)
  gold: colors.gold,
  danger: '#D67F48', // --color-accent-500
  dangerBg: 'rgba(214,127,72,0.16)',
};

// สถานะคิวโทนเข้ม (ใช้ในหน้าจัดการคิวของแอดมิน)
export const ADMIN_STATUS_THEME = {
  waiting: { label: 'รอเรียก', color: '#C0B6A5', bg: 'rgba(192,182,165,0.16)', icon: 'time-outline' },
  calling: { label: 'กำลังเรียก', color: adminTheme.accent, bg: 'rgba(198,113,57,0.2)', icon: 'megaphone-outline' },
  done: { label: 'เสร็จแล้ว', color: adminTheme.cta, bg: 'rgba(143,160,115,0.2)', icon: 'checkmark-circle-outline' },
  cancelled: { label: 'ยกเลิก', color: adminTheme.danger, bg: adminTheme.dangerBg, icon: 'close-circle-outline' },
};

// ธีมสถานะคิวกลาง — เดิมนิยามซ้ำอยู่ 3 ที่ (QueueContext, QueueRequest, QueueManagement)
export const STATUS_THEME = {
  waiting: {
    label: 'กำลังรอคิว',
    color: colors.warning,
    bg: colors.warningBg,
    icon: 'time-outline',
  },
  calling: {
    label: 'ถึงคิวของคุณแล้ว!',
    color: colors.primaryDark,
    bg: colors.creamSoft,
    icon: 'megaphone-outline',
  },
  done: {
    label: 'เสร็จสิ้น',
    color: colors.success,
    bg: colors.successBg,
    icon: 'checkmark-done-outline',
  },
  cancelled: {
    label: 'ถูกยกเลิก',
    color: colors.danger,
    bg: colors.dangerBg,
    icon: 'close-outline',
  },
};
