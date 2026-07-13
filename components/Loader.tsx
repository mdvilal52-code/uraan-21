'use client';

type LoaderProps = {
  fullScreen?: boolean;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
};

export default function Loader({ fullScreen = false, text, size = 'md' }: LoaderProps) {
  const sizeClass = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  }[size];

  const wrapperClass = fullScreen
    ? 'fixed inset-0 bg-white/90 backdrop-blur-sm z-[300] flex flex-col items-center justify-center gap-4'
    : 'flex flex-col items-center justify-center gap-3 py-10';

  return (
    <div className={wrapperClass}>
      <div className={`${sizeClass} relative`}>
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-[#f8f2e6]" />
        {/* Spinning gold arc */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#b8893a] border-r-[#b8893a] animate-spin" />
        {/* Center dot */}
        <div className="absolute inset-1/3 rounded-full bg-[#b8893a]" />
      </div>
      {text && (
        <div className="text-[10px] tracking-[2px] uppercase text-[#6b5d4c] font-medium">
          {text}
        </div>
      )}
    </div>
  );
}