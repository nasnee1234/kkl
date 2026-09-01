import { toLocalDateStr } from './queueNumbers';

const WEEKDAYS_TH = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
export const MONTHS_FULL_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

// ตัวเลือกเดือนทั้ง 12 เดือน ไม่จำกัดว่าต้องเป็นเดือนใกล้ๆ นี้เท่านั้น
export const MONTH_OPTIONS = MONTHS_FULL_TH.map((label, idx) => ({
  value: String(idx + 1).padStart(2, '0'),
  label,
}));

export function formatPickupDateLabel(dateStr) {
  const today = toLocalDateStr();
  if (dateStr === today) return 'วันนี้';

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateStr === toLocalDateStr(tomorrow)) return 'พรุ่งนี้';

  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${WEEKDAYS_TH[date.getDay()]} ${d} ${MONTHS_TH[m - 1]}`;
}

// ปีที่ควรใช้กับเดือนที่เลือก — ถ้าเดือนนั้นผ่านไปแล้วในปีนี้ ให้หมายถึงเดือนนั้นของปีหน้าแทน (กันเลือกวันที่ย้อนหลัง)
export function resolveYearForMonth(month) {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  return month >= currentMonth ? today.getFullYear() : today.getFullYear() + 1;
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

// ตัวเลือกวันของเดือนที่เลือก — ถ้าเป็นเดือนปัจจุบันจะตัดวันที่ผ่านไปแล้วออก ไม่งั้นโชว์ครบทั้งเดือน
export function getDayOptions(month) {
  const today = new Date();
  const year = resolveYearForMonth(month);
  const total = daysInMonth(year, month);
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
  const startDay = isCurrentMonth ? today.getDate() : 1;
  const options = [];
  for (let d = startDay; d <= total; d++) {
    options.push({ value: String(d).padStart(2, '0'), label: String(d) });
  }
  return options;
}

export function buildPickupDate(month, day) {
  const year = resolveYearForMonth(month);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ร้านเปิด 9:00–17:00 (ต้องตรงกับที่แสดงในหน้าแรก)
export const SHOP_OPEN_HOUR = 9;
export const SHOP_CLOSE_HOUR = 17;

// จองวันนี้ต้องเผื่อเวลาร้านเตรียมของอย่างน้อย 1 ชม.จากตอนนี้
const MIN_LEAD_MINUTES = 60;

// ตัวเลือกเวลา — เฉพาะช่วงเวลาเปิดร้าน ถ้าเป็นวันนี้จะตัดเวลาที่ใกล้กว่า 1 ชม.จากตอนนี้ออก
export function getTimeOptions(dateStr) {
  const options = [];
  const isToday = dateStr === toLocalDateStr();
  const now = new Date();
  const cutoffMinutes = now.getHours() * 60 + now.getMinutes() + MIN_LEAD_MINUTES;

  for (let h = SHOP_OPEN_HOUR; h <= SHOP_CLOSE_HOUR; h++) {
    for (let m = 0; m < 60; m++) {
      if (h === SHOP_CLOSE_HOUR && m > 0) break;
      const totalMinutes = h * 60 + m;
      if (isToday && totalMinutes < cutoffMinutes) continue;
      const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      options.push({ value, label: value + ' น.' });
    }
  }
  return options;
}
