import React from 'react';
import { ArrowRight, Share2, MessageCircle, Zap } from 'lucide-react';

/**
 * UX PRINCIPLE: EMPTY STATES ARE ONBOARDING MOMENTS.
 * 
 * The first time a user encounters an empty state is the first time 
 * they learn that a feature exists. Instead of showing a dead end 
 * (e.g., "No data found"), we show a clear path forward.
 */

type IllustrationType = 'rooms' | 'tenants' | 'ledger' | 'reminders' | 'finance' | 'chat' | 'house-plus' | 'people-door' | 'notebook' | 'confetti-check' | 'lock-key' | 'speech-bubbles' | 'magnifying-glass';

interface EmptyStateProps {
  illustration: IllustrationType;
  title: string;
  description: string;
  ctaText?: string; // Standardized from ctaLabel
  ctaAction?: () => void; // Standardized from ctaOnClick
  ctaHref?: string;
  variant?: 'full' | 'subtle';
  // Support legacy props if needed during migration
  ctaLabel?: string;
  ctaOnClick?: () => void;
  secondary?: { label: string; href: string; };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  illustration, 
  title, 
  description, 
  ctaText, 
  ctaAction,
  ctaHref,
  variant = 'full',
  ctaLabel,
  ctaOnClick,
  secondary
}) => {
  // Resolve props
  const finalCtaText = ctaText || ctaLabel;
  const finalCtaAction = ctaAction || ctaOnClick;

  const illustrations: Record<IllustrationType, React.ReactNode> = {
    rooms: (
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 40L50 15L80 40V80H20V40Z" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="50" cy="50" r="12" fill="white" stroke="#10B981" strokeWidth="2"/>
        <path d="M46 50H54M50 46V54" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    'house-plus': (
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 40L50 15L80 40V80H20V40Z" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="50" cy="50" r="12" fill="white" stroke="#10B981" strokeWidth="2"/>
        <path d="M46 50H54M50 46V54" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    tenants: (
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="35" cy="40" r="15" stroke="#E2E8F0" strokeWidth="2"/>
        <circle cx="65" cy="40" r="15" stroke="#E2E8F0" strokeWidth="2"/>
        <path d="M15 80C15 65 25 55 35 55" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round"/>
        <path d="M85 80C85 65 75 55 65 55" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    'people-door': (
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="35" cy="40" r="15" stroke="#E2E8F0" strokeWidth="2"/>
        <circle cx="65" cy="40" r="15" stroke="#E2E8F0" strokeWidth="2"/>
        <path d="M15 80C15 65 25 55 35 55" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round"/>
        <path d="M85 80C85 65 75 55 65 55" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    ledger: (
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="60" height="60" rx="4" stroke="#E2E8F0" strokeWidth="2"/>
        <path d="M20 40H80M20 60H80M40 20V80M60 20V80" stroke="#F1F5F9" strokeWidth="1"/>
      </svg>
    ),
    notebook: (
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="60" height="60" rx="4" stroke="#E2E8F0" strokeWidth="2"/>
        <path d="M20 40H80M20 60H80M40 20V80M60 20V80" stroke="#F1F5F9" strokeWidth="1"/>
      </svg>
    ),
    reminders: (
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="30" fill="#F0FDF4" stroke="#10B981" strokeWidth="2" strokeDasharray="4 4"/>
        <path d="M40 50L47 57L60 44" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'confetti-check': (
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="30" fill="#F0FDF4" stroke="#10B981" strokeWidth="2" strokeDasharray="4 4"/>
        <path d="M40 50L47 57L60 44" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    finance: (
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 80V20H24V80H20Z" fill="#F1F5F9"/>
        <path d="M20 80H80V84H20V80Z" fill="#F1F5F9"/>
        <rect x="30" y="60" width="8" height="20" rx="1" fill="#E2E8F0" opacity="0.3"/>
        <rect x="45" y="45" width="8" height="35" rx="1" fill="#E2E8F0" opacity="0.3"/>
        <rect x="60" y="55" width="8" height="25" rx="1" fill="#E2E8F0" opacity="0.3"/>
      </svg>
    ),
    chat: (
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 30H70V60H40L30 70V30Z" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20 40H25M35 40H40M50 40H55" stroke="#F1F5F9" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
    'lock-key': (
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="45" width="40" height="35" rx="4" stroke="#E2E8F0" strokeWidth="2"/>
        <path d="M40 45V35C40 29.4772 44.4772 25 50 25C55.5228 25 60 29.4772 60 35V45" stroke="#E2E8F0" strokeWidth="2"/>
        <circle cx="50" cy="62" r="4" fill="#E2E8F0"/>
      </svg>
    ),
    'speech-bubbles': (
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M25 35H65V60H35L25 70V35Z" stroke="#E2E8F0" strokeWidth="2"/>
        <path d="M75 45H35V20H65L75 30V45Z" stroke="#F1F5F9" strokeWidth="2" opacity="0.5"/>
      </svg>
    ),
    'magnifying-glass': (
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="45" cy="45" r="20" stroke="#E2E8F0" strokeWidth="2"/>
        <path d="M60 60L80 80" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round"/>
      </svg>
    )
  };

  const RenderCTA = () => {
    if (!finalCtaText) return null;
    
    const classes = "bg-emerald-600 text-white font-black px-6 py-3 rounded-2xl shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center gap-2 mt-8";
    
    if (ctaHref) {
      return (
        <a href={ctaHref} className={classes}>
          {finalCtaText} <ArrowRight size={14} />
        </a>
      );
    }
    
    if (finalCtaAction) {
      return (
        <button onClick={finalCtaAction} className={classes}>
          {finalCtaText} <ArrowRight size={14} />
        </button>
      );
    }
    
    return null;
  };

  const RenderSecondary = () => {
    if (!secondary) return null;
    return (
      <a 
        href={secondary.href} 
        className="mt-4 text-emerald-600 font-black text-[10px] uppercase tracking-widest hover:underline"
      >
        {secondary.label}
      </a>
    );
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center px-6 ${variant === 'full' ? 'py-20 bg-white rounded-[2.5rem] border border-slate-50' : 'py-10'}`}>
      <div className="mb-6 opacity-80 transition-transform hover:scale-110 duration-300">
        {illustrations[illustration] || illustrations.rooms}
      </div>
      <h3 className="text-xl font-black text-dark mb-2 tracking-tight">{title}</h3>
      <p className="text-slate-500 font-medium max-w-sm mx-auto text-sm leading-relaxed">
        {description}
      </p>
      <RenderCTA />
      <RenderSecondary />
    </div>
  );
};

export const VacantRoomCTA = ({ roomId, roomName }: { roomId: string, roomName: string }) => {
  const shareText = `Available: ${roomName}. Check it out on REHWAS!`;
  const shareUrl = `${window.location.origin}/room/${roomId}`;

  const handleWhatsAppShare = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-200 border-dashed">
      <div className="flex items-center gap-2 text-amber-700 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
        <Zap size={14} fill="currentColor" /> This room is vacant
      </div>
      <p className="text-xs text-amber-600 font-bold mb-4">Share your listing to attract tenants quickly.</p>
      <div className="flex gap-2">
        <button 
          onClick={handleWhatsAppShare}
          className="flex-1 bg-[#25D366] text-white py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <MessageCircle size={14} /> WhatsApp
        </button>
        <button 
          onClick={handleCopyLink}
          className="bg-white text-amber-600 border border-amber-200 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Share2 size={14} /> Copy Link
        </button>
      </div>
    </div>
  );
};
