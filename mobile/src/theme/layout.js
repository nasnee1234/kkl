import { useWindowDimensions } from 'react-native';

// จุดตัดขนาดจอ — มือถือ / แท็บเล็ต(ไอแพด) / จอคอม
export const BREAKPOINTS = {
  tablet: 700,
  desktop: 1100,
};

// ป็อปอัพ/โมดัล ไม่ควรกว้างตามจอ อ่านยาก — คุมแยกจากความกว้างเนื้อหา
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
    gutter: isDesktop ? 40 : isTablet ? 26 : 18,
    // การ์ดเรียงเป็นสแต็ก (คิว/แจ้งเตือน/ฉัน) — ยืดตามจอ แต่จอใหญ่มากคุมไว้ไม่ให้บรรทัดยาวจนอ่านยาก
    stackMaxWidth: isDesktop ? 1000 : width,
    // รายการเมนู/แอดมิน — จอกว้างแบ่งเป็นหลายคอลัมน์แทนที่จะยืดแถวเดียวยาวๆ
    menuColumns: width >= 1500 ? 4 : isDesktop ? 3 : isTablet ? 2 : 1,
    menuMaxWidth: isDesktop ? 1600 : width,
  };
}
