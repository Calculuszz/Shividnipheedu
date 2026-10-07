// Tinted with the text color
export default function Icon({ name, size = 22, className = '' }: { name: 'plus' | 'minus' | 'chevron-down' | 'check'; size?: number; className?: string }) {
  const mask = `url(/icons/${name}.svg) center / contain no-repeat`;
  return <span aria-hidden="true" className={`inline-block shrink-0 bg-current ${className}`} style={{ width: size, height: size, mask, WebkitMask: mask }} />;
}
