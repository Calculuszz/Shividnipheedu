// Shop layout from "SHIVIDNI - Directory" (the organisers' plan, 1920x1080 artboard).
// Every position below is in that artboard's coordinates, so booths sit exactly where the plan puts them.

export type ShopKind = 'food' | 'dessert' | 'drink' | 'other';

export const KINDS: Record<ShopKind, { label: string; fill: string }> = {
  food: { label: 'ร้านอาหาร', fill: '#ea7b29' },
  dessert: { label: 'ร้านของหวาน', fill: '#f4a6c6' },
  drink: { label: 'ร้านเครื่องดื่ม', fill: '#6fc3e8' },
  other: { label: 'ร้านค้าอื่น ๆ', fill: '#bbd03c' },
};

export type Shop = { no: number; name: string; kind: ShopKind; x: number; y: number };

// Names exactly as the organisers wrote them. x, y = top-left of the 36x36 booth.
export const SHOPS: Shop[] = [
  { no: 1, name: 'Merchandise', kind: 'other', x: 1078, y: 469 },
  { no: 2, name: 'LakornVidva', kind: 'other', x: 1033, y: 469 },
  { no: 3, name: 'ผีไปรักเต๋อ in Dubai', kind: 'dessert', x: 988, y: 469 },
  { no: 4, name: 'Shi เมย์ โจ ได๋', kind: 'food', x: 943, y: 469 },
  { no: 5, name: 'SHIVIDNi yark mee ...', kind: 'drink', x: 1033, y: 382 },
  { no: 6, name: 'ผู้ชายขาย “เกี๊ยว”', kind: 'food', x: 988, y: 382 },
  { no: 7, name: 'Boo-Crepe👻🍬', kind: 'dessert', x: 943, y: 382 },
  { no: 8, name: 'เฟรนช์ฟรายเด้ง!', kind: 'food', x: 899, y: 382 },
  { no: 9, name: 'Bood Juice', kind: 'drink', x: 681, y: 382 },
  { no: 10, name: 'คราเค่นย่าง ไ ฟ น ร ก', kind: 'food', x: 636, y: 382 },
  { no: 11, name: 'ThatSmore ✧', kind: 'dessert', x: 627, y: 459 },
  { no: 12, name: 'nomsod', kind: 'drink', x: 583, y: 459 },
  { no: 13, name: 'Hallowdeng', kind: 'food', x: 538, y: 459 },
  { no: 14, name: 'กล้วยช็อก!!! กล้วยมากอดเค้าเลย งื้ออ', kind: 'dessert', x: 493, y: 459 },
  { no: 15, name: 'ผีรักทุกนาเธอ', kind: 'drink', x: 447, y: 459 },
  { no: 16, name: 'YUMMY BBA', kind: 'food', x: 402, y: 459 },
  { no: 17, name: 'Snap & Smile', kind: 'other', x: 357, y: 459 },
  { no: 18, name: 'ไม่ใช่แฟนทอดแทนไม่ได้', kind: 'dessert', x: 627, y: 766 },
  { no: 19, name: 'ล่าหมา', kind: 'food', x: 583, y: 766 },
  { no: 20, name: 'Wiz & Whirl', kind: 'drink', x: 538, y: 766 },
  { no: 21, name: 'GoongGrill (กุ้งกริลล์)', kind: 'food', x: 493, y: 766 },
  { no: 22, name: 'Toast ที', kind: 'dessert', x: 447, y: 766 },
];

/** Booth spaces with no shop */
export const EMPTY_BOOTHS = [[726, 382], [771, 382], [312, 459], [1123, 469], [1168, 469]] as const;
/** Bin sets (red, yellow, green): centre of the red one */
export const BINS = [[1155, 440], [713, 780]] as const;
/** Single green dots on the plan */
export const DOTS = [[653, 360], [329, 518], [1035, 532], [426, 785]] as const;
/** The plan's frame in the artboard (the SVG viewBox) */
export const VIEWBOX = '230 210 1060 705';
