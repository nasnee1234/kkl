import { toLocalDateStr } from './queueNumbers';

const WEEKDAYS_TH = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

// ร้านเปิด 9:00–17:00 (ต้องตรงกับที่แสดงในหน้าแรก)
export const SHOP_OPEN_HOUR = 9;
export const SHOP_CLOSE_HOUR = 17;

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

// ตัวเลือกวัน — วันนี้ถึงอีก N-1 วันข้างหน้า
export function getDateOptions(daysAhead = 7) {
  const options = [];
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = toLocalDateStr(d);
    options.push({ value, label: formatPickupDateLabel(value) });
  }
  return options;
}

// ตัวเลือกเวลา — ทุก 30 นาทีในเวลาทำการ ถ้าเป็นวันนี้จะตัดเวลาที่ผ่านไปแล้วออก
export function getTimeOptions(dateStr, stepMin = 30) {
  const options = [];
  const isToday = dateStr === toLocalDateStr();
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (let h = SHOP_OPEN_HOUR; h <= SHOP_CLOSE_HOUR; h++) {
    for (let m = 0; m < 60; m += stepMin) {
      if (h === SHOP_CLOSE_HOUR && m > 0) break;
      const totalMinutes = h * 60 + m;
      if (isToday && totalMinutes <= nowMinutes) continue;
      const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      options.push({ value, label: value + ' น.' });
    }
  }
  return options;
}
