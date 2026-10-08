'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';
import { QUESTIONS, pickBoo, type Boo, type BooId } from './quiz';

// Pick a boo (Figma: Main › iPhone 16 - 2 … 12). The page is laid out on the
// design's 393px phone width. FC Iconic is loaded with size-adjust 118%, so the
// design's 20px Thai text is 17px here.

const ORANGE = '#fe7700';

// localStorage only exists in the browser: the server snapshot is "unknown"
const noSubscription = () => () => {};
function useStudentId() {
  return useSyncExternalStore(noSubscription, () => localStorage.getItem('studentId'), () => undefined);
}

/** A rotated sticker inside its Figma bounding box */
function Sticker({ src, className, box, inner, transform }: { src: string; className: string; box: [number, number]; inner: [number, number]; transform: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute ${className}`} style={{ width: box[0], height: box[1] }}>
      <img
        src={src}
        alt=""
        className="absolute left-1/2 top-1/2 max-w-none object-cover"
        style={{ width: inner[0], height: inner[1], transform: `translate(-50%, -50%) ${transform}` }}
      />
    </div>
  );
}

function Screen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="pick-a-boo-bg min-h-screen overflow-hidden">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[393px] flex-col items-center">
        {children}
        {footer}
      </div>
    </div>
  );
}

function Progress({ current }: { current: number }) {
  return (
    <ol className="mt-6 flex gap-[26px]" aria-label={`คำถามที่ ${current + 1} จาก ${QUESTIONS.length}`}>
      {QUESTIONS.map((_, i) => (
        <li key={i} aria-hidden="true" className="size-[13px] rounded-full border" style={{ borderColor: ORANGE, background: i <= current ? ORANGE : 'transparent' }} />
      ))}
    </ol>
  );
}

function Graveyard({ onBack, backLabel }: { onBack: () => void; backLabel: string }) {
  return (
    <div className="relative mt-auto h-[191px] w-full shrink-0">
      <img src="/pick-a-boo/graveyard.webp" alt="" aria-hidden="true" className="absolute left-1/2 top-0 h-[233px] w-[393px] max-w-none -translate-x-1/2 object-cover" />
      <img src="/pick-a-boo/logo.webp" alt="SHIVIDNI PHEEDU" className="absolute left-1/2 top-[34px] size-[134px] -translate-x-1/2" />
      <button type="button" onClick={onBack} className="absolute left-[35px] top-[116px] min-h-11 px-0 text-[17px] font-bold text-white/65 hover:text-white">
        &lt; {backLabel}
      </button>
    </div>
  );
}

function QuestionView({ index, picked, onPick, onBack }: { index: number; picked: BooId | null; onPick: (boo: BooId) => void; onBack: () => void }) {
  const question = QUESTIONS[index];
  const number = String(index + 1).padStart(2, '0');
  const total = String(QUESTIONS.length).padStart(2, '0');

  return (
    <Screen footer={<Graveyard onBack={onBack} backLabel={index === 0 ? 'กลับเมนู' : 'ย้อนกลับ'} />}>
      <Sticker src="/pick-a-boo/bats.webp" className="right-[15px] top-[18px]" box={[128, 85]} inner={[128, 85]} transform="scaleX(-1)" />

      <p className="display-font mt-[116px] text-[20px] tracking-[1.6px]" style={{ color: ORANGE }}>
        QUESTION {number} / {total}
      </p>

      <div className="relative mt-[21px] w-[323px] max-w-[calc(100%-32px)]">
        <Sticker src="/pick-a-boo/skull.webp" className="-left-[18px] -top-[25px] z-10" box={[49.4, 45.3]} inner={[43.66, 38.69]} transform="rotate(-9.42deg) scaleX(-1)" />
        <h1
          className="flex min-h-[77px] items-center justify-center rounded-[14px] border-[5px] bg-[#2a0041] px-3 py-2 text-center text-[17px] font-bold leading-snug text-white"
          style={{ borderColor: ORANGE }}
        >
          {question.text}
        </h1>
      </div>

      <div className="relative mt-6 w-[323px] max-w-[calc(100%-32px)] rounded-[14px] border-2 bg-[#2a0041] px-3 pb-8 pt-[31px]" style={{ borderColor: ORANGE }}>
        <div className="flex flex-col gap-[13px]">
          {question.options.map((option) => {
            const selected = picked === option.boo;
            return (
              <button
                key={option.text}
                type="button"
                disabled={picked !== null}
                onClick={() => onPick(option.boo)}
                className={`flex min-h-[54px] items-center justify-center rounded-[14px] border-2 px-4 py-1.5 text-center text-[17px] font-bold leading-snug text-white transition-colors ${
                  selected ? 'bg-[#fe7700]/30' : 'border-white/33 bg-[#33094b] enabled:hover:border-white/70'
                }`}
                style={selected ? { borderColor: ORANGE } : undefined}
              >
                {option.text}
              </button>
            );
          })}
        </div>
        <Sticker src="/pick-a-boo/pumpkin.webp" className="-bottom-6 -right-[25px]" box={[51.27, 53.02]} inner={[46, 48]} transform="rotate(6.67deg)" />
      </div>

      <Progress current={index} />
    </Screen>
  );
}

/** The boo's message as a note on cream "magic paper", signed by the boo */
function Letter({ boo }: { boo: Boo }) {
  return (
    <article className="relative mt-10 w-[345px] max-w-[calc(100%-40px)] -rotate-[0.6deg] rounded-[6px_14px_8px_16px] bg-halloween-cream px-5 pb-4 pt-7 text-[16px] leading-[1.75] text-halloween-blue shadow-[0_14px_30px_rgba(0,0,0,0.45)]">
      <span aria-hidden="true" className="display-font absolute -top-6 left-3 text-[72px] leading-none" style={{ color: ORANGE }}>
        “
      </span>
      <p>
        <b style={{ color: boo.ink }}>แฮ่ !</b> {boo.letter.paragraphs[0]}
      </p>
      {boo.letter.paragraphs.slice(1).map((paragraph) => (
        <p key={paragraph} className="mt-2.5">
          {paragraph}
        </p>
      ))}
      <p className="mt-2.5 font-bold" style={{ color: boo.ink }}>
        {boo.letter.closing}
      </p>
      <p className="display-font mt-3 text-right text-[22px] leading-none" style={{ color: ORANGE }}>
        — {boo.name}
      </p>
    </article>
  );
}

function ResultView({ boo, onAgain, onMenu }: { boo: Boo; onAgain: () => void; onMenu: () => void }) {
  return (
    <Screen>
      <p className="display-font mt-[83px] text-[32px] leading-none" style={{ color: ORANGE }}>
        ✦ YOUR boo ✦
      </p>

      <img src={boo.card} alt={boo.name} width={170} height={255} className="mt-4 h-[255px] w-[170px] rounded-[13px] object-cover shadow-[0_12px_30px_rgba(0,0,0,0.45)]" />

      <h1 className="display-font boo-stroke mt-4 text-[32px] leading-[43px] text-white">{boo.name}</h1>
      <hr className="mt-[27px] h-0.5 w-[258px] border-0" style={{ background: ORANGE }} />

      <Letter boo={boo} />

      <div className="mb-8 mt-6 flex items-center gap-6 text-[15px] font-bold text-white/65">
        <button type="button" onClick={onMenu} className="min-h-11 hover:text-white">
          &lt; กลับเมนู
        </button>
        <button type="button" onClick={onAgain} className="min-h-11 underline underline-offset-4 hover:text-white">
          ทำอีกครั้ง
        </button>
      </div>
    </Screen>
  );
}

async function saveResult(studentId: string, boo: Boo) {
  try {
    const res = await fetch('/api/save-ghost-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, ghostResult: boo.name }),
    });
    if (!res.ok) return;
    const userData = JSON.parse(localStorage.getItem('userData') ?? 'null');
    if (userData) localStorage.setItem('userData', JSON.stringify({ ...userData, ghost_result: boo.name }));
  } catch (error) {
    // The result still shows; the menu just won't remember it
    console.error('Error saving ghost result:', error);
  }
}

export default function PickABooPage() {
  const router = useRouter();
  const studentId = useStudentId();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<BooId[]>([]);
  const [picked, setPicked] = useState<BooId | null>(null);
  const [result, setResult] = useState<Boo | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (studentId === null) router.replace('/');
  }, [studentId, router]);

  if (!studentId || leaving) return <LoadingScreen message="กำลังเรียกวิญญาณมาตั้งคำถาม..." />;

  const toMenu = () => {
    setLeaving(true);
    router.push('/menu');
  };

  const pick = (boo: BooId) => {
    setPicked(boo);
    // A short beat so the tap shows before the next question
    setTimeout(() => {
      const next = [...answers.slice(0, index), boo];
      setAnswers(next);
      setPicked(null);
      if (index < QUESTIONS.length - 1) {
        setIndex(index + 1);
      } else {
        const boo = pickBoo(next);
        setResult(boo);
        void saveResult(studentId, boo);
      }
      window.scrollTo(0, 0);
    }, 250);
  };

  const back = () => (index === 0 ? toMenu() : setIndex(index - 1));

  const again = () => {
    setAnswers([]);
    setIndex(0);
    setResult(null);
  };

  if (result) return <ResultView boo={result} onAgain={again} onMenu={toMenu} />;
  return <QuestionView index={index} picked={picked} onPick={pick} onBack={back} />;
}
