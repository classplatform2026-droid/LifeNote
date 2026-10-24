import React from 'react';
import { BookOpen } from 'lucide-react';

interface BookCoverCardProps {
  title: string;
  subtitle?: string;
  coverStyle?: 'leather' | 'linen' | 'charcoal' | 'parchment';
  category?: string;
  itemCount?: number;
  itemType?: 'notebook' | 'diary';
  onClick: () => void;
}

const COVER_ASSETS = {
  leather: '/src/assets/images/book_cover_leather_1792321376351.jpg',
  linen: '/src/assets/images/book_cover_linen_1792321376638.jpg',
  charcoal: '/src/assets/images/book_cover_charcoal_1792321377326.jpg',
  parchment: '/src/assets/images/book_cover_parchment_1792321377611.jpg',
};

export const BookCoverCard: React.FC<BookCoverCardProps> = ({
  title,
  subtitle,
  coverStyle = 'leather',
  category,
  itemCount,
  itemType,
  onClick,
}) => {
  const imageSrc = COVER_ASSETS[coverStyle] || COVER_ASSETS.leather;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      className="group relative flex flex-col cursor-pointer transition-all duration-300 transform hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
    >
      {/* 3D Book Container */}
      <div className="relative aspect-[3/4] w-full rounded-r-lg rounded-l-xs overflow-hidden shadow-sm group-hover:shadow-xl transition-shadow bg-neutral-900">
        {/* Realistic Book Cover Background */}
        <img
          src={imageSrc}
          alt={title}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover brightness-95 group-hover:brightness-100 transition-all duration-300"
        />

        {/* Tactile Book Spine Shadow */}
        <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/60 via-black/30 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-y-0 left-1.5 w-px bg-white/20 pointer-events-none z-10" />

        {/* Subtle page edge trim on right side */}
        <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-l from-amber-50/80 to-transparent pointer-events-none z-10" />

        {/* Compact typography plate overlay */}
        <div className="absolute inset-0 p-3 flex flex-col justify-between z-20 bg-gradient-to-t from-black/85 via-black/30 to-black/60 text-white">
          {/* Top header plate */}
          <div className="flex items-center justify-between text-[10px] tracking-widest uppercase opacity-85">
            <span className="font-mono truncate">{category || 'Volume'}</span>
            <BookOpen className="w-3 h-3 text-neutral-300" />
          </div>

          {/* Center Book Title with debossed look */}
          <div className="my-auto text-center px-1">
            <div className="w-6 h-px bg-amber-400/60 mx-auto mb-1.5" />
            <h3 className="font-serif font-bold text-xs md:text-sm leading-snug tracking-tight text-white drop-shadow-md line-clamp-3">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[10px] text-neutral-300 font-sans mt-0.5 line-clamp-1 opacity-80">
                {subtitle}
              </p>
            )}
            <div className="w-6 h-px bg-amber-400/60 mx-auto mt-1.5" />
          </div>

          {/* Footer plate */}
          <div className="flex items-center justify-between text-[10px] text-neutral-300 border-t border-white/20 pt-1 font-mono">
            <span className="capitalize">{coverStyle}</span>
            <span>
              {itemCount !== undefined ? `${itemCount} ${itemType === 'diary' ? 'Entries' : 'Notes'}` : 'Open'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
