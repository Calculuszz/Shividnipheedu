import type { PlayerStatus } from '@/lib/bookingTypes';
import { formatTime, formatTimeRange, minutesUntil } from '@/lib/bookingTime';
import { Tape } from './Card';

export type StatusNoteText = {
  /** "เช็กอินที่บูธ" */
  where: string;
  /** "เช็กอินเปิดแล้ว ไปที่บูธเลย" */
  openNow: string;
  /** Stamp once checked in: "เช็กอินแล้ว" */
  done: string;
  /** "เข้าห้อง" / "เข้าบ้าน" */
  enter: string;
  /** "รอหน้าห้องได้เลย" */
  waitAt: string;
  /** What a late player can still do: "ยังมาเล่นแบบ walk-in ได้ ถ้ารอบยังมีที่" */
  lateHelp: string;
};

type Props = {
  round: { starts_at: string; checkin_opens_at: string; checkin_closes_at: string };
  status: PlayerStatus;
  now: number;
  text: StatusNoteText;
};

/** "อีก 11 วัน 13 ชม." / "อีก 2 ชม. 5 นาที" / "อีก 6 นาที" */
export function untilTh(minutes: number) {
  const m = Math.max(0, minutes);
  if (m < 60) return `อีก ${m} นาที`;
  if (m < 24 * 60) {
    const rest = m % 60;
    return `อีก ${Math.floor(m / 60)} ชม.${rest ? ` ${rest} นาที` : ''}`;
  }
  const days = Math.floor(m / (24 * 60));
  const hours = Math.floor((m % (24 * 60)) / 60);
  return `อีก ${days} วัน${hours ? ` ${hours} ชม.` : ''}`;
}

// The paper note at the top of My booking: when to check in, how long until then,
// and the red-ink rule. Changes with the clock: open now, checked in, too late.
export default function StatusNote({ round, status, now, text }: Props) {
  const toOpen = minutesUntil(round.checkin_opens_at, now);
  const toClose = minutesUntil(round.checkin_closes_at, now);
  const closes = formatTime(round.checkin_closes_at);
  const range = `${formatTimeRange(round.checkin_opens_at, round.checkin_closes_at)} น.`;

  let body;
  if (status === 'checked_in') {
    body = (
      <>
        <span className="paper-stamp">{text.done}</span>
        <p className="text-[15px]">{text.enter}</p>
        <p className="mt-0.5 text-[34px] font-bold leading-[1.1]">{formatTime(round.starts_at)} น.</p>
        <p className="mt-1.5 text-[15px]">{text.waitAt}</p>
      </>
    );
  } else if (status === 'released' || toClose < 0) {
    body = (
      <>
        <p className="text-[15px]">{text.where}</p>
        <p className="mt-0.5 text-[34px] font-bold leading-[1.1]">
          <span className="ink-struck">{range}</span>
        </p>
        <p className="mt-1.5 text-[22px]">
          <span className="ink">สละสิทธิ์แล้ว</span>
        </p>
        <p className="mt-2.5 text-[14px]">{text.lateHelp}</p>
      </>
    );
  } else if (toOpen <= 0) {
    body = (
      <>
        <p className="text-[15px]">{text.openNow}</p>
        <p className="mt-0.5 text-[34px] font-bold leading-[1.1]">ปิด {closes} น.</p>
        <p className="mt-1.5 text-[18px]">
          <span className="ink">เหลือ{untilTh(toClose)}</span>
        </p>
        <p className="mt-2.5 text-[14px]">ยื่น QR ด้านล่างให้สตาฟ</p>
      </>
    );
  } else {
    body = (
      <>
        <p className="text-[15px]">{text.where}</p>
        <p className="mt-0.5 text-[34px] font-bold leading-[1.1]">{range}</p>
        <p className="text-[20px] font-bold opacity-80">{untilTh(toOpen)}</p>
        <p className="mt-3.5 border-t-[1.5px] border-dashed border-current/25 pt-3 text-base">
          <span className="ink">มาช้ากว่า {closes} น. ถือว่าสละสิทธิ์ทุกกรณี</span>
        </p>
      </>
    );
  }

  return (
    <section role="status" className="paper-note mx-1.5 mt-2 mb-1 px-[18px] pt-[22px] pb-[18px]">
      <Tape className="left-1/2 -translate-x-1/2 rotate-3 !bg-[#cdb98f]/80" />
      {body}
    </section>
  );
}
