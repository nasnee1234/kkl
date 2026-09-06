// รูปเมนูอาหารแบบไฟล์ในเครื่อง (เหมือนแพทเทิร์นของ Sabanoor-Mobile)
// แทนที่จะใช้ลิงก์ URL — เอาไฟล์รูปมาวางในโฟลเดอร์ images/menu/ แล้วเพิ่ม require() ไว้ตรงนี้
//
// วิธีเพิ่มรูปใหม่ 3 ขั้นตอน:
//   1. เอาไฟล์รูป (เช่น อก.jpg) มาวางใน mobile/src/assets/images/menu/
//   2. เพิ่มบรรทัดใหม่ในอ็อบเจกต์ MENU_IMAGE_MAP ด้านล่าง เช่น
//        'อก': require('./images/menu/อก.jpg'),
//   3. ไปที่หน้า "จัดการเมนู" ในแอป แล้วเลือกรูปนี้ให้กับเมนูที่ต้องการ
//
// require() ของ Metro ต้องเป็น path ตรงๆ แบบนี้เท่านั้น ใส่เป็นตัวแปรไม่ได้ จึงต้องเพิ่มทีละบรรทัด

export const MENU_IMAGE_MAP = {
  'คอ': require('./images/menu/คอ.jpg'),
  'ตับ': require('./images/menu/ตับ.jpg'),
  'ตีน': require('./images/menu/ตีน.jpg'),
  'น่อง': require('./images/menu/น่อง.jpg'),
  'ปลา': require('./images/menu/ปลา.jpg'),
  'ปีก': require('./images/menu/ปีก.jpg'),
  'หนัง': require('./images/menu/หนัง.jpg'),
  'หอย': require('./images/menu/หอย.jpg'),
  'อกใหญ่': require('./images/menu/อกใหญ่.jpg'),
  'อกกล็ก': require('./images/menu/อกกล็ก.jpg'),
  'เนื้อล้วน': require('./images/menu/เนื้อล้วน.jpg'),
  'ใส้': require('./images/menu/ใส้.jpg'),
};

export const MENU_IMAGE_KEYS = Object.keys(MENU_IMAGE_MAP);

export function getLocalMenuImage(key) {
  return key ? MENU_IMAGE_MAP[key] : undefined;
}
