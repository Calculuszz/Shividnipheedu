'use client';

import { useState } from 'react';
import { staff } from '@/lib/bookingClient';
import { formatTime, formatTimeRange } from '@/lib/bookingTime';
import type { StaffRound } from '@/lib/bookingTypes';
import type { StaffWords } from '@/lib/staffWords';
import { notArrived, phaseChip, phaseLabel, roundName, roundPhase } from '@/lib/staffRounds';
import type { StaffCtx } from './StaffApp';
import { Chip, Icon, Notice, Svg, card } from './ui';
import { staffFail } from './useStaffRounds';

const toThaiTime = (iso: unknown) =>
  iso ? new Date(String(iso)).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' }) : '';

const PLAYER_STATUS_TH: Record<string, string> = {
  booked: 'จองไว้ (ยังไม่มา)',
  checked_in: 'เช็กอินแล้ว',
  released: 'ถูกปล่อย (ไม่มาเช็กอิน)',
  cancelled: 'ยกเลิกเอง',
  removed: 'หัวหน้าทีมนำออก',
};
const WALKIN_STATUS_TH: Record<string, string> = { checked_in: 'เข้าเล่นแล้ว', queued: 'รอคิว', left: 'ออกจากคิว' };

// Haunted House words for the same statuses (its export goes to the house's own team)
const HAUNTED_PLAYER_STATUS: Record<string, string> = { booked: 'ยังไม่มา', checked_in: 'ลงทะเบียนแล้ว', released: 'สละสิทธิ์' };
const HAUNTED_WALKIN_STATUS: Record<string, string> = { checked_in: 'ลงทะเบียนแล้ว', queued: 'รอคิว' };

type Row = Record<string, unknown>;

/**
 * Haunted House: one sheet per round, booked people first, then walk-ins, as the house's
 * team asked for ("รายชื่อแบ่งเป็นรอบๆ").
 */
function addRoundSheets(
  workbook: import('exceljs').Workbook,
  rounds: StaffRound[],
  players: Row[],
  walkins: Row[],
  style: (sheet: import('exceljs').Worksheet) => void
) {
  for (const r of rounds) {
    // Sheet names can't hold ":" so 16:40 is written 16.40
    const sheet = workbook.addWorksheet(`รอบที่ ${r.round_no} เวลา ${formatTime(r.starts_at).replace(':', '.')}`, {
      views: [{ state: 'frozen', ySplit: 1 }],
    });
    sheet.columns = [
      { header: 'ลำดับ', key: 'no', width: 7 },
      { header: 'ชื่อ-นามสกุล', key: 'full_name', width: 28 },
      { header: 'ชื่อเล่น', key: 'nickname', width: 12 },
      { header: 'รหัสนิสิต', key: 'student_id', width: 14 },
      { header: 'คณะ', key: 'faculty', width: 26 },
      { header: 'ชั้นปี', key: 'year', width: 14 },
      { header: 'เบอร์โทร', key: 'phone', width: 14 },
      { header: 'อีเมล', key: 'email', width: 30 },
      { header: 'ประเภท', key: 'kind', width: 10 },
      { header: 'สถานะ', key: 'status', width: 16 },
      { header: 'เวลาลงทะเบียน', key: 'checked_in_at', width: 22 },
    ];
    let no = 0;
    for (const p of players.filter((x) => x.round_no === r.round_no && String(x.live_status) in HAUNTED_PLAYER_STATUS)) {
      sheet.addRow({
        ...p,
        no: ++no,
        student_id: String(p.student_id ?? ''),
        kind: 'จอง',
        status: HAUNTED_PLAYER_STATUS[String(p.live_status)],
        checked_in_at: toThaiTime(p.checked_in_at),
      });
    }
    for (const x of walkins.filter((x) => x.round_id === r.id && String(x.status) in HAUNTED_WALKIN_STATUS)) {
      sheet.addRow({
        ...x,
        no: ++no,
        student_id: String(x.student_id ?? ''),
        kind: 'walk-in',
        status: HAUNTED_WALKIN_STATUS[String(x.status)],
        checked_in_at: toThaiTime(x.checked_in_at),
      });
    }
    style(sheet);
  }
}

