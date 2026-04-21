import React from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  illustration: 'magnifying-glass' | 'house-plus' | 'people-door' | 'notebook' | 'confetti-check' | 'speech-bubbles' | 'lock-key';
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaOnClick?: () => void;
  secondary?: {
    label: string;
    href: string;
  };
}

/**
 * EmptyState Component
 * 
 * CONCEPT: The "Sister Restaurant" Analogy.
 * 
 * WHY IT MATTERS:
 * An empty screen is a moment of potential frustration. If a user sees a blank page, they think 
 * the app is broken or dead. 
 * 
 * By using a beautiful Empty State, we transform that frustration into guidance.
 * It's the difference between a locked door with no sign and a friendly sign saying 
 * "We're currently out of rooms, but try this nearby neighborhood!" 
 * 
 * Good empty states increase activation by 2x because they always provide a "Next Step."
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ 
  illustration, 
  title, 
  description, 
  ctaLabel, 
  ctaHref, 
  ctaOnClick,
  secondary 
}) => {
  
  const renderIllustration = () => {
    const primary = "#10B981"; // Brand Green
    const secondaryColor = "#E2E8F0"; // Slate 200
    const accent = "#94A3B8"; // Slate 400

    switch (illustration) {
      case 'magnifying-glass':
        return (
          <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="65" cy="65" r="40" stroke={secondaryColor} strokeWidth="4" />
            <path d="M95 95L120 120" stroke={accent} strokeWidth="8" strokeLinecap="round" />
            <circle cx="55" cy="58" r="3" fill={accent} />
            <circle cx="75" cy="58" r="3" fill={accent} />
            <path d="M58 78C58 78 62 74 65 74C68 74 72 78 72 78" stroke={accent} strokeWidth="2" strokeLinecap="round" />
            <path d="M65 40L65 30" stroke={primary} strokeWidth="2" strokeLinecap="round" />
            <path d="M45 45L38 38" stroke={primary} strokeWidth="2" strokeLinecap="round" />
            <path d="M85 45L92 38" stroke={primary} strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'house-plus':
        return (
          <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M30 70L70 35L110 70V110H30V70Z" stroke={secondaryColor} strokeWidth="4" />
            <rect x="60" y="80" width="20" height="30" stroke={secondaryColor} strokeWidth="2" />
            <circle cx="105" cy="40" r="25" fill={primary} fillOpacity="0.1" stroke={primary} strokeWidth="2" strokeDasharray="4 4" />
            <path d="M105 32V48M97 40H113" stroke={primary} strokeWidth="4" strokeLinecap="round" />
          </svg>
        );
      case 'people-door':
        return (
          <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 110V85C40 76.7157 46.7157 70 55 70H85C93.2843 70 100 76.7157 100 85V110" stroke={secondaryColor} strokeWidth="4" />
            <path d="M55 40V100M85 40V100M55 40H85V100H55V40Z" fill={primary} fillOpacity="0.05" stroke={primary} strokeWidth="2" />
            <circle cx="35" cy="55" r="12" stroke={secondaryColor} strokeWidth="4" />
            <circle cx="105" cy="55" r="12" stroke={secondaryColor} strokeWidth="4" />
            <circle cx="75" cy="70" r="2" fill={primary} />
          </svg>
        );
      case 'notebook':
        return (
          <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="30" y="30" width="80" height="80" rx="4" stroke={secondaryColor} strokeWidth="4" />
            <path d="M30 50H110M30 70H110M30 90H110" stroke={secondaryColor} strokeWidth="2" />
            <path d="M30 40C20 40 20 100 30 100" stroke={primary} strokeWidth="6" strokeLinecap="round" />
            <path d="M50 55H90" stroke={primary} strokeWidth="4" strokeLinecap="round" />
            <path d="M50 75H75" stroke={accent} strokeWidth="4" strokeLinecap="round" />
          </svg>
        );
      case 'confetti-check':
        return (
          <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="70" cy="70" r="40" fill={primary} fillOpacity="0.1" stroke={primary} strokeWidth="2" strokeDasharray="6 6" />
            <path d="M50 70L65 85L95 55" stroke={primary} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="30" cy="40" r="3" fill="#F59E0B" />
            <rect x="110" y="50" width="4" height="4" transform="rotate(45 110 50)" fill="#3B82F6" />
            <path d="M100 100L105 105" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
            <circle cx="40" cy="110" r="2" fill={primary} />
          </svg>
        );
      case 'speech-bubbles':
        return (
          <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M30 40H90V80H60L40 100V80H30V40Z" stroke={secondaryColor} strokeWidth="4" />
            <path d="M110 60H50V100H80L100 120V100H110V60Z" fill={primary} fillOpacity="0.1" stroke={primary} strokeWidth="2" />
            <path d="M45 55H75M45 65H60" stroke={accent} strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'lock-key':
        return (
          <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="40" y="65" width="60" height="45" rx="4" stroke={secondaryColor} strokeWidth="4" />
            <path d="M50 65V45C50 33.9543 58.9543 25 70 25C81.0457 25 90 33.9543 90 45V65" stroke={primary} strokeWidth="4" strokeLinecap="round" />
            <circle cx="70" cy="85" r="5" fill={accent} />
            <path d="M70 90V98" stroke={accent} strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      default:
        return null;
    }
  };

  const CTA = () => {
    if (!ctaLabel) return null;
    
    if (ctaOnClick) {
      return (
        <button 
          onClick={ctaOnClick}
          className="w-full bg-brand hover:bg-emerald-600 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-brand/20 transition-all active:scale-95"
        >
          {ctaLabel}
        </button>
      );
    }
    
    if (ctaHref) {
      return (
        <Link 
          to={ctaHref}
          className="w-full bg-brand hover:bg-emerald-600 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-brand/20 transition-all active:scale-95 text-center inline-block"
        >
          {ctaLabel}
        </Link>
      );
    }
    
    return null;
  };

  return (
    <div className="w-full max-w-[360px] mx-auto py-12 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-6">
        {renderIllustration()}
      </div>
      
      <h3 className="text-xl font-bold text-slate-900 mb-2">
        {title}
      </h3>
      
      <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
        {description}
      </p>
      
      <div className="w-full space-y-4">
        <CTA />
        
        {secondary && (
          <Link 
            to={secondary.href}
            className="block text-sm font-bold text-slate-400 hover:text-brand transition-colors"
          >
            {secondary.label}
          </Link>
        )}
      </div>
    </div>
  );
};
