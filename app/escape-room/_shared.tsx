import { StickyNote, InfoNotice, Card, Markdown } from '@/components/booking';
import Doodle, { type DoodleName } from '@/components/Doodle';
import type { ActivityInfo } from '@/lib/bookingTypes';

// Not in the API yet
export const VENUE_BUILDING = 'อาคารวิศวฯ 100 ปี';
export const VENUE_FACULTY = 'คณะวิศวกรรมศาสตร์';

// Floating moon in the top-right corner — repeats identically on Start/Rules/
// Privacy (same size/position/rotation on all three). Landing (Main.dc.html)
// does NOT have this: it has its own 5-image Hero cluster instead, so don't
// add this there too. Position matches the design's pixel values (left: 318px
// of 390px width → right-8; top: 78px).
// Not in BookingPage/BookingHeader (shared, not ours to edit) — each page that
// needs this renders it as the first thing inside <BookingPage>, which already
// has a `relative` ancestor for it to anchor to.
export function MoonCorner() {
  return (
    <Doodle
      name="moon"
      className="absolute right-8 top-[78px] w-10 h-auto pointer-events-none opacity-95 rotate-[10deg] drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
    />
  );
}

export function ChulaOnlyNote() {
  return (
    <StickyNote title="Chula students only">Escape Room สงวนสิทธิ์สำหรับนิสิตจุฬาลงกรณ์มหาวิทยาลัยเท่านั้น</StickyNote>
  );
}

export function CheckInRuleNotice({
  activity,
  hideSummaryLine = false,
  tone = 'orange',
}: {
  activity: Pick<ActivityInfo, 'checkin_opens_before_min' | 'checkin_duration_min'>;
  /** Rules page shows this same sentence in its own "การเช็กอิน" list instead — skip it here to avoid repeating it twice on that page. Landing has no such list, so it keeps showing it (default). */
  hideSummaryLine?: boolean;
  /** Border colour; confirmed page uses purple. */
  tone?: 'orange' | 'purple';
}) {
  return (
    // No `title` prop: InfoNotice's built-in title is plain bold (correct for
    // e.g. "Online booking closed"), but the design renders "Check-in rule"
    // in the display font — a style only this box uses, not InfoNotice's default.
    <InfoNotice className={tone === 'purple' ? '!border-halloween-purple' : ''}>
      <span className="display-font text-[22px] leading-tight text-halloween-orange -rotate-2 inline-block origin-left">
        Check-in rule
      </span>
      {!hideSummaryLine && (
        <p className="mt-2">
          เช็กอินที่บูธ เปิด {activity.checkin_opens_before_min} นาทีก่อนรอบ และเปิดนาน {activity.checkin_duration_min} นาที
        </p>
      )}
      <ol className="pd-list flex flex-col gap-1.5 pl-5 list-decimal marker:text-halloween-orange marker:font-bold mt-2">
        <li>ยืนยันสิทธิ์ = เช็กอินที่บูธภายในเวลาเช็กอินของรอบ</li>
        <li>มาไม่ทันถือว่าสละสิทธิ์ ที่นั่งจะถูกปล่อยให้ walk-in</li>
        <li>ยังมาเล่นแบบ walk-in ได้ถ้ารอบยังมีที่</li>
      </ol>
    </InfoNotice>
  );
}

const HEALTH_ICON: Partial<Record<string, DoodleName>> = {
  ห้องมืด: 'moon',
  เสียงดัง: 'bat',
  แสงกะพริบ: 'ghost',
};

function parseHealthNotice(text: string) {
  const bulletLine = /^-\s*\*\*(.+?)\*\*\s*(.*)$/;
  const items: { title: string; body: string }[] = [];
  const otherLines: string[] = [];
  for (const line of text.split('\n')) {
    const m = line.match(bulletLine);
    if (m) items.push({ title: m[1], body: m[2] });
    else if (line.trim()) otherLines.push(line);
  }
  return { items, warning: otherLines.join('\n').trim() };
}

// Icon rows + warning box only — no heading, no Card. The two pages that show
// this (landing, rules) wrap it in their own heading style and card layout,
// because the design doesn't use the same heading or card grouping on both.
export function HealthRows({ activity }: { activity: Pick<ActivityInfo, 'health_notice'> }) {
  if (!activity.health_notice) return null;
  const { items, warning } = parseHealthNotice(activity.health_notice);

  if (items.length === 0) return <Markdown text={activity.health_notice} />;

  return (
    <>
      {items.map(({ title, body }) => (
        <div key={title} className="flex gap-3.5 items-start">
          <span className="flex items-center justify-center w-11 h-11 shrink-0">
            <Doodle name={HEALTH_ICON[title] ?? 'skull'} className="w-10 h-auto" />
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[17px] font-bold text-halloween-cream">{title}</span>
            <span className="text-[15px] leading-relaxed text-halloween-gray">{body}</span>
          </div>
        </div>
      ))}
      {warning && (
        <p className="px-3.5 py-3 rounded-[10px_16px_8px_14px] border-2 border-dashed border-halloween-orange text-[15px] leading-relaxed text-halloween-orange">
          <b>{warning}</b>
        </p>
      )}
    </>
  );
}

// Landing's own card: "Health & safety" in the display font, per Main.dc.html.
export function HealthCard({ activity }: { activity: Pick<ActivityInfo, 'health_notice'> }) {
  if (!activity.health_notice) return null;
  return (
    <Card tone="orange" className="flex flex-col gap-4">
      <h2 className="display-font text-2xl text-halloween-orange -rotate-2 origin-left">Health &amp; safety</h2>
      <HealthRows activity={activity} />
    </Card>
  );
}