export default function DashboardTab({ ctx }: { ctx: StaffCtx }) {
  const { rounds, now, updatedAt, words: w } = ctx;
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const live = rounds.filter((r) => !r.closed);
  const checkinNow = live.filter((r) => roundPhase(r, now) === 'checkin');
  const queued = live.filter((r) => r.walkin_queued > 0);
  const sum = (pick: (r: StaffRound) => number, list = live) => list.reduce((n, r) => n + pick(r), 0);

  const exportExcel = async () => {
    setExporting(true);
    setExportError('');
    try {
      const { players, walkins } = await staff.exportAll();
      const roundNo = new Map(rounds.map((r) => [r.id, r.round_no]));
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const style = (sheet: import('exceljs').Worksheet) => {
        const header = sheet.getRow(1);
        header.font = { bold: true, color: { argb: 'FFF5EEE6' } };
        header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A3167' } };
        sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };
      };

      if (w.solo) addRoundSheets(workbook, rounds, players, walkins, style);
      else {
        const booked = workbook.addWorksheet('จองออนไลน์', { views: [{ state: 'frozen', ySplit: 1 }] });
        booked.columns = [
          { header: 'รอบที่', key: 'round_no', width: 8 },
          { header: 'เวลาเล่น', key: 'starts_at', width: 10 },
          { header: 'ทีม (รหัสการจอง)', key: 'booking_id', width: 12 },
          { header: 'ลำดับในทีม', key: 'position', width: 10 },
          { header: 'หัวหน้าทีม', key: 'is_leader', width: 10 },
          { header: 'รหัสนิสิต', key: 'student_id', width: 14 },
          { header: 'ชื่อ-นามสกุล', key: 'full_name', width: 28 },
          { header: 'เบอร์โทร', key: 'phone', width: 14 },
          { header: 'อีเมล', key: 'email', width: 30 },
          { header: 'สถานะ', key: 'live_status', width: 22 },
          { header: 'เวลาเช็กอิน', key: 'checked_in_at', width: 22 },
          { header: 'เวลายกเลิก', key: 'cancelled_at', width: 22 },
          { header: 'เวลาจอง', key: 'created_at', width: 22 },
          { header: 'หมายเหตุทีม', key: 'notes', width: 36 },
        ];
        for (const p of players) {
          booked.addRow({
            ...p,
            starts_at: p.starts_at ? formatTime(String(p.starts_at)) : '',
            booking_id: String(p.booking_id ?? '').slice(0, 8),
            is_leader: p.is_leader ? 'ใช่' : '',
            student_id: String(p.student_id ?? ''),
            live_status: PLAYER_STATUS_TH[String(p.live_status)] ?? p.live_status,
            checked_in_at: toThaiTime(p.checked_in_at),
            cancelled_at: toThaiTime(p.cancelled_at),
            created_at: toThaiTime(p.created_at),
          });
        }
        style(booked);

        const walk = workbook.addWorksheet('Walk-in', { views: [{ state: 'frozen', ySplit: 1 }] });
        walk.columns = [
          { header: 'รอบที่', key: 'round_no', width: 8 },
          { header: 'คิวที่', key: 'queue_no', width: 8 },
          { header: 'รหัสนิสิต', key: 'student_id', width: 14 },
          { header: 'ชื่อ-นามสกุล', key: 'full_name', width: 28 },
          { header: 'เบอร์โทร', key: 'phone', width: 14 },
          { header: 'สถานะ', key: 'status', width: 14 },
          { header: 'เวลามาถึง', key: 'created_at', width: 22 },
          { header: 'เวลาเข้าเล่น', key: 'checked_in_at', width: 22 },
        ];
        for (const x of walkins) {
          walk.addRow({
            ...x,
            round_no: roundNo.get(String(x.round_id)) ?? '',
            student_id: String(x.student_id ?? ''),
            status: WALKIN_STATUS_TH[String(x.status)] ?? x.status,
            created_at: toThaiTime(x.created_at),
            checked_in_at: toThaiTime(x.checked_in_at),
          });
        }
        style(walk);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const stamp = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }).slice(0, 16).replace(/[ :]/g, '-');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SHIVIDNI-PHEEDU-${ctx.activity.replace('_', '-')}-${stamp}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError(`ดาวน์โหลดไม่สำเร็จ: ${staffFail(e)}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex flex-1 flex-col gap-0.5">
          <h1 className="text-2xl font-bold">ภาพรวม</h1>
          <span className="inline-flex items-center gap-1.5 text-[13px] text-halloween-gray">
            <span className="h-2 w-2 rounded-full bg-halloween-moon" aria-hidden="true" />
            อัปเดตเองทุก 5 วินาที{updatedAt && ` (ล่าสุด ${new Date(updatedAt).toLocaleTimeString('en-GB', { timeZone: 'Asia/Bangkok' })})`}
          </span>
        </div>
        <button
          type="button"
          onClick={exportExcel}
          disabled={exporting}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border-2 border-halloween-purple px-3 text-sm font-bold hover:bg-halloween-purple/40 disabled:opacity-60"
        >
          <Svg size={18}>{Icon.download}</Svg>
          {exporting ? 'กำลังเตรียมไฟล์…' : w.solo ? 'Export รายชื่อแยกรอบ' : 'Export Excel'}
        </button>
      </div>
      {w.solo && (
        <p className="-mt-1 text-[13px] leading-relaxed text-halloween-gray">
          ไฟล์ Excel 1 sheet ต่อรอบ มีเบอร์และอีเมลของนิสิต
          <br />
          ส่งเฉพาะทีมบ้านผีสิง ห้ามโพสต์ในกลุ่มใหญ่
        </p>
      )}
      {exportError && <Notice>{exportError}</Notice>}

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Tile label="มาแล้วทั้งหมด" value={`${sum((r) => r.checked_in + r.walkin_in)} คน`} border="border-halloween-moon">
          จองไว้ {sum((r) => r.checked_in)} คน
          <br />
          walk-in {sum((r) => r.walkin_in)} คน
        </Tile>
        <Tile
          label="ยังไม่มา"
          value={`${sum(notArrived, checkinNow)} คน`}
          border={checkinNow.length ? 'border-halloween-orange' : undefined}
          valueClass={checkinNow.length ? 'text-halloween-orange' : undefined}
        >
          {checkinNow.length
            ? checkinNow.map((r) => (
                <span key={r.id} className="block">
                  {roundName(r)} ปิด{w.checkin} {formatTime(r.checkin_closes_at)}
                </span>
              ))
            : `ตอนนี้ไม่มีรอบไหนเปิด${w.checkin}`}
        </Tile>
        <Tile label="คิว walk-in" value={`${sum((r) => r.walkin_queued)} คน`}>
          {queued.length
            ? queued.map((r) => (
                <span key={r.id} className="block">
                  {roundName(r)} รอ {r.walkin_queued} คน
                </span>
              ))
            : 'ไม่มีคิว'}
        </Tile>
        <Tile label="จองออนไลน์" value={String(sum((r) => r.online_taken))} suffix={`จาก ${sum((r) => r.online_cap)}`}>
          {w.released} {sum((r) => r.released)} คน
          {!w.solo && (
            <>
              <br />
              ยกเลิกหลังปิดจอง {sum((r) => r.cancelled_late)} คน
            </>
          )}
        </Tile>
      </div>

      <h2 className="mt-1.5 text-lg font-bold">รายรอบ</h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rounds.map((r) => (
          <RoundCard key={r.id} r={r} now={now} w={w} />
        ))}
      </div>

      <p className="text-[13px] leading-relaxed text-halloween-gray">
        {w.solo
          ? `ที่ว่าง walk-in = ที่ walk-in ประจำรอบ + คนที่${w.released} − walk-in ที่เข้าแล้ว`
          : 'ที่ว่าง walk-in = ที่ walk-in ประจำรอบ + คนที่ถูกปล่อย + คนที่ยกเลิกหลังปิดจอง − walk-in ที่เข้าแล้ว'}
        <br />
        “—” = ยังไม่รู้ จะรู้หลังปิด{w.checkin}ของรอบนั้น
      </p>
    </div>
  );
}

function Tile({
  label,
  value,
  suffix,
  border,
  valueClass = '',
  children,
}: {
  label: string;
  value: string;
  suffix?: string;
  border?: string;
  valueClass?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-0.5 rounded-xl border-2 bg-halloween-charcoal px-3 py-2.5 ${border ?? 'border-halloween-purple'}`}>
      <span className="text-[13px] text-halloween-gray">{label}</span>
      <b className={`text-[28px] leading-tight ${valueClass}`}>
        {value}
        {suffix && <small className="ml-1 text-[15px] font-normal text-halloween-gray">{suffix}</small>}
      </b>
      <span className="text-[13px] leading-normal text-halloween-gray">{children}</span>
    </div>
  );
}

