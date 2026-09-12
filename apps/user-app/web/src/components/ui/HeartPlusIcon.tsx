import React from 'react';

interface HeartPlusIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  isSaved?: boolean;
  strokeWidth?: number;
}

/**
 * Exact Heart + icon as shown in user reference
 * Unsaved: Outline heart with plus (+) integrated at the lower-right
 * Saved: Solid filled heart in rose
 */
export function HeartPlusIcon({
  className = 'w-4 h-4',
  isSaved = false,
  strokeWidth = 2,
  ...props
}: HeartPlusIconProps) {
  if (isSaved) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Heart outline with lower-right curve accommodating the plus symbol */}
      <path d="M12 20l-7 -7a4.95 4.95 0 0 1 0 -7a4.95 4.95 0 0 1 7 0l0 0a4.95 4.95 0 0 1 7 0a4.95 4.95 0 0 1 0 7l-2 2" />
      {/* Plus symbol at bottom-right */}
      <path d="M16 19h6" />
      <path d="M19 16v6" />
    </svg>
  );
}

export default HeartPlusIcon;
