/* eslint-disable @next/next/no-img-element */

// Hand-drawn illustrations (Freepik, see credits on the home page) used instead of emoji
const DOODLES = {
  ghost: [256, 245],
  pumpkin: [256, 233],
  'witch-hat': [256, 187],
  bat: [256, 164],
  'bat-small': [206, 152],
  web: [256, 256],
  broom: [74, 256],
  moon: [230, 256],
  potion: [165, 256],
  skull: [225, 256],
  tombstone: [256, 225],
} as const;

export type DoodleName = keyof typeof DOODLES;

// Dark pieces need the cream sticker outline to stay visible on the plum background
const DARK: DoodleName[] = ['bat', 'bat-small', 'witch-hat'];

type DoodleProps = {
  name: DoodleName;
  className?: string;
  /** Leave empty for decorative use (hidden from screen readers) */
  alt?: string;
};

export default function Doodle({ name, className = '', alt = '' }: DoodleProps) {
  const [width, height] = DOODLES[name];
  const effect = DARK.includes(name) ? 'sticker' : 'doodle-shadow';

  return (
    <img
      src={`/illustrations/${name}.webp`}
      width={width}
      height={height}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      draggable={false}
      className={`select-none pointer-events-none ${effect} ${className}`}
    />
  );
}
