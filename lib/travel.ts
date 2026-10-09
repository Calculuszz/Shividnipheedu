// Travel report for the university's sustainability office ("How To กรอกข้อมูลการเดินทาง" sheet).
// The office reads these values by exact text, so every string below must match the sheet
// character for character. Change them only to match a newer version of that sheet.

/** Column headers of the travel CSV, exactly as in the sheet */
export const TRAVEL_COLUMNS = ['วิธีเดินทาง', 'จังหวัดต้นทาง', 'เขตต้นทาง'] as const;

/** "วิธีเดินทาง": the 12 options in the sheet's table */
export const TRAVEL_MODES = [
  'รถยนต์ส่วนบุคคล',
  'รถกระบะส่วนบุคคล',
  'แท็กซี่',
  'รถยนต์ไฟฟ้าส่วนบุคคล',
  'รถตู้ส่วนบุคคล',
  'จักรยานยนต์',
  'เที่ยวบินในประเทศ',
  'รถตู้ประจำทาง',
  'รถโดยสารประจำทาง',
  'รถไฟดีเซลราง',
  'เรือสาธารณะ',
  'รถไฟฟ้า',
] as const;

/** "จังหวัดต้นทาง": Bangkok is written กรุงเทพ only (the sheet's rule), every other province by its full name */
export const BANGKOK = 'กรุงเทพ';

const OTHER_PROVINCES = [
  'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร', 'ขอนแก่น', 'จันทบุรี', 'ฉะเชิงเทรา', 'ชลบุรี',
  'ชัยนาท', 'ชัยภูมิ', 'ชุมพร', 'เชียงราย', 'เชียงใหม่', 'ตรัง', 'ตราด', 'ตาก', 'นครนายก', 'นครปฐม',
  'นครพนม', 'นครราชสีมา', 'นครศรีธรรมราช', 'นครสวรรค์', 'นนทบุรี', 'นราธิวาส', 'น่าน', 'บึงกาฬ',
  'บุรีรัมย์', 'ปทุมธานี', 'ประจวบคีรีขันธ์', 'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา', 'พะเยา',
  'พังงา', 'พัทลุง', 'พิจิตร', 'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์', 'แพร่', 'ภูเก็ต', 'มหาสารคาม',
  'มุกดาหาร', 'แม่ฮ่องสอน', 'ยโสธร', 'ยะลา', 'ร้อยเอ็ด', 'ระนอง', 'ระยอง', 'ราชบุรี', 'ลพบุรี',
  'ลำปาง', 'ลำพูน', 'เลย', 'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 'สตูล', 'สมุทรปราการ', 'สมุทรสงคราม',
  'สมุทรสาคร', 'สระแก้ว', 'สระบุรี', 'สิงห์บุรี', 'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์',
  'หนองคาย', 'หนองบัวลำภู', 'อ่างทอง', 'อำนาจเจริญ', 'อุดรธานี', 'อุตรดิตถ์', 'อุทัยธานี', 'อุบลราชธานี',
];

/** All 77 provinces, Bangkok first (most students start there) */
export const PROVINCES = [BANGKOK, ...OTHER_PROVINCES];

/** "เขตต้นทาง" (Bangkok only): the 50 districts, written "เขต" + name as in the sheet's examples */
export const BANGKOK_DISTRICTS = [
  'คลองเตย', 'คลองสาน', 'คลองสามวา', 'คันนายาว', 'จตุจักร', 'จอมทอง', 'ดอนเมือง', 'ดินแดง', 'ดุสิต',
  'ตลิ่งชัน', 'ทวีวัฒนา', 'ทุ่งครุ', 'ธนบุรี', 'บางกอกน้อย', 'บางกอกใหญ่', 'บางกะปิ', 'บางขุนเทียน',
  'บางเขน', 'บางคอแหลม', 'บางแค', 'บางซื่อ', 'บางนา', 'บางบอน', 'บางพลัด', 'บางรัก', 'บึงกุ่ม',
  'ปทุมวัน', 'ประเวศ', 'ป้อมปราบศัตรูพ่าย', 'พญาไท', 'พระโขนง', 'พระนคร', 'ภาษีเจริญ', 'มีนบุรี',
  'ยานนาวา', 'ราชเทวี', 'ราษฎร์บูรณะ', 'ลาดกระบัง', 'ลาดพร้าว', 'วังทองหลาง', 'วัฒนา', 'สวนหลวง',
  'สะพานสูง', 'สัมพันธวงศ์', 'สาทร', 'สายไหม', 'หนองแขม', 'หนองจอก', 'หลักสี่', 'ห้วยขวาง',
].map((name) => `เขต${name}`);

/** The office's naming rule is รหัสโครงการ_ชื่อโครงการ_รายงานการเดินทาง; the project code is still to come */
export const TRAVEL_CSV_NAME = 'รหัสโครงการ_SHIVIDNI PHEEDU_รายงานการเดินทาง.csv';

const csvCell = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/**
 * The travel report as CSV: header row + one row per registrant, exactly the sheet's columns.
 * Rows that don't pass cleanTravel (registered before these fields existed) are left out and counted.
 * Starts with a BOM so Excel opens the Thai text as UTF-8.
 */
export function travelCsv(rows: Record<string, unknown>[]) {
  const lines = [TRAVEL_COLUMNS.join(',')];
  let skipped = 0;
  for (const row of rows) {
    const t = cleanTravel({
      transportation: row.transportation,
      originProvince: row.origin_province,
      originDistrict: row.origin_district,
    });
    if ('error' in t) {
      skipped++;
      continue;
    }
    lines.push([t.transportation, t.origin_province, t.origin_district ?? ''].map(csvCell).join(','));
  }
  return { csv: `﻿${lines.join('\r\n')}\r\n`, skipped };
}

/**
 * Checks a registration's travel answers against the lists above.
 * Returns the cleaned values, or the name of the field that is wrong.
 */
export function cleanTravel(input: { transportation?: unknown; originProvince?: unknown; originDistrict?: unknown }) {
  const mode = String(input.transportation ?? '');
  const province = String(input.originProvince ?? '');
  const district = String(input.originDistrict ?? '');
  if (!(TRAVEL_MODES as readonly string[]).includes(mode)) return { error: 'transportation' as const };
  if (!PROVINCES.includes(province)) return { error: 'originProvince' as const };
  if (province === BANGKOK) {
    if (!BANGKOK_DISTRICTS.includes(district)) return { error: 'originDistrict' as const };
    return { transportation: mode, origin_province: province, origin_district: district };
  }
  return { transportation: mode, origin_province: province, origin_district: null };
}
