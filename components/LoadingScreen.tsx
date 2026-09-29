'use client';

import FloatingGhost from './FloatingGhost';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'ผีกำลังเดินมา แป๊บนึงนะ...' }: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 bottom-0 w-full h-full min-h-screen bg-halloween-dark/80 backdrop-blur-sm z-[9999] flex items-center justify-center"
    >
      <div className="text-center px-6">
        <FloatingGhost className="w-24 sm:w-28" />
        <p className="mt-5 text-halloween-cream text-lg font-iannnnn-owl">{message}</p>
      </div>
    </div>
  );
}
