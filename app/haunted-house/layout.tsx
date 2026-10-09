import type { ReactNode } from 'react';

// Every Haunted House page uses the shared booking kit in blood red and old paper
// instead of the Escape Room's orange and lime (variables in globals.css).
export default function HauntedHouseLayout({ children }: { children: ReactNode }) {
  return <div className="theme-haunted">{children}</div>;
}
