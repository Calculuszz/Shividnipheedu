import BackButton from '@/components/BackButton';

export default function EventLayoutPage() {
  return (
    <main className="gradient-background min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <BackButton />

        <h1 className="title-font text-4xl sm:text-5xl text-halloween-bone mb-6 text-center haunted-text">
          Event Map
        </h1>

        <div className="bg-halloween-charcoal border-2 border-halloween-purple rounded-lg p-8">
          <div className="aspect-video bg-halloween-dark rounded-lg flex items-center justify-center border-2 border-dashed border-halloween-purple">
            <div className="text-center p-8">
              <svg
                className="w-24 h-24 mx-auto mb-4 text-halloween-gray"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <p className="text-halloween-cream text-xl font-bold mb-2">
                Event Map
              </p>
              <p className="text-halloween-gray">
                Map showing event layout, booths, and activity locations
              </p>
              <p className="text-halloween-orange text-sm mt-4">
                [Placeholder - Add your event map image to /public folder]
              </p>
            </div>
          </div>

          <div className="mt-6 text-center text-halloween-bone">
            <p className="text-sm text-halloween-gray">
              Location: Larngear, Faculty of Engineering
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
