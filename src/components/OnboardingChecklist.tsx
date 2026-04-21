import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, Circle, ArrowRight, X, 
  User, Home, Users, BookOpen, Send, Sparkles 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRooms } from '@/hooks/useRooms';
import { useLedger } from '@/hooks/useLedger';
import { supabase } from '@/lib/supabase';
import { differenceInDays, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

/**
 * OnboardingChecklist Component
 * 
 * CONCEPT: Guided Onboarding / Activation Checklist
 * 
 * WHY IT MATTERS (Activation Rate):
 * In SaaS, "activation" is the moment a user realizes the value of the product.
 * For REHWAS, activation happens when a landlord sees their rent organized and reminders automated.
 * 
 * Users who complete these 5 steps are 3x more likely to convert to a paid plan because:
 * 1. They've invested time (Endowment Effect).
 * 2. They've seen the "magic" (WhatsApp reminders).
 * 3. They've established a habit of tracking rent here instead of a notebook.
 * 
 * @returns React.FC
 */
interface OnboardingChecklistProps {
  forceShow?: boolean;
  onClose?: () => void;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({ forceShow, onClose }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { rooms, fetchRooms } = useRooms();
  const { fetchLedger } = useLedger();

  const [tenantsCount, setTenantsCount] = useState(0);
  const [hasPaidEntry, setHasPaidEntry] = useState(false);
  const [hasUsedWhatsApp, setHasUsedWhatsApp] = useState(false);
  const [dismissed, setDismissed] = useState(localStorage.getItem('onboardingDismissed') === 'true');
  const [isVisible, setIsVisible] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (forceShow) {
      setIsVisible(true);
      setDismissed(false);
      return;
    }

    if (!profile) return;

    // Trigger check: Only show if created within last 7 days AND not dismissed
    const creationDate = parseISO(profile.created_at);
    const daysSinceCreation = differenceInDays(new Date(), creationDate);
    
    if (daysSinceCreation <= 7 && !dismissed) {
      setIsVisible(true);
    }
  }, [profile, dismissed, forceShow]);

  useEffect(() => {
    const checkStatus = async () => {
      if (!profile) return;

      // Check Step 2: Rooms
      await fetchRooms();

      // Check Step 3: Tenants
      const { count } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .eq('landlord_id', profile.id)
        .eq('status', 'active');
      setTenantsCount(count || 0);

      // Check Step 4: Ledger paid entry this month
      const { data: ledgerData } = await fetchLedger(profile.id);
      const paidThisMonth = ledgerData?.some(entry => entry.status === 'paid');
      setHasPaidEntry(paidThisMonth || false);

      // Check Step 5: WhatsApp
      setHasUsedWhatsApp(localStorage.getItem('hasUsedWhatsApp') === 'true');
    };

    if (isVisible) {
      checkStatus();
    }
  }, [isVisible, profile, fetchRooms, fetchLedger]);

  const steps = [
    {
      id: 1,
      title: "Complete your profile",
      check: !!profile?.full_name && profile.full_name !== 'User',
      cta: "Add your name →",
      action: () => navigate('/settings/profile'),
      benefit: "Build trust with potential tenants"
    },
    {
      id: 2,
      title: "List your first room",
      check: rooms.length > 0,
      cta: "Add a room →",
      action: () => navigate('/add-room'),
      benefit: "Tenants in your city are searching right now"
    },
    {
      id: 3,
      title: "Add your first tenant",
      check: tenantsCount > 0,
      cta: "Add a tenant →",
      action: () => navigate('/dashboard?action=add-tenant'),
      benefit: "Start tracking rent from day one"
    },
    {
      id: 4,
      title: "Log this month's rent",
      check: hasPaidEntry,
      cta: "Mark rent as paid →",
      action: () => navigate('/dashboard?tab=ledger'), 
      benefit: "See how easy it is vs. a notebook"
    },
    {
      id: 5,
      title: "Send your first WhatsApp reminder",
      check: hasUsedWhatsApp,
      cta: "Send a reminder →",
      action: () => navigate('/dashboard?tab=reminders'),
      benefit: "No more awkward phone calls about rent"
    }
  ];

  const completedSteps = steps.filter(s => s.check).length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;
  const currentStepIndex = steps.findIndex(s => !s.check);

  useEffect(() => {
    if (completedSteps === totalSteps && isVisible && !isSuccess) {
      setIsSuccess(true);
      setTimeout(() => {
        handleDismiss();
      }, 5000);
    }
  }, [completedSteps, totalSteps, isVisible]);

  const handleDismiss = () => {
    localStorage.setItem('onboardingDismissed', 'true');
    setDismissed(true);
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible || dismissed) return null;

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-white rounded-3xl border-l-4 border-l-emerald-500 shadow-sm border-y border-r border-gray-100 overflow-hidden">
        {isSuccess ? (
          <div className="p-8 flex flex-col items-center text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="text-emerald-600" size={32} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">🎉 You're all set!</h3>
            <p className="text-gray-600 font-medium max-w-md">
              REHWAS is ready to manage your properties. Your Bhoomi Score is being calculated based on your activity...
            </p>
          </div>
        ) : (
          <>
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">
                    Welcome to REHWAS! Let's get you set up 🏠
                  </h3>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-1000 ease-out" 
                        style={{ width: `${progress}%` }} 
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-500 whitespace-nowrap">
                      {completedSteps} of {totalSteps} steps complete
                    </span>
                  </div>
                </div>
                <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {steps.map((step, idx) => {
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div 
                      key={step.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        step.check 
                          ? 'bg-gray-50 border-gray-100 opacity-60' 
                          : isCurrent 
                            ? 'bg-emerald-50 border-emerald-100' 
                            : 'bg-white border-gray-100'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {step.check ? (
                          <div className="mt-0.5 text-emerald-600">
                            <CheckCircle2 size={20} />
                          </div>
                        ) : (
                          <div className="mt-0.5 text-gray-300">
                            <Circle size={20} />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className={`font-bold text-sm ${step.check ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {step.title}
                          </p>
                          {!step.check && (
                            <>
                              <p className="text-xs text-gray-500 mt-1 font-medium italic">
                                "{step.benefit}"
                              </p>
                              <button 
                                onClick={step.action}
                                className="mt-3 text-emerald-600 font-bold text-xs flex items-center gap-1 hover:gap-2 transition-all"
                              >
                                {step.cta}
                              </button>
                            </>
                          )}
                        </div>
                        {isCurrent && (
                          <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">
                            Next
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={handleDismiss}
                  className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Dismiss Checklist — You can find this again in Settings → Getting Started
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
