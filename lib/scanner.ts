// Camera + feedback helpers shared by the QR scanners (/admin and /admin/escape-room).

/** Beep + vibrate so staff don't have to look at the screen for every scan */
export function scanFeedback(audio: AudioContext | null, ok: boolean) {
  navigator.vibrate?.(ok ? 80 : [120, 80, 120]);
  if (!audio) return;
  const tones = ok ? [{ hz: 1046, at: 0, len: 0.12 }] : [{ hz: 330, at: 0, len: 0.14 }, { hz: 330, at: 0.2, len: 0.14 }];
  for (const { hz, at, len } of tones) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = hz;
    osc.type = ok ? 'sine' : 'square';
    const start = audio.currentTime + at;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + len);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + len + 0.02);
  }
}

export function isBackCamera(stream: MediaStream) {
  return stream.getVideoTracks()[0]?.getSettings().facingMode === 'environment';
}

export const isMobileUA = () => /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/** Thai text for a getUserMedia failure */
export function cameraErrorText(err: unknown) {
  const name = (err as { name?: string })?.name;
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') return 'กรุณาอนุญาตการเข้าถึงกล้องจากเบราว์เซอร์';
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return 'ไม่พบกล้อง';
  if (name === 'NotReadableError' || name === 'TrackStartError') return 'กล้องถูกใช้งานโดยแอปพลิเคชันอื่น';
  if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') return 'ไม่พบกล้องที่ตรงกับความต้องการ';
  return 'เปิดกล้องไม่ได้ ลองใหม่อีกครั้ง';
}

/**
 * Back camera on a phone (front camera if there is none), the default camera elsewhere.
 * `mirrored` is true for a front/laptop camera only: a mirrored back camera moves the
 * wrong way when the phone moves.
 */
export async function openCamera(): Promise<{ stream: MediaStream; mirrored: boolean }> {
  if (!window.isSecureContext && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    throw new Error('iOS Safari ต้องเปิดผ่าน https:// ถึงจะใช้กล้องได้');
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(`เบราว์เซอร์นี้ใช้กล้องไม่ได้${window.isSecureContext ? '' : ' (ต้องใช้ HTTPS)'}`);
  }

  const back: MediaStreamConstraints = { video: { facingMode: { exact: 'environment' } }, audio: false };
  const any: MediaStreamConstraints = { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false };

  if (isMobileUA()) {
    try {
      return { stream: await navigator.mediaDevices.getUserMedia(back), mirrored: false };
    } catch {
      // No back camera: fall through to whatever camera there is
    }
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia(any);
    return { stream, mirrored: !isBackCamera(stream) };
  } catch (err) {
    throw new Error(cameraErrorText(err));
  }
}
