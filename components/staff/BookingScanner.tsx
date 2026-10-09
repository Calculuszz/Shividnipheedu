'use client';

import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { BookingApiError, staff } from '@/lib/bookingClient';
import { formatTime, formatTimeRange } from '@/lib/bookingTime';
import type { StaffRound } from '@/lib/bookingTypes';
import { openCamera, scanFeedback } from '@/lib/scanner';
import { minutesText, roundName, roundPhase, staffCheckinError } from '@/lib/staffRounds';
import { Icon, Svg, btn } from './ui';
import { staffFail } from './useStaffRounds';

type Result =
  | { ok: true; name: string; round: StaffRound | undefined }
  | { ok: false; title: string; action: string; walkin?: boolean; warn?: boolean };

// Event entry tickets (from /register) look like SHIVIDNIPHEEDU-<id>-<time>
const ENTRY_TICKET = /^SHIVIDNIPHEEDU-/i;
// The same QR held in front of the camera is ignored for this long after its result
const SAME_QR_COOLDOWN_MS = 5000;
// A success hides itself so the next person can step up; a problem waits for a tap
const SUCCESS_SHOWN_MS = 3000;

export default function BookingScanner({
  rounds,
  now,
  audio,
  onCheckedIn,
  onClose,
  onWalkin,
}: {
  rounds: StaffRound[];
  now: number;
  audio: AudioContext | null;
  onCheckedIn: () => void;
  onClose: () => void;
  onWalkin: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mirrored, setMirrored] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  // The scan loop runs in an interval, so "busy" and "last code" live in refs
  const busy = useRef(false);
  const last = useRef<{ code: string; at: number } | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The camera effect runs once; it reads the latest rounds and callback from here
  const roundsRef = useRef(rounds);
  const callbacks = useRef({ onCheckedIn });
  useEffect(() => {
    roundsRef.current = rounds;
    callbacks.current = { onCheckedIn };
  });

  const open = rounds.find((r) => roundPhase(r, now) === 'checkin');

  const next = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setResult(null);
    busy.current = false;
    // The cooldown for this QR starts when staff move on
    if (last.current) last.current.at = Date.now();
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    let loop: ReturnType<typeof setInterval> | null = null;
    let alive = true;

    const show = (r: Result) => {
      setResult(r);
      scanFeedback(audio, r.ok);
      if (r.ok) hideTimer.current = setTimeout(next, SUCCESS_SHOWN_MS);
    };

    const handle = async (text: string) => {
      busy.current = true;
      last.current = { code: text, at: Date.now() };
      if (ENTRY_TICKET.test(text)) {
        show({ ok: false, title: 'นี่คือ QR บัตรเข้างาน', action: 'ไม่ใช่ QR Escape Room ให้เปิด QR การจองจากอีเมล Escape Room' });
        return;
      }
      try {
        const data = await staff.checkInByCode(text);
        show({ ok: true, name: data.full_name, round: roundsRef.current.find((r) => r.round_no === data.round_no) });
        callbacks.current.onCheckedIn();
      } catch (e) {
        if (e instanceof BookingApiError && e.code !== 'NETWORK' && e.code !== 'SERVER_ERROR' && e.code !== 'UNAUTHORIZED') {
          show({ ok: false, ...staffCheckinError(e.code) });
        } else {
          // Let the same QR be tried again straight away
          last.current = null;
          show({ ok: false, title: 'เช็กอินไม่สำเร็จ', action: `${staffFail(e)} ลองสแกนใหม่อีกครั้ง` });
        }
      }
    };

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (busy.current || !video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) return;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const code = jsQR(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
      if (!code?.data) return;
      const text = code.data.trim();
      const prev = last.current;
      if (prev && prev.code === text && Date.now() - prev.at < SAME_QR_COOLDOWN_MS) return;
      void handle(text);
    };

    openCamera()
      .then(async (cam) => {
        if (!alive) {
          cam.stream.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = cam.stream;
        setMirrored(cam.mirrored);
        const video = videoRef.current!;
        video.srcObject = cam.stream;
        video.muted = true;
        await video.play();
        loop = setInterval(tick, 400);
      })
      .catch((e: Error) => alive && setCameraError(e.message || 'เปิดกล้องไม่ได้'));

    return () => {
      alive = false;
      if (loop) clearInterval(loop);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [audio]);

  return (
    <div className="fixed inset-0 z-50 bg-black text-halloween-cream" role="dialog" aria-modal="true" aria-label="สแกน QR เช็กอิน">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        muted
        autoPlay
        style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
      />
      <canvas ref={canvasRef} className="hidden" />

      {!result && !cameraError && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-60 w-60 rounded-2xl border-4 border-halloween-orange md:h-72 md:w-72" />
        </div>
      )}

      <div className="absolute inset-x-0 top-0 flex items-center gap-3 bg-gradient-to-b from-black/80 to-transparent px-4 pb-8 pt-[max(14px,env(safe-area-inset-top))]">
        <div className="flex flex-1 flex-col gap-0.5">
          {open ? (
            <>
              <b className="text-[17px]">
                {roundName(open)} เช็กอินถึง {formatTime(open.checkin_closes_at)}
              </b>
              <span className="text-sm font-bold text-halloween-moon">
                ปิดใน {minutesText(Date.parse(open.checkin_closes_at) - now)}, มาแล้ว {open.checked_in} จาก {open.online_taken} คน
              </span>
            </>
          ) : (
            <b className="text-[17px]">ตอนนี้ยังไม่มีรอบไหนเปิดเช็กอิน</b>
          )}
        </div>
        <button type="button" onClick={onClose} className={`${btn('ghost')} min-h-11 bg-black/40 text-[15px]`}>
          ปิดกล้อง
        </button>
      </div>

      {cameraError && (
        <div className="absolute inset-x-4 top-1/3 mx-auto flex max-w-md flex-col gap-3 rounded-2xl border-4 border-halloween-error bg-halloween-charcoal p-5 text-center">
          <b className="text-xl text-halloween-error">เปิดกล้องไม่ได้</b>
          <span>{cameraError}</span>
          <button type="button" onClick={onClose} className={btn()}>
            กลับไปค้นหาด้วยชื่อ
          </button>
        </div>
      )}

      {result && (
        <div className="absolute inset-0 flex items-end justify-center bg-[rgba(10,4,16,0.55)] p-4 pb-[max(24px,env(safe-area-inset-bottom))] md:items-center">
          {result.ok ? (
            <div className="flex w-full max-w-md flex-col items-center gap-2.5 rounded-2xl border-4 border-halloween-moon bg-halloween-charcoal px-5 pb-5 pt-6 text-center shadow-2xl">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-halloween-moon text-halloween-dark">
                <Svg size={36}>{Icon.check}</Svg>
              </span>
              <b className="text-[26px] text-halloween-moon">เช็กอินแล้ว</b>
              <b className="text-[22px]">{result.name}</b>
              {result.round && (
                <>
                  <span className="text-xl font-bold text-halloween-orange">{roundName(result.round)}</span>
                  <span className="text-[15px] leading-relaxed text-halloween-gray">
                    เล่น {formatTimeRange(result.round.starts_at, result.round.ends_at)}
                    <br />
                    ให้รอหน้าห้องได้เลย
                  </span>
                </>
              )}
              <button type="button" onClick={next} className={`${btn()} mt-2 w-full`}>
                สแกนคนถัดไป
              </button>
            </div>
          ) : (
            <div
              className={`flex w-full max-w-md flex-col gap-3 rounded-2xl border-4 bg-halloween-charcoal p-5 shadow-2xl ${
                result.warn ? 'border-halloween-orange' : 'border-halloween-error'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-halloween-dark ${
                    result.warn ? 'bg-halloween-orange' : 'bg-halloween-error'
                  }`}
                >
                  {result.warn ? '!' : '×'}
                </span>
                <div className="flex flex-col gap-1">
                  <b className={`text-xl ${result.warn ? 'text-halloween-orange' : 'text-halloween-error'}`}>{result.title}</b>
                  <span className="text-[15px] leading-relaxed">{result.action}</span>
                </div>
              </div>
              {result.walkin && (
                <button type="button" onClick={onWalkin} className={btn('ghost')}>
                  ไปหน้า Walk-in
                </button>
              )}
              <button type="button" onClick={next} className={btn()}>
                สแกนคนถัดไป
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
