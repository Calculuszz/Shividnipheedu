'use client';

import Link from 'next/link';

export default function BackButton() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 text-halloween-bone hover:text-halloween-orange transition-colors text-lg font-semibold mb-6"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path d="M15 19l-7-7 7-7" />
      </svg>
      Back
    </Link>
  );
}
