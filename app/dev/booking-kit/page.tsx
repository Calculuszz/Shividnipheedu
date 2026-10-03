import { notFound } from 'next/navigation';
import BookingKit from './BookingKit';

// Living catalogue of the shared booking components, wired to the real API.
// Only exists in `pnpm dev`; production returns 404.
export default function Page() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <BookingKit />;
}