function Stat({ value, label, className = '' }: { value: number | string; label: string; className?: string }) {
  return (
    <div className="flex flex-col items-center">
      <b className={`text-lg ${className}`}>{value}</b>
      <span className="text-[13px] text-halloween-gray">{label}</span>
    </div>
  );
}

function RoundCard({ r, now, w }: { r: StaffRound; now: number; w: StaffWords }) {
  const phase = roundPhase(r, now);
  const started = phase !== 'upcoming';
  const closedCheckin = now > Date.parse(r.checkin_closes_at);
  const waiting = notArrived(r);
  return (
    <div className={`${card} flex flex-col gap-2.5 ${phase === 'checkin' ? 'border-halloween-moon' : ''} ${phase === 'ended' ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <b className="text-xl">{roundName(r)}</b>
          <span className="text-sm text-halloween-gray">{w.play} {formatTimeRange(r.starts_at, r.ends_at)}</span>
        </div>
        <Chip className={`px-2.5 py-1 text-[13px] ${phaseChip(r, now)}`}>{phaseLabel(r, now, w)}</Chip>
      </div>
      {r.closed ? (
        <span className="text-[15px]">{r.closed_reason ? `ปิด (${r.closed_reason}) ` : 'ปิดอยู่ '}ไม่รับจองและไม่รับ walk-in</span>
      ) : (
        <>
          <span className="text-[13px] font-bold text-halloween-orange">คนที่จองไว้</span>
          <div className="grid grid-cols-4 gap-1">
            <Stat value={r.online_taken} label="จองไว้" />
            <Stat value={started ? r.checked_in : '—'} label="มาแล้ว" />
            <Stat value={waiting} label="ยังไม่มา" className={phase === 'checkin' && waiting ? 'text-halloween-orange' : ''} />
            <Stat value={closedCheckin ? r.released : '—'} label={w.released} />
          </div>
          <span className="border-t border-halloween-purple/80 pt-2 text-[13px] font-bold text-halloween-orange">Walk-in</span>
          <div className="grid grid-cols-3 gap-1">
            <Stat value={r.walkin_in} label="เข้าแล้ว" />
            <Stat value={Math.max(r.walkin_left, 0)} label="ที่ว่าง" className={r.walkin_left > 0 ? 'text-halloween-moon' : ''} />
            <Stat value={r.walkin_queued} label="คิวรอ" />
          </div>
        </>
      )}
    </div>
  );
}
