import QRCode from 'qrcode';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';

// Booking emails. Every one goes to a single person; a personal code (and its QR)
// only ever goes to its owner. Callers send these after the response with after(),
// so a failed email never undoes a booking: the code still works on My booking.

type Person = { full_name: string; email: string; code?: string };

export type RoundInfo = {
  activity_id: string;
  activity_name: string;
  room_name: string | null;
  round_no: number;
  starts_at: string;
  ends_at: string;
  checkin_opens_at: string;
  checkin_closes_at: string;
};

const LOCATION = 'อาคารวิศวฯ 100 ปี คณะวิศวกรรมศาสตร์';
const HAUNTED_POINT = 'ใต้อาคารวิศวฯ 100 ปี';
const TZ = 'Asia/Bangkok';

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000')
  );
}

// Booking pages live at /escape-room, /haunted-house.
const activityUrl = (activityId: string) => `${siteUrl()}/${activityId.replace(/_/g, '-')}`;

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
const date = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

// Names and room text come from users and staff: never put them in HTML raw.
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function roundInfo(roundId: string): Promise<RoundInfo | null> {
  const { data: r, error } = await supabaseAdmin
    .from('booking_round_times')
    .select('activity_id, round_no, starts_at, ends_at, checkin_opens_at, checkin_closes_at')
    .eq('id', roundId)
    .maybeSingle();
  if (error || !r) {
    console.error('Booking email: round lookup failed', error);
    return null;
  }
  const { data: a } = await supabaseAdmin
    .from('booking_activities')
    .select('name, room_name')
    .eq('id', r.activity_id)
    .maybeSingle();
  return { ...r, activity_name: a?.name ?? r.activity_id, room_name: a?.room_name ?? null };
}

function roundBlock(r: RoundInfo) {
  const rows: [string, string][] = [
    ['กิจกรรม', r.room_name ? `${r.activity_name} (${r.room_name})` : r.activity_name],
    ['วันที่', date(r.starts_at)],
    ['รอบ', `รอบที่ ${r.round_no} เล่น ${time(r.starts_at)}–${time(r.ends_at)} น.`],
    ['เช็กอินที่บูธ', `${time(r.checkin_opens_at)}–${time(r.checkin_closes_at)} น.`],
    ['สถานที่', LOCATION],
  ];
  return `<table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:15px">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 0;color:#4a3167;font-weight:bold;width:120px;vertical-align:top">${k}</td><td style="padding:8px 0;color:#2d2d2d">${esc(v)}</td></tr>`
    )
    .join('')}</table>`;
}

const checkinRule = `<div style="background:#f5eee6;border-left:4px solid #ea7b29;border-radius:5px;padding:14px 18px;margin:20px 0;font-size:14px;color:#2d2d2d">
ยืนยันสิทธิ์ = เช็กอินที่บูธภายในเวลาเช็กอินของรอบ<br>
มาไม่ทันถือว่าสละสิทธิ์ ที่นั่งจะถูกปล่อยให้ walk-in<br>
ยังมาเล่นแบบ walk-in ได้ถ้ารอบยังมีที่</div>`;

function codeBlock(code: string) {
  return `<div style="text-align:center;margin:24px 0;background:#f9f9f9;padding:24px;border-radius:8px;border:2px solid #4a3167">
<p style="margin:0;color:#666666;font-size:14px">รหัสการจองส่วนตัวของคุณ</p>
<p style="margin:6px 0 0;font-size:28px;font-weight:bold;letter-spacing:2px;color:#24033a">${esc(code)}</p>
<img src="cid:qrcode" alt="QR สำหรับเช็กอิน" style="width:240px;max-width:100%;height:auto;display:block;margin:16px auto 8px">
<p style="margin:0;color:#666666;font-size:13px">QR นี้ใช้เช็กอินได้คนเดียว อย่าส่งรหัสนี้ต่อให้คนอื่น</p>
</div>`;
}

function layout(name: string, heading: string, body: string, activityId: string) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:20px;background:#f5f5f5;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#2d2d2d;line-height:1.6">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden">
<div style="text-align:center;background:#24033a;color:#bbd03c;font-size:26px;font-weight:bold;padding:26px 20px">SHIVIDNI PHEEDU</div>
<div style="padding:32px 28px">
<h2 style="color:#ea7b29;margin:0 0 12px;font-size:22px">${esc(heading)}</h2>
<p style="margin:0 0 12px;font-size:16px">สวัสดีคุณ ${esc(name)}</p>
${body}
<p style="margin:24px 0 0;text-align:center"><a href="${activityUrl(activityId)}" style="display:inline-block;background:#ea7b29;color:#24033a;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold">ดูการจองของฉัน (My booking)</a></p>
</div>
<div style="text-align:center;color:#666666;padding:18px 28px;font-size:13px;background:#f9f9f9;border-top:1px solid #e0e0e0">
อีเมลนี้ส่งอัตโนมัติ ถ้าไม่เห็นอีเมลจากเรา ให้เช็กโฟลเดอร์ Junk<br>
Instagram: <a href="https://instagram.com/shividni.pheedu" style="color:#ea7b29;text-decoration:none">@shividni.pheedu</a>
</div></div></body></html>`;
}

