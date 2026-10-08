// Pick a boo: 5 questions, each answer points to one of 4 boos.
// Text comes from the Figma file (Main, iPhone 16 - 2 … 12).

export type BooId = 'love' | 'money' | 'study' | 'health';

export type Boo = {
  id: BooId;
  /** Saved to registrations.ghost_result and shown as the result title */
  name: string;
  /** Result card art (1024×1536 Figma export, resized) */
  card: string;
  /** Ink for the letter's greeting and closing line: the card's colour, dark enough for cream paper */
  ink: string;
  /** The Figma message split for the "magic paper" letter. Every letter opens with "แฮ่ !" */
  letter: { paragraphs: string[]; closing: string };
};

export const BOOS: Record<BooId, Boo> = {
  love: {
    id: 'love',
    name: 'boo-pid',
    card: '/pick-a-boo/cards/love.webp',
    ink: '#c2185b',
    letter: {
      paragraphs: [
        'คืนนี้แสงจันทร์สีชมพูกำลังส่องมาที่หัวใจเธอ ความรู้สึกดี ๆ อาจกำลังค่อย ๆ เติบโตจากใครบางคนที่อยู่ใกล้ตัว',
        'อย่าเพิ่งรีบตัดสินใครตั้งแต่แรก หากมีคนคุยอยู่ ความสัมพันธ์มีโอกาสชัดเจนขึ้นเรื่อย ๆ',
      ],
      closing: 'ระวังไว้ให้ดี... คืนนี้สิ่งที่น่ากลัวที่สุด อาจไม่ใช่ผี แต่เป็นการเผลอตกหลุมรักใครบางคนเข้าเต็ม ๆ !',
    },
  },
  money: {
    id: 'money',
    name: 'boo-ming cash',
    card: '/pick-a-boo/cards/money.webp',
    ink: '#9a6700',
    letter: {
      paragraphs: [
        'ในที่สุดก็เจอคนที่จักรวาลกำลังเตรียม ส่งโชคเรื่องเงินมาให้!',
        'ช่วงนี้ดวงการเงินและการเก็บออมกำลังสดใส เงินก้อนเล็ก ๆ ที่เก็บอย่างสม่ำเสมอมีโอกาสเติบโต จนกลายเป็นเงินก้อนใหญ่',
      ],
      closing: 'คืนนี้ขอสาปให้เงินเข้าบัญชีแล้วเหนียวแน่น ไม่หายวับไปง่าย ๆ มีแต่เพิ่มพูนจนกระเป๋าตุง !',
    },
  },
  study: {
    id: 'study',
    name: 'boo-kworm',
    card: '/pick-a-boo/cards/study.webp',
    ink: '#5b47c9',
    letter: {
      paragraphs: [
        'เราคือตัวเธอในอนาคตที่แวะกลับมาบอกว่า เรื่องที่กำลังกังวลอยู่ตอนนี้ เดี๋ยวเธอก็ผ่านมันไปได้ !',
        'เกรดไม่ได้เป็นตัวกำหนดความสามารถทั้งหมดของเธอ ขอให้กล้าลองสิ่งใหม่ ๆ ก้าวออกจาก Comfort Zone และเชื่อในตัวเอง',
      ],
      closing: 'เพราะตัวเธอในอนาคตกำลังยิ้ม และขอบคุณความกล้าของเธอในวันนี้อยู่ !',
    },
  },
  health: {
    id: 'health',
    name: 'boo-ster',
    card: '/pick-a-boo/cards/health.webp',
    ink: '#c2410c',
    letter: {
      paragraphs: [
        'มองแสงสีส้มอบอุ่นจากตะเกียงฟักทองนี้สิ เราขอให้มันช่วยเผาความเหนื่อยล้า และความกังวลให้หายไป',
        'ช่วงนี้ขอให้เธอได้พักใจ มีแรงกลับมาทำสิ่งที่ชอบ กินอร่อย นอนเต็มอิ่ม และมีพลังสดใสอีกครั้ง',
      ],
      closing: 'ขอให้ทั้งกายและใจแข็งแรง เปล่งประกายเหมือนแสงตะเกียงฟักทองในคืนฮาโลวีน !',
    },
  },
};

export type Question = { text: string; options: { text: string; boo: BooId }[] };

