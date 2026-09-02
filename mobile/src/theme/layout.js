import { useWindowDimensions } from 'react-native';

// จุดตัดขนาดจอ — มือถือ / แท็บเล็ต(ไอแพด) / จอคอม
export const BREAKPOINTS = {
  tablet: 700,
  desktop: 1100,
};

// ความกว้างสูงสุดของ "กรอบแอป" ทั้งหมด — จอใหญ่มากๆ ถึงจะเริ่มตีกรอบ
// ต่ำกว่านี้ (รวมไอแพดทุกขนาด) แอปจะใช้ความกว้างจอเต็มๆ ไม่บีบเป็นคอลัมน์แคบ
export const APP_MAX_WIDTH = 1160;

// ป็อปอัพ/โมดัล ไม่ควรกว้างตามจอ อ่านยาก — คุมแยกจากกรอบแอป
export const MODAL_MAX_WIDTH = 520;

export function useLayout() {
  const { width } = useWindowDimensions();
  const isTablet = width >= BREAKPOINTS.tablet;
  const isDesktop = width >= BREAKPOINTS.desktop;

  return {
    width,
    isTablet,
    isDesktop,
    // ระยะขอบซ้าย-ขวา ขยายตามจอ ไม่ให้เนื้อหาชิดขอบบนจอใหญ่
    gutter: isDesktop ? 32 : isTablet ? 26 : 18,
    // การ์ดเรียงเป็นสแต็ก (คิว/แจ้งเตือน/ฉัน) — กว้างเกินไปจะอ่านยาก เลยคุมไว้แล้วจัดกลางจอ
    stackMaxWidth: 760,
    // รายการเมนูอาหาร — จอกว้างแบ่งเป็นหลายคอลัมน์แทนที่จะยืดแถวเดียวยาวๆ
    menuColumns: isDesktop ? 3 : isTablet ? 2 : 1,
    menuMaxWidth: 1080,
  };
}