async function qrAttachment(code: string) {
  const dataUrl = await QRCode.toDataURL(code, {
    width: 400,
    margin: 2,
    color: { dark: '#24033a', light: '#f5eee6' },
  });
  // Inline attachment (cid), not a data URI: Gmail and Outlook hide data URIs.
  return [{ filename: 'qrcode.png', content: dataUrl.split(',')[1], cid: 'qrcode', encoding: 'base64' }];
}

async function send(to: Person, subject: string, heading: string, body: string, r: RoundInfo, code?: string) {
  const result = await sendEmail({
    from: 'booking',
    to: to.email,
    subject: `${subject} (${r.activity_name})`,
    html: layout(to.full_name, heading, body, r.activity_id),
    attachments: code ? await qrAttachment(code) : undefined,
  });
  if (!result.success) console.error(`Booking email "${subject}" failed for one recipient`);
}

// Runs every send and never throws, so one bad address can't stop the rest.
export async function sendAll(jobs: Promise<unknown>[]) {
  const results = await Promise.allSettled(jobs);
  for (const r of results) if (r.status === 'rejected') console.error('Booking email error:', r.reason);
}

// ---- The emails ----

export function bookingConfirmed(p: Person & { code: string }, r: RoundInfo, isLeader: boolean) {
  return send(
    p,
    'ยืนยันการจอง',
    'จองสำเร็จแล้ว!',
    `<p style="font-size:16px">${isLeader ? 'การจองของทีมคุณเสร็จเรียบร้อย' : 'หัวหน้าทีมจองรอบนี้ให้คุณแล้ว'} เพื่อนในทีมแต่ละคนได้รับอีเมลพร้อมรหัสและ QR ของตัวเอง</p>
${roundBlock(r)}${codeBlock(p.code)}${checkinRule}
<p style="font-size:14px;color:#666666">ยกเลิกที่นั่งของตัวเองได้ถึงเวลาปิดเช็กอินของรอบ (${time(r.checkin_closes_at)} น.) ที่หน้า My booking ด้วยรหัสนี้</p>`,
    r,
    p.code
  );
}

// Haunted House: one person per booking, no changes or cancelling, register at the point
function hauntedBlock(r: RoundInfo) {
  const rows: [string, string][] = [
    ['กิจกรรม', 'บ้านผีสิง (Haunted House)'],
    ['วันที่', date(r.starts_at)],
    ['รอบ', `รอบที่ ${r.round_no} เล่น ${time(r.starts_at)}–${time(r.ends_at)} น.`],
    ['ลงทะเบียน', `${time(r.checkin_opens_at)}–${time(r.checkin_closes_at)} น.`],
    ['จุดลงทะเบียน', HAUNTED_POINT],
  ];
  return `<table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:15px">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 0;color:#7a0a19;font-weight:bold;width:120px;vertical-align:top">${k}</td><td style="padding:8px 0;color:#2d2d2d">${esc(v)}</td></tr>`
    )
    .join('')}</table>`;
}

export function hauntedConfirmed(p: Person & { code: string }, r: RoundInfo) {
  return send(
    p,
    'ยืนยันการจองบ้านผีสิง',
    'จองบ้านผีสิงสำเร็จแล้ว',
    `<p style="font-size:16px">การจองลงทะเบียนเข้าร่วมกิจกรรมบ้านผีสิงของท่านได้เสร็จสมบูรณ์แล้ว กรุณามาลงทะเบียนตามเวลาที่กำหนด และโปรดมาก่อนเวลาเล่นกิจกรรมขั้นต่ำ 10 นาที ไม่เช่นนั้นจะถือว่าสละสิทธิ์</p>
