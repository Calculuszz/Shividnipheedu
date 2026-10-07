// Tinted with the text color
export default function Icon({ name, className = '' }: { name: 'plus' | 'minus' | 'chevron-down'; className?: string }) {
  const mask = `url(/icons/${name}.svg) center / contain no-repeat`;
  return <span aria-hidden="true" className={`inline-block h-[22px] w-[22px] bg-current ${className}`} style={{ mask, WebkitMask: mask }} />;
}
