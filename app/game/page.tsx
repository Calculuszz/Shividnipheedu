import BackButton from '@/components/BackButton';
import Link from 'next/link';
import Doodle from '@/components/Doodle';

export default function GamePage() {
  return (
    <main className="gradient-background min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <BackButton />

        <h1 className="title-font text-4xl sm:text-5xl text-halloween-bone mb-6 text-center haunted-text">
          Ghost Quiz
        </h1>

        <div className="bg-halloween-charcoal border-2 border-halloween-purple rounded-lg p-8 text-center">
          <div className="mb-8">
            <p className="text-halloween-cream text-lg mb-4">
              Discover what type of ghost you are!
            </p>
            <p className="text-halloween-gray">
              Take the quiz to find out your ghostly personality.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/login"
              className="block w-full bg-halloween-orange hover:bg-halloween-red text-halloween-dark font-bold text-lg px-8 py-4 rounded-lg border-2 border-halloween-bone transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
            >
              <Doodle name="ghost" className="w-7 -rotate-6" />
              Start Quiz (Login Required)
            </Link>

            <p className="text-halloween-gray text-sm">
              You need to login with your student ID to take the quiz
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
