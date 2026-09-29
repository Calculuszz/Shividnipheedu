import Doodle from './Doodle';

// The logo's ghost drifting over its own shadow; used by loaders and the 404 page
export default function FloatingGhost({ className = 'w-24' }: { className?: string }) {
  return (
    <div className={`mx-auto flex flex-col items-center ${className}`} aria-hidden="true">
      <div className="ghost-drift w-full">
        <Doodle name="ghost" className="w-full h-auto" />
      </div>
      <div className="ghost-shadow mt-3 h-2.5 w-2/3 rounded-full bg-black/60 blur-[3px]" />
    </div>
  );
}