export const QUESTIONS: Question[] = [
  {
    text: 'ถ้าวันหนึ่งเรากลายเป็นผี คุณอยากให้คนจดจำคุณในฐานะผีแบบไหน',
    options: [
      { text: 'ผีที่อบอุ่นและใจดีที่ใคร ๆ ก็อยากอยู่ใกล้', boo: 'love' },
      { text: 'ผีที่ประสบความสำเร็จและใช้ชีวิตที่มั่นคง', boo: 'money' },
      { text: 'ผีเก่งที่ใคร ๆ ก็ชื่นชม', boo: 'study' },
      { text: 'ผีที่เต็มไปด้วยพลังบวก', boo: 'health' },
    ],
  },
  {
    text: 'เมื่อต้องเดินเข้าบ้านผีสิง คุณจะเข้าไปกับใคร',
    options: [
      { text: 'คนรัก จะได้มีคนกอดเมื่อตกใจ', boo: 'love' },
      { text: 'เข้าคนเดียว เหมารอบไปเลย', boo: 'money' },
      { text: 'กลุ่มเพื่อนติวหนังสือ มีคนช่วยกันคิดหาทางออก', boo: 'study' },
      { text: 'หมอผี ปลอดภัยไว้ก่อนเวลาผีหลอก', boo: 'health' },
    ],
  },
  {
    text: 'เดินไปเรื่อย ๆ แล้วพบกับข้อความสีแดงเขียนบนผนัง คุณคิดว่าเป็นคำเตือนเรื่องอะไร',
    options: [
      { text: '“ระวังหัวใจของคุณจะถูกขโมย”', boo: 'love' },
      { text: '“โอกาสรับทรัพย์ก้อนใหญ่กำลังมาถึง”', boo: 'money' },
      { text: '“ความพยายามในการเรียนและการงานจะไม่สูญเปล่า”', boo: 'study' },
      { text: '“อย่าลืมพักผ่อนรักษาสุขภาพตัวเองด้วย”', boo: 'health' },
    ],
  },
  {
    text: 'ผีเจ้าบ้านปรากฏตัวออกมา ! คุณคิดว่าผีตัวนั้นอยู่ในรูปลักษณ์ไหน',
    options: [
      { text: 'ผีผ้าคลุมดุ๊กดิ๊ก ถือตะเกียงลอยไปลอยมา ให้คุณไม่สะดุดอะไรในความมืด', boo: 'health' },
      { text: 'แวมไพร์ แต่งตัวหรูหรา สวมเครื่องประดับระยิบระยับ', boo: 'money' },
      { text: 'แม่มดจิ๋วเจ้าปัญญา ในมือถือตำราเวทมนตร์', boo: 'study' },
      { text: 'ผีเจ้าสาว ในมือถือดอกไม้', boo: 'love' },
    ],
  },
  {
    text: 'ผีเจ้าบ้านยื่นกุญแจวิเศษ 4 ดอกให้คุณ พร้อมบอกว่า “เลือกให้ดี…กุญแจนี้จะพาคุณไปพบสิ่งที่กำลังจะเกิดขึ้น” คุณจะเลือกกุญแจดอกไหน',
    options: [
      { text: 'กุญแจที่มีกลิ่นน้ำหอมจาง ๆ ติดอยู่', boo: 'love' },
      { text: 'กุญแจที่มีประกายระยิบระยับทุกครั้งที่ขยับ', boo: 'money' },
      { text: 'กุญแจที่มีตัวเลขเล็ก ๆ เปลี่ยนไปเรื่อย ๆ บนด้าม', boo: 'study' },
      { text: 'กุญแจที่มีหยดน้ำเกาะอยู่ตลอดเวลา ทั้งที่รอบ ๆ แห้งสนิท', boo: 'health' },
    ],
  },
];

// Question 3 names the four outcomes outright, so it breaks ties
const TIE_BREAKER = 2;

/** The boo picked most often; a tie goes to the question-3 answer, then to question order. */
export function pickBoo(answers: BooId[]): Boo {
  const counts = new Map<BooId, number>();
  for (const a of answers) counts.set(a, (counts.get(a) ?? 0) + 1);
  const top = Math.max(...counts.values());
  const tied = answers.filter((a) => counts.get(a) === top);
  const winner = tied.includes(answers[TIE_BREAKER]) ? answers[TIE_BREAKER] : tied[0];
  return BOOS[winner];
}

/** Saved result → boo. Results from the old 7-ghost quiz return null (treated as not played). */
export function booByName(name: string | null | undefined): Boo | null {
  return Object.values(BOOS).find((b) => b.name === name) ?? null;
}
