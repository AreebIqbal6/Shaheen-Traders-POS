import React from 'react';

type SkeletonType = 'text' | 'title' | 'avatar' | 'button' | 'image' | 'card' | 'list-item';

interface SkeletonProps {
  type?: SkeletonType;
  className?: string;
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  type = 'text', 
  className = '',
  width,
  height
}) => {
  const baseClasses = "animate-pulse bg-slate-200 dark:bg-slate-700/50";
  
  let typeClasses = "";
  switch (type) {
    case 'text':
      typeClasses = "h-4 rounded w-3/4";
      break;
    case 'title':
      typeClasses = "h-6 rounded-md w-1/2 mb-4";
      break;
    case 'avatar':
      typeClasses = "h-10 w-10 rounded-full shrink-0";
      break;
    case 'button':
      typeClasses = "h-10 rounded-md w-full";
      break;
    case 'image':
      typeClasses = "h-48 rounded-t-xl w-full";
      break;
    case 'card':
      typeClasses = "h-32 rounded-xl w-full";
      break;
    case 'list-item':
      typeClasses = "h-16 rounded-lg w-full";
      break;
  }

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div 
      className={`${baseClasses} ${typeClasses} ${className}`}
      style={style}
    />
  );
};

export const SkeletonCard = () => (
  <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/50 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
    <Skeleton type="image" className="!h-32 !rounded-lg" />
    <Skeleton type="title" className="!mb-0" />
    <Skeleton type="text" width="90%" />
    <Skeleton type="text" width="60%" />
    <div className="flex justify-between items-center mt-2">
      <Skeleton type="text" width="30%" className="!h-5" />
      <Skeleton type="avatar" className="!h-8 !w-8 !rounded-md" />
    </div>
  </div>
);

export const SkeletonListItem = () => (
  <div className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/50 rounded-xl shadow-sm">
    <Skeleton type="avatar" />
    <div className="flex-1 flex flex-col gap-2">
      <Skeleton type="text" width="80%" />
      <Skeleton type="text" width="40%" />
    </div>
  </div>
);
