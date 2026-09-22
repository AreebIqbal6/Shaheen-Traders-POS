import { useRef, useLayoutEffect, useState, memo } from 'react';

/**
 * FitText renders text on a single line, dynamically shrinking the font size
 * until the entire text fits without overflow, wrapping, or ellipsis.
 *
 * Uses useLayoutEffect to measure before paint, so there's no visible flash.
 * Memoized to avoid re-measuring when props haven't changed.
 */
const FitText = memo(({ 
  children, 
  baseSize = 14, 
  minSize = 8, 
  className = '',
  as: Tag = 'h4'
}: {
  children: string;
  baseSize?: number;
  minSize?: number;
  className?: string;
  as?: 'h4' | 'h3' | 'p' | 'span' | 'div';
}) => {
  const ref = useRef<HTMLElement>(null);
  const [fontSize, setFontSize] = useState(baseSize);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reset to base size first
    el.style.fontSize = baseSize + 'px';

    // If it fits at base size, done
    if (el.scrollWidth <= el.clientWidth) {
      setFontSize(baseSize);
      return;
    }

    // Binary search for the largest font size that fits
    let lo = minSize;
    let hi = baseSize;
    while (hi - lo > 0.5) {
      const mid = (lo + hi) / 2;
      el.style.fontSize = mid + 'px';
      if (el.scrollWidth > el.clientWidth) {
        hi = mid;
      } else {
        lo = mid;
      }
    }

    // Use the lower bound to guarantee fit
    el.style.fontSize = lo + 'px';
    setFontSize(lo);
  }, [children, baseSize, minSize]);

  return (
    <Tag
      ref={ref as any}
      className={className}
      style={{
        fontSize,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        display: 'block',
        width: '100%',
      }}
    >
      {children}
    </Tag>
  );
});

FitText.displayName = 'FitText';

export default FitText;
