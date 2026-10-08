import BookingForm from '@/components/booking/BookingForm';

export default async function BookPage({ searchParams }: {
  searchParams: Promise<{ round?: string | string[]; leader?: string | string[] }>;
}) {
  const query = await searchParams;
  return <BookingForm initialRoundId={typeof query.round === 'string' ? query.round : ''}
    leaderId={typeof query.leader === 'string' ? query.leader : ''} />;
}
