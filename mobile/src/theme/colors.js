// ธีมสีกลางของแอป — ดึงค่าจริงจาก design token ของ "Kaemah Queue App"
// (claude.ai/design, ds/styles.css: --color-accent #c67139, --color-accent-2 #7a8a5e)
// ใช้ค่าจากที่นี่แทนการเขียนสี hex กระจายในแต่ละไฟล์ เวลาจะปรับธีมทั้งแอปแก้ที่เดียวจบ

// ความกว้างสูงสุดของเนื้อหาแอป (บนเว็บ) — จอมือถือเดิมกว้างน้อยกว่านี้อยู่แล้วเลยไม่มีผล
// แต่จอคอม/แท็บเล็ตจะเห็นแอปเป็นคอลัมน์กลางจอแทนที่จะยืดเต็มความกว้างจอ
export const APP_MAX_WIDTH = 480;

export const colors = {
  // ส้มอมน้ำตาลไหม้ terracotta — สีหลัก (--color-accent) เฉดเข้มขึ้นหนึ่งขั้นจากต้นแบบ
  primary: '#B45F27',
  primaryDark: '#9C4F1C', // hover
  primaryDeep: '#7A3B12', // active
  primaryGlow: '#EE9257',

  // เดิมเรียก "ทอง" แต่จริงๆ คือส้มอ่อนไล่ระดับเดียวกับ primary (ไม่มีสีที่ 3 ในดีไซน์ต้นแบบ)
  gold: '#EE9257',
  goldLight: '#FFBB94',

  // เขียวมะกอก (--color-accent-2) — ใช้กับปุ่ม positive/เสร็จแล้ว/เรียกคิวถัดไป
  leaf: '#5E6E45',
  leafLight: '#E4F1CD',

  // โทนเข้ม (พื้นหลังลึก, แอดมิน) — --color-neutral-800/900
  charcoal: '#25231E', // --color-neutral-900
  charcoalSoft: '#3E3A31', // --color-neutral-800

  // พื้นหลัง/กลาง — พื้นหลังเข้มขึ้นแต่การ์ดยังสว่าง เพื่อให้การ์ดลอยเด่นขึ้นกว่าเดิม
  cream: '#EBDCC1', // --color-bg
  creamSoft: '#DECBA9', // --color-surface
  card: '#FBF7F0', // --color-neutral-100
  border: '#C8B99C', // --color-neutral-300

  // ตัวหนังสือ — --color-text / --color-neutral-700
  textDark: '#1A1815',
  textMuted: '#564E41',

  // สถานะ
  success: '#5E6E45',
  successBg: '#E4F1CD',
  warning: '#6F6656',
  warningBg: '#E3D7C0',
  info: '#7A3B12',
  infoBg: '#FFE9D8',
  danger: '#9C4F1C',
  dangerBg: '#FFD4B8',
};

// เงามาตรฐาน 3 ระดับ — ใช้ให้ตรงกันทุกหน้าแทนการกำหนดเงาเองกระจายในแต่ละไฟล์
export const shadows = {
  sm: {
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 5,
  },
  lg: {
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 26,
    elevation: 9,
  },
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
  bg: '#25231E',
  surface: '#332F28', // ระหว่าง neutral-800/900 ให้การ์ดเด่นจากพื้นหลังนิดหน่อย
  surfaceAlt: colors.charcoalSoft,
  border: '#463F34',
  text: '#FBF7F0',
  textMuted: '#BCB09C', // --color-neutral-400
  accent: colors.primaryGlow, // บนพื้นเข้มต้องใช้เฉดสว่างกว่าเพื่อให้อ่านออก
  accentDark: colors.primary,
  cta: '#8B9C6D', // --color-accent-2-500
  ctaText: '#25231E', // --color-neutral-900 (ตัวหนังสือเข้มบนปุ่มเขียว ตามต้นฉบับ)
  gold: colors.gold,
  danger: '#E08A50',
  dangerBg: 'rgba(224,138,80,0.18)',
};

// สถานะคิวโทนเข้ม (ใช้ในหน้าจัดการคิวของแอดมิน)
export const ADMIN_STATUS_THEME = {
  waiting: { label: 'รอเรียก', color: '#BCB09C', bg: 'rgba(188,176,156,0.18)', icon: 'time-outline' },
  calling: { label: 'กำลังเรียก', color: adminTheme.accent, bg: 'rgba(238,146,87,0.22)', icon: 'megaphone-outline' },
  done: { label: 'เสร็จแล้ว', color: adminTheme.cta, bg: 'rgba(139,156,109,0.22)', icon: 'checkmark-circle-outline' },
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
