import Link from 'next/link';
import Doodle from '@/components/Doodle';
import FloatingGhost from '@/components/FloatingGhost';

export default function NotFound() {
  return (
    <main className="theme-pheedu min-h-dvh flex flex-col items-center justify-center px-6 py-10 text-center overflow-hidden">
      <div className="relative w-full max-w-sm">
        {/* Scenery scattered around the lost ghost */}
        <Doodle name="moon" className="absolute -top-6 right-2 w-14 rotate-12 opacity-90" />
        <Doodle name="bat-small" className="doodle-bob absolute top-10 left-0 w-12 [--tilt:-12deg]" />
        <Doodle name="bat" className="doodle-bob absolute top-24 right-0 w-16 [--tilt:10deg] [animation-delay:-1.5s]" />

        <p className="display-font text-7xl sm:text-8xl text-halloween-orange -rotate-3 leading-none">404</p>

        <div className="relative mt-6 mb-2">
          <span className="display-font absolute -top-3 right-16 text-4xl text-halloween-moon rotate-12" aria-hidden="true">?</span>
          <span className="display-font absolute top-4 left-14 text-2xl text-halloween-moon -rotate-12" aria-hidden="true">?</span>
          <FloatingGhost className="w-32" />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-halloween-cream">ผีหลงทางซะแล้ว</h1>
        <p className="mt-2 text-halloween-gray">
          หน้านี้ไม่มีอยู่จริง หรืออาจหายไปในความมืด
          <br />
          ลองกลับไปตั้งหลักที่หน้าแรกดูนะ
        </p>

        <Link
          href="/"
          className="display-font hand-cut inline-block mt-8 bg-halloween-orange hover:bg-halloween-moon text-halloween-dark text-xl px-8 py-3 rotate-1 transition-colors"
        >
          กลับหน้าแรก
        </Link>

        <Doodle name="tombstone" className="mx-auto mt-10 w-24 -rotate-6 opacity-80" />
      </div>
    </main>
  );
}
