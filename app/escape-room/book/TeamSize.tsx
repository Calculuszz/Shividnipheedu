import Card from '@/components/booking/Card';
import Icon from './Icon';

export type SeatCheck =
  | { kind: 'checking'; roundTime: string }
  | { kind: 'blocked'; text: string }
  | { kind: 'error'; text: string }
  | null;

type Props = {
  count: number;
  min: number;
  max: number;
  check: SeatCheck;
  onAdd: () => void;
  onRemoveLast: () => void;
  onPickRound: () => void;
};

const STEP = 'flex h-12 w-12 items-center justify-center rounded-[14px] border-2';
const IDLE = 'border-halloween-purple bg-halloween-purple/30 text-halloween-cream';

export default function TeamSize({ count, min, max, check, onAdd, onRemoveLast, onPickRound }: Props) {
  const checking = check?.kind === 'checking';
  const atMax = count >= max;
  const plusStyle = checking
    ? 'border-halloween-orange bg-halloween-orange/35 text-halloween-cream'
    : atMax || check?.kind === 'blocked'
      ? IDLE
      : 'border-halloween-orange bg-halloween-orange text-halloween-dark';

  return (
    <Card className="flex flex-col gap-2.5 p-[18px]">
      <span className="text-[15px] font-bold">
        Number of players <span className="text-halloween-error" aria-hidden="true">*</span>
      </span>
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          aria-label="Fewer players"
          disabled={count <= min || checking}
          onClick={onRemoveLast}
          className={`${STEP} ${IDLE} disabled:opacity-50`}
        >
          <Icon name="minus" />
        </button>
        <output aria-live="polite" className="display-font min-w-11 text-center text-[30px]">
          {count}
        </output>
        <button
          type="button"
          aria-label="More players"
          disabled={atMax || checking || check?.kind === 'blocked'}
          onClick={onAdd}
          className={`${STEP} ${plusStyle}`}
        >
          <Icon name="plus" />
        </button>
        <span className="text-[15px] text-halloween-gray">
          ทีมละ {min}–{max} คน
        </span>
      </div>

      {checking ? (
        <div role="status" className="flex flex-wrap items-center gap-x-2 rounded-xl bg-halloween-purple/30 px-3 py-2.5 text-[15px] font-bold">
          Checking seats… <span className="font-normal text-halloween-gray">ตรวจที่นั่งล่าสุดของรอบ {check.roundTime}</span>
        </div>
      ) : check ? (
        <div role="alert" className="flex flex-col gap-2 rounded-[14px] border-2 border-halloween-error bg-halloween-error/10 px-3.5 py-3 text-[15px] leading-normal text-halloween-error">
          <span className="font-bold">{check.text}</span>
          {check.kind === 'blocked' && (
            <button type="button" onClick={onPickRound} className="self-start py-1.5 font-bold text-halloween-orange underline">
              Pick another round
            </button>
          )}
        </div>
      ) : (
        atMax && (
          <div role="status" className="rounded-[12px_8px_14px_6px/8px_14px_6px_12px] border-[1.5px] border-halloween-purple bg-halloween-dark px-3.5 py-3 text-[15px] font-bold">
            ทีมละไม่เกิน {max} คน
          </div>
        )
      )}
      <span className="text-sm text-halloween-gray">กด + ทุกครั้ง ระบบจะตรวจที่นั่งล่าสุดของรอบนี้</span>
    </Card>
  );
}
