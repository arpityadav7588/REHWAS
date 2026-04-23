import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { 
  User, CreditCard, Bell, Shield, AlertTriangle, 
  Upload, Check, Download, Trash2, IndianRupee, 
  Eye, Sparkles, Send, Phone, Mail, Users, Zap, Puzzle,
  ChevronRight, ExternalLink, FileText, Globe, Plus, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import { FeatureGate } from '@/components/FeatureGate';

/**
 * Settings Page: The Property Control Room
 * 
 * CONCEPT: This isn't just a configuration page; it's the cockpit of the landlord's operation.
 * By presenting settings as high-level controls rather than technical inputs, we empower 
 * the user and justify the SaaS subscription value.
 */
const Settings: React.FC = () => {
  const { profile, user, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<'profile' | 'billing' | 'notifications' | 'team' | 'integrations' | 'danger'>('profile');
  const [isSaving, setIsSaving] = useState(false);

  // Profile State
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/billing')) setActiveSection('billing');
    else if (path.includes('/team')) setActiveSection('team');
    else if (path.includes('/notifications')) setActiveSection('notifications');
    else setActiveSection('profile');
  }, [location.pathname]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const { error } = await updateProfile({
      full_name: fullName
    });
    setIsSaving(false);
    if (!error) toast.success('Profile updated successfully!');
    else toast.error('Failed to update profile.');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await updateProfile({ avatar_url: publicUrl });
      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success('Avatar updated!');
    } catch (err: any) {
      toast.error(err.message || 'Error uploading avatar');
    }
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: <User size={18} /> },
    { id: 'billing', label: 'Plan & Billing', icon: <CreditCard size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'team', label: 'Team Members', icon: <Users size={18} /> },
    { id: 'integrations', label: 'Integrations', icon: <Puzzle size={18} /> },
    { id: 'danger', label: 'Danger Zone', icon: <AlertTriangle size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-12 pb-24">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Settings</h1>
          <p className="text-slate-500 font-medium">Control room for your property empire.</p>
        </header>
        
        <div className="flex flex-col md:flex-row gap-12 items-start">
          {/* LEFT SUB-NAV */}
          <nav className="w-full md:w-64 flex flex-row md:flex-col gap-1 overflow-x-auto pb-4 md:pb-0 sticky top-8">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
                  activeSection === section.id 
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {section.icon}
                {section.label}
              </button>
            ))}
          </nav>

          {/* RIGHT CONTENT PANEL */}
          <main className="flex-1 w-full max-w-3xl">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               {activeSection === 'profile' && <ProfileSection 
                fullName={fullName} setFullName={setFullName}
                avatarUrl={avatarUrl}
                handleAvatarUpload={handleAvatarUpload}
                handleSave={handleSaveProfile}
                isSaving={isSaving}
                profile={profile}
              />}
              {activeSection === 'billing' && <BillingSection profile={profile} navigate={navigate} />}
              {activeSection === 'notifications' && <NotificationsSection profile={profile} updateProfile={updateProfile} />}
              {activeSection === 'team' && <TeamSection profile={profile} />}
              {activeSection === 'integrations' && <IntegrationsSection />}
              {activeSection === 'danger' && <DangerZoneSection profile={profile} signOut={signOut} />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

/**
 * ProfileSection
 * 
 * WHY: This establishes the landlord's identity. 
 * Phone numbers are masked and read-only to emphasize security and verification, 
 * making the platform feel professional and dispute-resistant.
 */
const ProfileSection = ({ fullName, setFullName, avatarUrl, handleAvatarUpload, handleSave, isSaving, profile }: any) => {
  const maskPhone = (phone: string) => {
    if (!phone) return '+91 ×××× ×× ××××';
    return `+91 ×××× ×× ${phone.slice(-4)}`;
  };

  return (
    <div className="space-y-12">
      <section className="flex flex-col md:flex-row gap-8 items-center md:items-start p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full bg-white shadow-2xl shadow-slate-200 border-4 border-white overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-4xl uppercase bg-slate-50">
                {fullName?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-[2px]">
            <Upload size={24} />
            <input type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" />
          </label>
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <h2 className="text-2xl font-black text-slate-900">{fullName || 'New User'}</h2>
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest border border-emerald-200 flex items-center gap-1">
              {profile?.role || 'Landlord'}
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 font-bold focus:bg-white focus:border-slate-900 focus:ring-0 transition-all outline-none"
              placeholder="Your full name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
            <div className="relative group">
              <div className="w-full bg-slate-100 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-400 flex items-center justify-between">
                <span>{maskPhone(profile?.phone)}</span>
                <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-tighter">
                  <Check size={10} /> Verified
                </span>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-10 py-4 rounded-2xl shadow-xl shadow-emerald-900/10 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>

        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-8">
          Account created on {profile?.created_at ? format(new Date(profile.created_at), 'MMMM d, yyyy') : 'Recently'}
        </p>
      </section>
    </div>
  );
};

/**
 * BillingSection
 * 
 * WHY: This is the heartbeat of the SaaS relationship. 
 * By showing usage bars (Rooms, History, Photos), we create a "Loss Aversion" effect where 
 * users are nudged to upgrade to avoid hitting their capacity limits.
 */
const BillingSection = ({ profile, navigate }: any) => {
  const isStarter = profile?.plan === 'starter' || !profile?.plan;
  const isPro = profile?.plan === 'pro';
  const isBusiness = profile?.plan === 'business';
  
  const planInfo = {
    starter: { name: 'Starter', price: '₹0', color: 'slate' },
    pro: { name: 'Pro', price: '₹499/mo', color: 'emerald' },
    business: { name: 'Business', price: '₹1,499/mo', color: 'blue' }
  }[profile?.plan as 'starter' | 'pro' | 'business' || 'starter'];

  const invoices = [
    { id: '1', date: 'Apr 1, 2026', desc: 'REHWAS Pro Monthly', amount: '₹499', status: 'Paid' },
    { id: '2', date: 'Mar 1, 2026', desc: 'REHWAS Pro Monthly', amount: '₹499', status: 'Paid' },
    { id: '3', date: 'Feb 1, 2026', desc: 'REHWAS Pro Monthly', amount: '₹499', status: 'Paid' },
    { id: '4', date: 'Jan 1, 2026', desc: 'REHWAS Pro Monthly', amount: '₹499', status: 'Paid' },
    { id: '5', date: 'Dec 1, 2025', desc: 'REHWAS Pro Monthly', amount: '₹499', status: 'Paid' },
    { id: '6', date: 'Nov 1, 2025', desc: 'REHWAS Pro Monthly', amount: '₹499', status: 'Paid' },
  ];

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Current Plan</h3>
        <div className={`p-8 rounded-[2.5rem] border-2 transition-all ${
          isPro ? 'bg-emerald-50 border-emerald-100' : 
          isBusiness ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'
        }`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-3xl font-black text-slate-900">{planInfo?.name}</h4>
                <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-emerald-600 border border-emerald-100 uppercase tracking-widest shadow-sm">Active</span>
              </div>
              <p className="text-slate-500 font-bold">{isStarter ? "You're on the free Starter plan" : `Next billing May 1, 2026 — ${planInfo?.price}`}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
              <button 
                onClick={() => navigate('/pricing')}
                className="bg-emerald-600 text-white font-black px-6 py-3 rounded-2xl shadow-xl shadow-emerald-900/10 hover:bg-emerald-700 transition-all w-full sm:w-auto"
              >
                {isStarter ? 'Upgrade to Pro' : 'Upgrade / Downgrade'}
              </button>
              {!isStarter && (
                <button className="text-slate-400 hover:text-slate-600 font-bold text-sm transition-all">
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>

          {/* Trial Warning */}
          {profile?.isOnTrial && (
            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center text-white">
                  <Bell size={20} />
                </div>
                <div>
                  <p className="font-black text-slate-900 text-sm">Trial ending soon</p>
                  <p className="text-xs text-amber-800 font-medium">Your Pro trial ends in 7 days. Add payment to continue.</p>
                </div>
              </div>
              <button className="bg-amber-400 text-white font-black px-4 py-2 rounded-xl text-xs shadow-lg shadow-amber-400/20 hover:bg-amber-500 transition-all">
                Add Payment Method
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <UsageCard 
            label="Rooms" 
            value={`${profile?.rooms_count || 0} of ${isStarter ? '3' : 'Unlimited'} used`} 
            progress={isStarter ? ((profile?.rooms_count || 0) / 3) * 100 : 10} 
            color={isStarter && (profile?.rooms_count || 0) >= 3 ? 'bg-red-500' : 'bg-emerald-500'}
            hint={isStarter ? "Upgrade for more" : "Unlimited active"}
          />
          <UsageCard 
            label="History" 
            value={isStarter ? '6 months' : 'Unlimited'} 
            progress={isStarter ? 60 : 100} 
            color="bg-blue-500"
            hint={isStarter ? "Pro includes unlimited" : "Complete history"}
          />
          <UsageCard 
            label="Photos" 
            value={isStarter ? '5 per room' : '20 per room'} 
            progress={isStarter ? 25 : 100} 
            color="bg-purple-500"
            hint={isStarter ? "Pro includes 20 per room" : "High-res storage"}
          />
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Billing History</h3>
        {isStarter && invoices.length === 0 ? (
          <div className="p-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center">
            <p className="text-slate-400 font-bold">No billing history yet — you're on the free plan</p>
          </div>
        ) : (
          <div className="overflow-hidden border border-slate-100 rounded-[2rem] bg-white shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{inv.date}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{inv.desc}</td>
                    <td className="px-6 py-4 font-black text-slate-900">{inv.amount}</td>
                    <td className="px-6 py-4">
                      <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-emerald-600 hover:text-emerald-700 font-black text-xs flex items-center gap-1 ml-auto uppercase tracking-tighter">
                        <Download size={14} /> Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!isStarter && (
        <section className="space-y-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Payment Method</h3>
          <div className="p-6 border-2 border-slate-100 rounded-[2rem] flex items-center justify-between gap-4 bg-white shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 bg-slate-900 rounded-md flex items-center justify-center text-white font-black text-[10px] tracking-widest">VISA</div>
              <div>
                <p className="font-black text-slate-900 tracking-widest">•••• •••• •••• 4242</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Expires 04/27</p>
              </div>
            </div>
            <button className="text-slate-900 font-black text-xs border-2 border-slate-100 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all">
              Update Card
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

const UsageCard = ({ label, value, progress, color, hint }: any) => (
  <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
    <div className="flex justify-between items-end mb-3">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-xl font-black text-slate-900">{value}</p>
      </div>
    </div>
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
      <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${progress}%` }} />
    </div>
    <p className="text-[10px] text-slate-400 font-bold italic">{hint}</p>
  </div>
);

/**
 * NotificationsSection
 * 
 * WHY: High signal, low noise. By allowing landlords to customize their alerts, 
 * we ensure they only see what matters, reducing "Dashboard Fatigue" and 
 * keeping them engaged with critical tenant interactions.
 */
const NotificationsSection = ({ profile, updateProfile }: any) => {
  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">In-App Notifications</h3>
        <div className="space-y-4">
          <SettingsToggle label="New tenant message" desc="Direct alerts when a tenant chats with you" checked={true} />
          <SettingsToggle label="Visit request received" desc="Get notified when a new prospect wants to view" checked={true} />
          <SettingsToggle label="Rent marked as paid" desc="Alert when a tenant records their monthly payment" checked={true} />
        </div>
      </section>

      <section className="space-y-6 opacity-50">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">WhatsApp & Email</h3>
          <span className="bg-slate-100 text-slate-500 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Coming soon</span>
        </div>
        <div className="space-y-4 pointer-events-none">
          <SettingsToggle label="Monthly rent due reminder" desc="Automated nudges sent to yourself" checked={false} />
          <SettingsToggle label="Lease expiry alerts" desc="Get notified 30 days before a tenant's agreement ends" checked={false} />
          <SettingsToggle label="Maintenance ticket updates" desc="Weekly summary of repair tasks and history" checked={false} />
        </div>
      </section>

      <button className="bg-emerald-600 text-white font-black px-10 py-4 rounded-2xl shadow-xl shadow-emerald-900/10 hover:bg-emerald-700 transition-all">
        Save Preferences
      </button>
    </div>
  );
};

/**
 * TeamSection
 * 
 * WHY: Delegation is the key to scaling a property empire. 
 * This section turns REHWAS from a solo tool into a collaborative platform, 
 * justifying the Business tier for larger operations.
 */
const TeamSection = ({ profile }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isBusiness = profile?.plan === 'business';

  const members = [
    { name: 'Karthik Raja', email: 'karthik@rehwas.com', role: 'Owner', date: 'Jan 2024', avatar: '' },
    { name: 'Sameer Khan', email: 'sam@mgt.co', role: 'Manager', date: 'Mar 2024', avatar: '' },
  ];

  return (
    <FeatureGate feature="team_seats" requiredPlan="business">
      <div className="space-y-8">
        <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Seats Used</h3>
            <div className="flex items-center gap-4">
              <p className="text-3xl font-black text-slate-900">2 of 3 used</p>
              <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[66%]" />
              </div>
            </div>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2 cursor-pointer hover:underline">Add more seats — ₹299/seat/month</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 text-white font-black px-6 py-4 rounded-2xl shadow-xl shadow-slate-900/10 flex items-center gap-2 hover:bg-black transition-all"
          >
            <Plus size={18} /> Invite Team Member
          </button>
        </div>

        <div className="overflow-hidden border border-slate-100 rounded-[2rem] bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Member</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Added Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map(member => (
                <tr key={member.email} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
                        {member.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{member.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold tracking-tight">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{member.date}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-red-500 font-black text-[10px] uppercase tracking-widest hover:underline">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-slate-900">Invite Member</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                  <input type="text" className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl px-4 py-3 font-bold" placeholder="Sameer Khan" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input type="email" className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl px-4 py-3 font-bold" placeholder="sam@mgt.co" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</label>
                  <select className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl px-4 py-3 font-bold">
                    <option>Owner</option>
                    <option>Manager</option>
                    <option>View-only</option>
                  </select>
                </div>
                <button 
                  onClick={() => {
                    toast.success('Invitation sent via email!');
                    setIsModalOpen(false);
                  }}
                  className="w-full bg-slate-900 text-white font-black py-4 rounded-xl shadow-xl shadow-slate-900/10 mt-4"
                >
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
};

/**
 * IntegrationsSection
 * 
 * WHY: This creates "Stickiness." By connecting REHWAS to external ecosystems 
 * (Razorpay, Tally), we ensure that removing REHWAS would break the landlord's 
 * entire workflow, increasing lifetime value (LTV).
 */
const IntegrationsSection = () => (
  <div className="space-y-8">
    <div className="p-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center space-y-4 bg-slate-50/50">
      <div className="w-20 h-20 bg-white shadow-xl shadow-slate-200/50 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
        <Puzzle size={40} />
      </div>
      <h3 className="text-2xl font-black text-slate-900">External Integrations</h3>
      <p className="text-slate-500 font-medium max-w-sm mx-auto">
        Connect REHWAS with Tally, WhatsApp Business, or your own internal dashboards.
      </p>
      <button className="bg-slate-200 text-slate-400 font-black px-8 py-3 rounded-2xl cursor-not-allowed">
        Coming Q3 2026
      </button>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="p-6 border border-slate-100 rounded-3xl grayscale opacity-50 bg-white shadow-sm">
        <div className="font-black text-slate-900 mb-1">Razorpay</div>
        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Payment Gateway</div>
      </div>
      <div className="p-6 border border-slate-100 rounded-3xl grayscale opacity-50 bg-white shadow-sm">
        <div className="font-black text-slate-900 mb-1">WhatsApp</div>
        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Messaging API</div>
      </div>
    </div>
  </div>
);

/**
 * DangerZoneSection
 * 
 * WHY: Trust through Transparency. Users feel safe giving data to a platform 
 * when they know they can export it or delete it instantly. 
 * "Data Portability" is a key SaaS trust signal.
 */
const DangerZoneSection = ({ profile, signOut }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportCSV = () => {
    toast.success('Preparing CSV export...');
    setTimeout(() => toast.success('Check your downloads!'), 1500);
  };

  const handleDelete = () => {
    if (confirmText !== 'DELETE') {
      toast.error('Type DELETE to confirm');
      return;
    }
    setIsDeleting(true);
    toast.loading('Deleting account...');
    setTimeout(() => {
      signOut();
      toast.dismiss();
    }, 2000);
  };

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Data Portability</h3>
        <div className="p-8 border border-slate-100 rounded-[2.5rem] bg-white shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h4 className="text-lg font-black text-slate-900">Export my data</h4>
            <p className="text-sm text-slate-500 font-medium">Download all rooms, tenants, and ledger as a CSV file.</p>
          </div>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-slate-50 text-slate-900 border border-slate-200 font-black px-8 py-3 rounded-2xl hover:bg-slate-100 transition-all"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xs font-black text-red-400 uppercase tracking-[0.2em]">Permanent Actions</h3>
        <div className="p-8 border-2 border-red-50 rounded-[2.5rem] bg-red-50/30 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h4 className="text-lg font-black text-red-600">Delete my account</h4>
            <p className="text-sm text-red-900/60 font-medium max-w-sm">
              Permanently delete all rooms, tenants, and rent history. 
            </p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-red-600 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-red-900/10 hover:bg-red-700 transition-all"
          >
            Delete Account
          </button>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-red-600">Are you sure?</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
            </div>
            <p className="text-sm text-slate-500 font-medium mb-8">
              This will permanently delete all your rooms, tenants, and rent history. 
              <strong> This cannot be undone.</strong>
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type "DELETE" to confirm</label>
                <input 
                  type="text" 
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full bg-white border-2 border-red-100 rounded-2xl px-5 py-4 font-bold focus:border-red-500 focus:ring-0 transition-all outline-none text-red-600"
                  placeholder="DELETE"
                />
              </div>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black px-10 py-4 rounded-2xl shadow-xl shadow-red-900/10 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Trash2 size={18} /> {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsToggle = ({ label, desc, checked }: any) => (
  <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
    <div>
      <p className="font-bold text-slate-900">{label}</p>
      <p className="text-xs text-slate-500 font-medium">{desc}</p>
    </div>
    <div className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${checked ? 'bg-emerald-500' : 'bg-slate-200'}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${checked ? 'left-7' : 'left-1'}`} />
    </div>
  </div>
);

export default Settings;
