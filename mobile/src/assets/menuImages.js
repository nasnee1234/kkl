// รูปเมนูอาหารแบบไฟล์ในเครื่อง (เหมือนแพทเทิร์นของ Sabanoor-Mobile)
// แทนที่จะใช้ลิงก์ URL — เอาไฟล์รูปมาวางในโฟลเดอร์ images/menu/ แล้วเพิ่ม require() ไว้ตรงนี้
//
// วิธีเพิ่มรูปใหม่ 3 ขั้นตอน:
//   1. เอาไฟล์รูป (เช่น kai_kolae_1.jpg) มาวางใน mobile/src/assets/images/menu/
//   2. เพิ่มบรรทัดใหม่ในอ็อบเจกต์ MENU_IMAGE_MAP ด้านล่าง เช่น
//        kai_kolae_1: require('./images/menu/kai_kolae_1.jpg'),
//   3. ไปที่หน้า "จัดการเมนู" ในแอป แล้วเลือกรูปนี้ให้กับเมนูที่ต้องการ
//
// require() ของ Metro ต้องเป็น path ตรงๆ แบบนี้เท่านั้น ใส่เป็นตัวแปรไม่ได้ จึงต้องเพิ่มทีละบรรทัด

export const MENU_IMAGE_MAP = {
  kai_kolae_1: require('./images/menu/kai_kolae_1.jpg'),
  kai_kolae_2: require('./images/menu/kai_kolae_2.jpg'),
  kai_kolae_3: require('./images/menu/kai_kolae_3.jpg'),
  kai_kolae_4: require('./images/menu/kai_kolae_4.jpg'),
  kai_kolae_5: require('./images/menu/kai_kolae_5.jpg'),
  kai_kolae_6: require('./images/menu/kai_kolae_6.jpg'),
  kai_kolae_7: require('./images/menu/kai_kolae_7.jpg'),
};

export const MENU_IMAGE_KEYS = Object.keys(MENU_IMAGE_MAP);

export function getLocalMenuImage(key) {
  return key ? MENU_IMAGE_MAP[key] : undefined;
}
