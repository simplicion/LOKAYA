import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
  shape?: 'rectangle' | 'circle' | 'pill';
}

export function Skeleton({
  className,
  shimmer = true,
  shape = 'rectangle',
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[#EAE8E3]/80 dark:bg-slate-800/80 shrink-0",
        shape === 'circle' && "rounded-full",
        shape === 'pill' && "rounded-full",
        shape === 'rectangle' && "rounded-2xl",
        shimmer && "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/40 dark:before:via-white/10 before:to-transparent",
        !shimmer && "animate-pulse",
        className
      )}
      {...props}
    />
  );
}

// Composable Sub-Components
export function SkeletonText({
  lines = 1,
  className,
  lastLineWidth = '70%',
}: {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}) {
  if (lines === 1) {
    return <Skeleton className={cn("h-4 w-full rounded-md", className)} />;
  }

  return (
    <div className={cn("flex flex-col gap-2 w-full", className)}>
      {Array.from({ length: lines }).map((_, idx) => {
        const isLast = idx === lines - 1;
        return (
          <Skeleton
            key={idx}
            className="h-3.5 rounded-md"
            style={{ width: isLast ? lastLineWidth : '100%' }}
          />
        );
      })}
    </div>
  );
}

export function SkeletonAvatar({
  size = 'md',
  className,
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return <Skeleton shape="circle" className={cn(sizeMap[size], className)} />;
}

export function SkeletonPill({
  className,
}: {
  className?: string;
}) {
  return <Skeleton shape="pill" className={cn("h-7 w-20 rounded-full", className)} />;
}

export function SkeletonButton({
  className,
}: {
  className?: string;
}) {
  return <Skeleton className={cn("h-10 w-full rounded-xl", className)} />;
}

export function SkeletonCard({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("bg-white dark:bg-slate-900 rounded-3xl p-4 border border-gray-100 dark:border-slate-800 shadow-xs", className)}>
      {children}
    </div>
  );
}

Skeleton.Text = SkeletonText;
Skeleton.Avatar = SkeletonAvatar;
Skeleton.Pill = SkeletonPill;
Skeleton.Button = SkeletonButton;
Skeleton.Card = SkeletonCard;

export { AdaptiveSkeleton } from './AdaptiveSkeleton';