${hauntedBlock(r)}${codeBlock(p.code)}
<p style="font-size:14px;color:#666666">การจองนี้แก้ไขข้อมูล เปลี่ยนรอบ หรือยกเลิกไม่ได้</p>`,
    r,
    p.code
  );
}

export function roundChanged(p: Person & { code: string }, r: RoundInfo) {
  return send(
    p,
    'เปลี่ยนรอบแล้ว',
    'หัวหน้าทีมย้ายรอบของทีมแล้ว',
    `<p style="font-size:16px">รอบใหม่ของคุณอยู่ด้านล่าง รหัสและ QR เดิมยังใช้ได้</p>${roundBlock(r)}${codeBlock(p.code)}${checkinRule}`,
    r,
    p.code
  );
}

export function seatCancelled(p: Person, r: RoundInfo) {
  return send(
    p,
    'ยกเลิกที่นั่งแล้ว',
    'ยกเลิกที่นั่งของคุณแล้ว',
    `<p style="font-size:16px">ที่นั่งของคุณในรอบนี้ถูกยกเลิกแล้ว รหัสเดิมใช้เช็กอินไม่ได้อีก ถ้ายังเปิดรับจอง จองรอบใหม่ได้</p>${roundBlock(r)}`,
    r
  );
}

export function teamCancelled(p: Person, r: RoundInfo) {
  return send(
    p,
    'ทีมของคุณถูกยกเลิก',
    'ทีมของคุณถูกยกเลิก',
    `<p style="font-size:16px">หัวหน้าทีมยกเลิกการจองของทั้งทีมแล้ว ที่นั่งของคุณในรอบนี้ถูกยกเลิก ถ้ายังเปิดรับจอง จองรอบใหม่ได้</p>${roundBlock(r)}`,
    r
  );
}

export function removedFromTeam(p: Person, r: RoundInfo) {
  return send(
    p,
    'คุณถูกนำออกจากทีม',
    'คุณถูกนำออกจากทีม',
    `<p style="font-size:16px">หัวหน้าทีมนำคุณออกจากทีมแล้ว ที่นั่งของคุณในรอบนี้ถูกยกเลิก ถ้ายังเปิดรับจอง จองรอบอื่นเองได้</p>${roundBlock(r)}`,
    r
  );
}

// Sent shortly before a round's check-in opens (see /api/booking/remind), with the QR to show at the desk
export function checkinReminder(p: Person & { code: string }, r: RoundInfo) {
  const opens = time(r.checkin_opens_at);
  const closes = time(r.checkin_closes_at);
  if (r.activity_id === 'haunted_house') {
    return send(
      p,
      `ใกล้ถึงเวลาลงทะเบียน รอบที่ ${r.round_no}`,
      `เปิดลงทะเบียน ${opens} น.`,
      `<p style="font-size:16px">ลงทะเบียนรอบที่ ${r.round_no} ได้ ${opens}–${closes} น. ที่${HAUNTED_POINT}</p>
<p style="font-size:16px;font-weight:bold;color:#b3261e">มาช้ากว่า ${closes} น. ถือว่าสละสิทธิ์ทุกกรณี</p>
${hauntedBlock(r)}${codeBlock(p.code)}`,
      r,
      p.code
    );
  }
  return send(
    p,
    `ใกล้ถึงเวลาเช็กอิน รอบที่ ${r.round_no}`,
    `เปิดเช็กอิน ${opens} น.`,
    `<p style="font-size:16px">เช็กอินรอบที่ ${r.round_no} ที่บูธได้ ${opens}–${closes} น.</p>
<p style="font-size:16px;font-weight:bold;color:#b3261e">มาไม่ทัน ${closes} น. ที่นั่งจะถูกปล่อยให้ walk-in</p>
${roundBlock(r)}${codeBlock(p.code)}`,
    r,
    p.code
  );
}


export function newLeader(p: Person, r: RoundInfo) {
  return send(
    p,
    'คุณเป็นหัวหน้าทีมคนใหม่',
    'คุณเป็นหัวหน้าทีมคนใหม่',
    `<p style="font-size:16px">หัวหน้าทีมเดิมยกเลิกที่นั่งแล้ว ตอนนี้คุณเป็นหัวหน้าทีม ย้ายรอบ ยกเลิกทั้งทีม หรือนำสมาชิกออกได้ที่หน้า My booking ด้วยรหัสของคุณ</p>${roundBlock(r)}`,
    r
  );
}

export function memberCancelled(leader: Person, memberName: string, r: RoundInfo) {
  return send(
    leader,
    'สมาชิกยกเลิกที่นั่ง',
    'สมาชิกในทีมยกเลิกที่นั่ง',
    `<p style="font-size:16px">${esc(memberName)} ยกเลิกที่นั่งของตัวเองในรอบนี้แล้ว คนอื่นในทีมยังเล่นได้ตามเดิม</p>${roundBlock(r)}`,
    r
  );
}
