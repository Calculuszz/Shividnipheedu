import { StickyNote, InfoNotice, Card, Markdown } from '@/components/booking';
import Doodle, { type DoodleName } from '@/components/Doodle';
import type { ActivityInfo } from '@/lib/bookingTypes';

export const CONTACT_LINE = 'ติดต่อผู้จัด: [ช่องทางติดต่อ]';

export function ChulaOnlyNote() {
  return (
    <StickyNote title="Chula students only">
      กิจกรรม Escape Room สงวนสิทธิ์สำหรับ
      <br />
      นิสิตจุฬาลงกรณ์มหาวิทยาลัยเท่านั้น
    </StickyNote>
  );
}

export function CheckInRuleNotice({
  activity,
}: {
  activity: Pick<ActivityInfo, 'checkin_opens_before_min' | 'checkin_duration_min'>;
}) {
  return (
    <InfoNotice title="Check-in rule">
      เช็กอินที่บูธ เปิด {activity.checkin_opens_before_min} นาทีก่อนรอบ และเปิดนาน {activity.checkin_duration_min} นาที
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

export function HealthCard({ activity }: { activity: Pick<ActivityInfo, 'health_notice'> }) {
  if (!activity.health_notice) return null;
  const { items, warning } = parseHealthNotice(activity.health_notice);

  if (items.length === 0) {
    return (
      <Card tone="orange" className="flex flex-col gap-4">
        <h2 className="display-font text-2xl text-halloween-orange -rotate-2 origin-left">Health &amp; safety</h2>
        <Markdown text={activity.health_notice} />
      </Card>
    );
  }

  return (
    <Card tone="orange" className="flex flex-col gap-4">
      <h2 className="display-font text-2xl text-halloween-orange -rotate-2 origin-left">Health &amp; safety</h2>
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
    </Card>
  );
}
