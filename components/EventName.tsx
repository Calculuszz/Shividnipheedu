// Event name styled like the logo: SHIVIDNI in lime, PHEEDU in orange
export default function EventName({ withYear = true }: { withYear?: boolean }) {
  return (
    <>
      <span className="text-halloween-moon">SHIVIDNI</span>{' '}
      <span className="text-halloween-orange">PHEEDU</span>
      {withYear && <span className="text-halloween-orange"> 2026</span>}
    </>
  );
}
