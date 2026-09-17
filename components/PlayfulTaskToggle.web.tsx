import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';

const PATH_LENGTH = 420;
const STRIKE_PATH =
  'M 10 16.91 s 79.8 -11.36 98.1 -11.34 c 22.2 0.02 -47.82 14.25 -33.39 22.02 c 12.61 6.77 124.18 -27.98 133.31 -17.28 c 7.52 8.38 -26.8 20.02 4.61 22.05 c 24.55 1.93 113.37 -20.36 113.37 -20.36';

type Props = {
  label: string;
  checked?: boolean;
  onComplete?: () => void;
  onUncheck?: () => void;
  removeAfterCheck?: boolean;
};

export function PlayfulTaskToggle({
  label,
  checked: controlled = false,
  onComplete,
  onUncheck,
  removeAfterCheck = true,
}: Props) {
  const { colors } = useAppTheme();
  const [visual, setVisual] = useState(controlled);
  const [pressed, setPressed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setVisual(controlled);
  }, [controlled]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const toggle = () => {
    if (timer.current) clearTimeout(timer.current);
    setPressed(true);
    window.setTimeout(() => setPressed(false), 180);

    if (visual) {
      setVisual(false);
      timer.current = setTimeout(() => onUncheck?.(), 260);
      return;
    }

    setVisual(true);
    timer.current = setTimeout(
      () => onComplete?.(),
      removeAfterCheck ? 760 : 0,
    );
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: '1 1 auto' }}>
      <button
        type="button"
        role="checkbox"
        aria-checked={visual}
        aria-label={`${visual ? 'Uncheck' : 'Mark'} ${label}${visual ? '' : ' complete'}`}
        onClick={toggle}
        style={{
          width: 30,
          height: 30,
          flex: '0 0 30px',
          borderRadius: 9,
          border: `1.5px solid ${visual ? colors.accent : colors.border}`,
          background: visual ? colors.accent : colors.background,
          display: 'grid',
          placeItems: 'center',
          padding: 0,
          cursor: 'pointer',
          transform: pressed ? 'scale(.92)' : 'scale(1)',
          transition: 'transform 180ms cubic-bezier(.2,.8,.2,1), background-color 180ms ease, border-color 180ms ease',
        }}
      >
        {visual ? <Check size={17} color="#fff" strokeWidth={3.5} /> : null}
      </button>

      <div style={{ position: 'relative', minWidth: 0, flex: '0 1 auto' }}>
        <span
          style={{
            color: visual ? colors.muted : colors.text,
            fontSize: 15,
            fontWeight: 800,
            lineHeight: '20px',
            transition: 'color 180ms ease',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {label}
        </span>
        <svg
          aria-hidden="true"
          width="100%"
          height="32"
          viewBox="0 0 340 32"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
          <path
            d={STRIKE_PATH}
            vectorEffect="non-scaling-stroke"
            stroke={colors.text}
            strokeWidth={2}
            strokeLinecap="round"
            strokeMiterlimit={10}
            fill="none"
            strokeDasharray={`${PATH_LENGTH} ${PATH_LENGTH}`}
            strokeDashoffset={visual ? 0 : PATH_LENGTH}
            style={{
              transition: `stroke-dashoffset ${visual ? 720 : 260}ms cubic-bezier(.45,0,.55,1)`,
            }}
          />
        </svg>
      </div>
    </div>
  );
}
