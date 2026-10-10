import { redirect } from 'next/navigation';
import { bookingPaths } from '@/lib/bookingRules';

// The student ID step is gone: login already says who the leader is, and the rounds
// page checks for an existing booking. Old links still work.
export default function StartBookingPage() {
  redirect(bookingPaths('escape_room').rounds);
}
