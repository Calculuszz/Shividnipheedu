'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';
import FieldError from '@/components/FieldError';
import Doodle from '@/components/Doodle';
import FloatingGhost from '@/components/FloatingGhost';
import Sponsors from '@/components/Sponsors';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Check if redirected from successful registration
    if (searchParams.get('registered') === 'true') {
      setShowSuccess(true);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) {
      setFieldError('ยังไม่ได้ใส่รหัสนิสิตเลยนะ');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('studentId', studentId);
        localStorage.setItem('userData', JSON.stringify(data.user));
        router.push('/menu');
      } else {
        setError(
          response.status === 404
            ? 'ผีหาชื่อคุณไม่เจอ ลองเช็ครหัสนิสิตอีกทีนะ'
            : response.status === 429
              ? 'ลองผิดหลายครั้งเกินไป รอสักนาทีแล้วลองใหม่นะ'
              : 'ประตูติดขัดนิดหน่อย ลองใหม่อีกครั้งนะ'
        );
      }
    } catch (err) {
      console.error(err);
      setError('สัญญาณหลอนหาย ลองเช็คเน็ตแล้วกดใหม่อีกทีนะ');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    router.push('/registration');
  };

  return (
    <>
      {/* Full-screen Loading Overlay */}
      {loading && <LoadingScreen message="กำลังเปิดประตูเข้างาน..." />}

      <div className="w-full">
        <div className="relative bg-halloween-charcoal border-2 border-halloween-orange hand-cut p-5 shadow-2xl">
            <Doodle name="pumpkin" className="absolute -top-8 -left-2 w-14 -rotate-12" />
            <h2 className="display-font text-3xl text-halloween-orange mb-4 text-center -rotate-2">
              Login
            </h2>

            {/* Reminder Message */}
            <div className="bg-halloween-purple/20 border-2 border-halloween-purple rounded-xl p-3 mb-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <Doodle name="ghost" className="w-8 shrink-0 -rotate-6" />
                <div className="text-left">
                  <p className="text-halloween-cream text-sm sm:text-base font-iannnnn-owl leading-snug">
                    <span className="font-bold text-halloween-orange">หมายเหตุ:</span> หากคุณยังไม่ได้ลงทะเบียน กรุณาลงทะเบียนก่อนเข้าสู่ระบบ
                  </p>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {showSuccess && (
              <div role="status" className="mb-4 bg-halloween-moon/15 border border-halloween-moon rounded-xl p-3">
                <div className="flex items-center gap-2 text-sm sm:text-base text-halloween-moon">
                  <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-iannnnn-owl">ลงทะเบียนสำเร็จ กรุณาเข้าสู่ระบบ</span>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="studentId"
                  className="block text-base text-halloween-cream font-bold mb-2"
                >
                  Student ID
                </label>
                <input
                  type="text"
                  id="studentId"
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    setFieldError('');
                  }}
                  className={`w-full bg-halloween-dark border-2 rounded-lg px-4 py-3 text-halloween-cream text-base focus:border-halloween-orange focus:outline-none transition-colors ${
                    fieldError ? 'border-halloween-error' : 'border-halloween-purple'
                  }`}
                  placeholder="Enter your student ID"
                  inputMode="numeric"
                  autoComplete="username"
                  enterKeyHint="go"
                  required
                  aria-invalid={!!fieldError}
                  suppressHydrationWarning
                />
                {fieldError && <FieldError message={fieldError} />}
              </div>

              {error && (
                <div role="alert" className="bg-halloween-error/15 border border-halloween-error rounded-lg p-2.5 text-halloween-error text-sm text-center font-iannnnn-owl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="display-font w-full bg-halloween-orange hover:bg-halloween-red text-halloween-dark text-xl py-3 rounded-lg transition-colors disabled:opacity-50 active:scale-95"
                suppressHydrationWarning
              >
                Login
              </button>
            </form>

            <div className="my-4 flex items-center">
              <div className="flex-1 border-t border-halloween-purple"></div>
              <span className="px-3 text-halloween-gray text-sm sm:text-base">or</span>
              <div className="flex-1 border-t border-halloween-purple"></div>
            </div>

            <button
              type="button"
              onClick={handleRegister}
              className="w-full text-halloween-orange hover:text-halloween-red font-semibold text-base transition-colors underline text-center font-iannnnn-owl"
              suppressHydrationWarning
            >
              ลงทะเบียนที่นี่
            </button>
        </div>
      </div>
    </>
  );
}

export default function Home() {
  return (
    <main className="theme-pheedu min-h-dvh flex flex-col">
      {/* Organiser strip pinned to the top edge of the screen */}
      {/* eslint-disable @next/next/no-img-element */}
      <div className="partner-bar w-full">
        <div className="mx-auto flex max-w-sm items-center justify-evenly px-5 py-3">
          <img src="/brand/partners/smo.webp" alt="SMO Student Union Chulalongkorn Business School" width={190} height={96} className="h-8 w-auto" />
          <span className="h-8 w-px partner-divider" aria-hidden="true" />
          <img src="/brand/partners/esc-color.svg" alt="กวศ." width={1000} height={1461} className="h-8 w-auto" />
          <span className="h-8 w-px partner-divider" aria-hidden="true" />
          <img src="/brand/partners/nitade.webp" alt="คณะนิเทศศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย" width={149} height={96} className="h-8 w-auto" />
        </div>
      </div>
      {/* eslint-enable @next/next/no-img-element */}

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-6 sm:px-8">
      <div className="w-full max-w-sm mx-auto">
        {/* Header Section */}
        <header className="mb-5 text-center">
          <h1 className="mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo.webp"
              alt="SHIVIDNI PHEEDU"
              width={720}
              height={531}
              fetchPriority="high"
              className="pheedu-logo mx-auto w-[88%] h-auto"
            />
          </h1>
          <p className="text-sm text-halloween-gray italic">
            22nd October 2026 | 16:00 - 21:00
          </p>
          <p className="text-sm text-halloween-gray italic">
            Larngear, Faculty of Engineering
          </p>
        </header>

        {/* Auth Section */}
        <Suspense fallback={
          <div className="w-full max-w-sm mx-auto">
            <div className="bg-halloween-charcoal border-2 border-halloween-orange hand-cut p-6 sm:p-8 shadow-2xl text-center">
              <FloatingGhost className="w-16" />
              <p className="mt-4 text-halloween-cream">ผีกำลังเดินมา แป๊บนึงนะ...</p>
            </div>
          </div>
        }>
          <LoginForm />
        </Suspense>

        <Sponsors className="mt-8" />

        <p className="mt-6 text-center text-xs text-halloween-gray/70">
          ภาพประกอบโดย{' '}
          <a href="https://www.freepik.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-halloween-cream">
            Freepik
          </a>
          {' · '}ฟอนต์หัวข้อจาก{' '}
          <a href="http://www.onlinewebfonts.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-halloween-cream">
            Web Fonts
          </a>{' '}
          (CC BY 4.0)
        </p>
      </div>
      </div>
    </main>
  );
}
