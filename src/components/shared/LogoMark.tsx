interface Props {
  size?: number;
  variant?: 'color' | 'white';
}

export default function LogoMark({ size = 32, variant = 'color' }: Props) {
  const bg   = variant === 'white' ? 'rgba(255,255,255,0.12)' : '#6a82c4';
  const mark = variant === 'white' ? '#fff' : '#fff';

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill={bg}/>
      {/* Two-hump brain / M mark — smooth bezier arcs */}
      <path
        d="M7 22 C7 14 11 7 16 14 C21 7 25 14 25 22"
        stroke={mark}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dock underline */}
      <line x1="9" y1="25" x2="23" y2="25" stroke={mark} strokeWidth="2" strokeLinecap="round" opacity="0.55"/>
    </svg>
  );
}
