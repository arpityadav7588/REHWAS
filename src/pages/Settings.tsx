import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { 
  User, CreditCard, Bell, Settings as SettingsIcon, Shield, AlertTriangle, 
  Upload, Check, Download, Trash2, IndianRupee, Languages, 
  Calendar, Eye, Sparkles, Send, Phone, Mail
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

/**
 * Settings Page
 * 
 * CONCEPT: SaaS Configuration Hub
 * 
 * WHY IT MATTERS:
 * A proper settings page transition REHWAS from a "listing site" to a "SaaS utility."
 * It provides the user with control over their data, their subscription, and their privacy.
 * High control = High trust.
 */
const Settings: React.FC = () => {
  const { profile, user, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'profile' | 'billing' | 'notifications' | 'preferences' | 'privacy' | 'danger'>('profile');
  const [isSaving, setIsSaving] = useState(false);

  // Profile State
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [city, setCity] = useState(profile?.city || 'Bengaluru');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setCity(profile.city || 'Bengaluru');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const { error } = await updateProfile({
      full_name: fullName,
      city,
      bio
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
    { id: 'billing', label: 'Billing & Plan', icon: <CreditCard size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'preferences', label: 'Preferences', icon: <SettingsIcon size={18} /> },
    { id: 'privacy', label: 'Privacy & Security', icon: <Shield size={18} /> },
    { id: 'danger', label: 'Danger Zone', icon: <AlertTriangle size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-8">Settings</h1>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* SIDEBAR */}
          <div className="w-full md:w-64 space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeSection === section.id 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {section.icon}
                {section.label}
              </button>
            ))}
          </div>

          {/* CONTENT AREA */}
          <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 md:p-10">
              {activeSection === 'profile' && <ProfileSection 
                fullName={fullName} setFullName={setFullName}
                city={city} setCity={setCity}
                bio={bio} setBio={setBio}
                avatarUrl={avatarUrl}
                handleAvatarUpload={handleAvatarUpload}
                handleSave={handleSaveProfile}
                isSaving={isSaving}
                profile={profile}
              />}
              {activeSection === 'billing' && <BillingSection profile={profile} navigate={navigate} />}
              {activeSection === 'notifications' && <NotificationsSection profile={profile} updateProfile={updateProfile} />}
              {activeSection === 'preferences' && <PreferencesSection profile={profile} updateProfile={updateProfile} />}
              {activeSection === 'privacy' && <PrivacySection profile={profile} updateProfile={updateProfile} />}
              {activeSection === 'danger' && <DangerZoneSection profile={profile} signOut={signOut} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

/**
 * ProfileSection
 * WHY: Personal brand identity. Landlords with complete profiles get 40% higher tenant response rates.
 */
const ProfileSection = ({ fullName, setFullName, city, setCity, bio, setBio, avatarUrl, handleAvatarUpload, handleSave, isSaving, profile }: any) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
    <div>
      <h2 className="text-2xl font-black text-slate-900 mb-2">Public Profile</h2>
      <p className="text-slate-500 font-medium">Control how you appear to tenants and potential renters.</p>
    </div>

    <div className="flex flex-col md:flex-row gap-8 items-start">
      <div className="relative group">
        <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-sm overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-3xl uppercase bg-slate-50">
              {fullName?.charAt(0) || '?'}
            </div>
          )}
        </div>
        <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
          <Upload size={20} />
          <input type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" />
        </label>
      </div>
      <div className="flex-1 space-y-4 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Full Name</label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Phone Number</label>
            <div className="relative">
              <input 
                type="text" 
                value={profile?.phone || ''} 
                disabled 
                className="w-full bg-slate-100 border-0 rounded-xl px-4 py-3 font-bold text-slate-400 cursor-not-allowed"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                <Check size={10} /> Verified
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Role</label>
            <div className="w-full bg-slate-100 border-0 rounded-xl px-4 py-3 font-bold text-slate-400 uppercase text-xs tracking-widest">
              {profile?.role || 'Landlord'}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">City</label>
            <select 
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-emerald-500 transition-all appearance-none"
            >
              <option value="Bengaluru">Bengaluru</option>
              <option value="Pune">Pune</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Bio</label>
          <textarea 
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Tell tenants a bit about yourself..."
            className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 py-3 rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  </div>
);

/**
 * BillingSection
 * WHY: Subscription transparency. Users need to know exactly what they are paying for and how much they are using.
 */
const BillingSection = ({ profile, navigate }: any) => {
  const isFree = profile?.plan === 'free';
  const planName = profile?.plan === 'free' ? 'REHWAS Free' : profile?.plan === 'pro' ? 'REHWAS Pro' : 'REHWAS Business';
  const planColor = profile?.plan === 'free' ? 'bg-slate-100 text-slate-600' : profile?.plan === 'pro' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
      <div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Billing & Plan</h2>
        <p className="text-slate-500 font-medium">Manage your subscription and monitor usage.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Current Plan</p>
              <h3 className={`text-lg font-black inline-block px-3 py-1 rounded-lg ${planColor}`}>
                {planName}
              </h3>
            </div>
            {isFree ? (
              <button 
                onClick={() => navigate('/pricing')}
                className="bg-emerald-600 text-white text-xs font-black px-4 py-2 rounded-lg shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
              >
                Upgrade →
              </button>
            ) : (
              <span className="text-xs font-bold text-slate-400">Next billing: {format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'MMM d, yyyy')}</span>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-black text-slate-500 uppercase tracking-tight">
              <span>Rooms Usage</span>
              <span>{profile?.rooms_count || 0} / {isFree ? 3 : 'Unlimited'}</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${isFree ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                style={{ width: `${Math.min(((profile?.rooms_count || 0) / (isFree ? 3 : 100)) * 100, 100)}%` }} 
              />
            </div>
          </div>
        </div>

        {isFree && (
          <div className="p-6 bg-emerald-600 rounded-3xl text-white space-y-4 relative overflow-hidden">
            <Sparkles className="absolute -right-4 -top-4 opacity-20 w-24 h-24 rotate-12" />
            <h3 className="text-xl font-black">7 days left in your trial</h3>
            <p className="text-emerald-50 font-medium text-sm">Upgrade to Pro now and keep all your premium reports and utility splitters active.</p>
            <button 
              onClick={() => navigate('/pricing')}
              className="bg-white text-emerald-600 font-black px-5 py-2.5 rounded-xl shadow-lg hover:bg-emerald-50 transition-all text-sm w-full"
            >
              Unlock Pro Features
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-black text-slate-900">Payment History</h3>
        <div className="overflow-hidden border border-slate-100 rounded-2xl">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Date</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Plan</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Amount</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-6 py-4 font-bold text-sm text-slate-600">Apr 15, 2025</td>
                <td className="px-6 py-4"><span className="text-xs font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">Free</span></td>
                <td className="px-6 py-4 font-black text-sm text-slate-900">₹0</td>
                <td className="px-6 py-4"><button className="text-emerald-600 hover:underline font-bold text-sm">Download</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/**
 * NotificationsSection
 * WHY: Signal noise reduction. Letting users opt-out of low-value alerts while ensuring high-value ones (rent) stay on.
 */
const NotificationsSection = ({ profile, updateProfile }: any) => {
  const [prefs, setPrefs] = useState(profile?.notification_preferences || {
    rent_reminders: true,
    reminder_days: 3,
    visit_requests: true,
    chat_messages: true,
    maintenance_updates: true,
    platform_updates: false,
    channels: { in_app: true, whatsapp: true, email: false }
  });

  const handleToggle = async (key: string, value: any) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    await updateProfile({ notification_preferences: newPrefs });
    toast.success('Preferences updated!');
  };

  const handleChannelToggle = async (key: string) => {
    const newChannels = { ...prefs.channels, [key]: !prefs.channels[key] };
    const newPrefs = { ...prefs, channels: newChannels };
    setPrefs(newPrefs);
    await updateProfile({ notification_preferences: newPrefs });
    toast.success('Channels updated!');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
      <div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Notifications</h2>
        <p className="text-slate-500 font-medium">Control how and when you hear from us.</p>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-6">
          <ToggleItem 
            label="Rent due reminders" 
            desc="Stay on top of payments with automated landlord alerts."
            checked={prefs.rent_reminders} 
            onChange={(v: boolean) => handleToggle('rent_reminders', v)}
          />
          {prefs.rent_reminders && (
            <div className="ml-14 pl-4 border-l-2 border-slate-100 animate-in slide-in-from-top-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Remind me</label>
              <select 
                value={prefs.reminder_days}
                onChange={(e) => handleToggle('reminder_days', parseInt(e.target.value))}
                className="bg-slate-50 border-0 rounded-lg px-3 py-2 font-bold text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value={3}>3 days before</option>
                <option value={5}>5 days before</option>
                <option value={7}>7 days before</option>
              </select>
            </div>
          )}
          <ToggleItem 
            label="New visit requests" 
            desc="Get notified instantly when a tenant wants to view a room."
            checked={prefs.visit_requests} 
            onChange={(v: boolean) => handleToggle('visit_requests', v)}
          />
          <ToggleItem 
            label="Chat messages" 
            desc="Real-time alerts for new messages from your tenants."
            checked={prefs.chat_messages} 
            onChange={(v: boolean) => handleToggle('chat_messages', v)}
          />
          <ToggleItem 
            label="Maintenance ticket updates" 
            desc="Stay updated on repair status and issues."
            checked={prefs.maintenance_updates} 
            onChange={(v: boolean) => handleToggle('maintenance_updates', v)}
          />
        </div>

        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-lg font-black text-slate-900 mb-4">Delivery Channels</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ChannelButton 
              label="In-app" 
              icon={<Bell size={16} />} 
              active={prefs.channels.in_app} 
              onClick={() => handleChannelToggle('in_app')}
            />
            <ChannelButton 
              label="WhatsApp" 
              icon={<Send size={16} />} 
              active={prefs.channels.whatsapp} 
              onClick={() => handleChannelToggle('whatsapp')}
            />
            <div className="relative group">
              <ChannelButton 
                label="Email" 
                icon={<Mail size={16} />} 
                active={prefs.channels.email} 
                onClick={() => toast.error('Email notifications available from Pro plan')}
                disabled
              />
              <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-lg group-hover:scale-110 transition-transform">Pro</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * PreferencesSection
 * WHY: Personalization. Making the app "feel like home" by respecting the user's preferred language and formats.
 */
const PreferencesSection = ({ profile, updateProfile }: any) => {
  const [prefs, setPrefs] = useState(profile?.preferences || {
    language: 'English',
    date_format: 'DD/MM/YYYY',
    default_dashboard_tab: 'rooms'
  });

  const handleChange = async (key: string, value: string) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    await updateProfile({ preferences: newPrefs });
    toast.success('Preferences saved!');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
      <div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Preferences</h2>
        <p className="text-slate-500 font-medium">Customize your dashboard experience.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Languages size={14} /> Language
          </label>
          <select 
            value={prefs.language}
            onChange={(e) => handleChange('language', e.target.value)}
            className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-emerald-500 appearance-none"
          >
            <option value="English">English</option>
            <option value="Hindi">हिंदी (Hindi)</option>
            <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
            <option value="Marathi">मराठी (Marathi)</option>
          </select>
          <p className="text-[10px] text-slate-400 font-bold italic mt-1">Note: More languages coming soon</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Calendar size={14} /> Date Format
          </label>
          <select 
            value={prefs.date_format}
            onChange={(e) => handleChange('date_format', e.target.value)}
            className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-emerald-500 appearance-none"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY (Standard)</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <IndianRupee size={14} /> Currency
          </label>
          <div className="w-full bg-slate-100 border-0 rounded-xl px-4 py-3 font-bold text-slate-400">
            ₹ (Indian Rupee)
          </div>
          <p className="text-[10px] text-slate-400 font-bold italic mt-1">Fixed to Indian Rupee</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <SettingsIcon size={14} /> Default Dashboard Tab
          </label>
          <select 
            value={prefs.default_dashboard_tab}
            onChange={(e) => handleChange('default_dashboard_tab', e.target.value)}
            className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-emerald-500 appearance-none"
          >
            <option value="rooms">My Rooms</option>
            <option value="ledger">Rent Ledger</option>
            <option value="tenants">Tenants</option>
            <option value="reminders">Reminders</option>
          </select>
        </div>
      </div>
    </div>
  );
};

/**
 * PrivacySection
 * WHY: Data sovereignty. In a high-trust platform, users must know their data is safe and they can take it with them.
 */
const PrivacySection = ({ profile, updateProfile }: any) => {
  const [privacy, setPrivacy] = useState(profile?.privacy_settings || {
    profile_visibility: 'everyone',
    show_phone_after: 'visit'
  });

  const handleChange = async (key: string, value: string) => {
    const newPrivacy = { ...privacy, [key]: value };
    setPrivacy(newPrivacy);
    await updateProfile({ privacy_settings: newPrivacy });
    toast.success('Privacy settings updated!');
  };

  const handleDownloadData = async () => {
    const loadingToast = toast.loading('Exporting your data...');
    try {
      // Mock data export logic - in real app, we'd fetch all tables
      const exportData = {
        profile,
        timestamp: new Date().toISOString(),
        format: 'REHWAS Data Export v1.0'
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rehwas-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
      link.click();
      
      toast.success('Data exported successfully!', { id: loadingToast });
    } catch (err) {
      toast.error('Failed to export data.', { id: loadingToast });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
      <div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Privacy & Security</h2>
        <p className="text-slate-500 font-medium">Control your visibility and manage your data.</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Eye size={14} /> Who can see my profile
            </label>
            <select 
              value={privacy.profile_visibility}
              onChange={(e) => handleChange('profile_visibility', e.target.value)}
              className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-emerald-500 appearance-none"
            >
              <option value="everyone">Everyone</option>
              <option value="tenants">Only tenants in my chat</option>
              <option value="private">Completely Private</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Phone size={14} /> Show phone number after
            </label>
            <select 
              value={privacy.show_phone_after}
              onChange={(e) => handleChange('show_phone_after', e.target.value)}
              className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-emerald-500 appearance-none"
            >
              <option value="visit">Visit confirmed</option>
              <option value="agreement">Both sides agree to chat</option>
              <option value="never">Never show on platform</option>
            </select>
          </div>
        </div>

        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h4 className="font-bold text-slate-900">Download your data</h4>
            <p className="text-xs text-slate-500 font-medium">Get a copy of all your rooms, tenants, and ledger history.</p>
          </div>
          <button 
            onClick={handleDownloadData}
            className="flex items-center gap-2 bg-white text-slate-900 border border-slate-200 font-black px-6 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all text-sm"
          >
            <Download size={16} /> Download JSON
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * DangerZoneSection
 * WHY: Account termination. A respectful SaaS must let users leave as easily as they joined.
 */
const DangerZoneSection = ({ signOut }: any) => {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('Type DELETE to confirm.');
      return;
    }
    
    setIsDeleting(true);
    toast.loading('Deleting account...');
    
    // In a real app, we'd call a Supabase function to anonymise/delete
    setTimeout(async () => {
      await signOut();
      toast.success('Account deleted.');
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
      <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
        <div className="flex items-center gap-3 text-red-600 mb-2">
          <AlertTriangle size={24} />
          <h2 className="text-2xl font-black">Danger Zone</h2>
        </div>
        <p className="text-red-700/70 font-medium">Be careful. These actions are permanent and cannot be undone.</p>
      </div>

      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center p-6 border border-red-100 rounded-3xl gap-4">
          <div>
            <h4 className="font-bold text-slate-900">Delete all my listings</h4>
            <p className="text-xs text-slate-500 font-medium">Remove all your room listings from the REHWAS marketplace.</p>
          </div>
          <button className="text-red-600 border-2 border-red-100 font-black px-6 py-2.5 rounded-xl hover:bg-red-50 active:scale-95 transition-all text-sm">
            Delete Listings
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-6 bg-white border-2 border-red-600 rounded-3xl space-y-4 shadow-xl shadow-red-600/10">
            <h4 className="text-lg font-black text-red-600">Delete Account Permanently</h4>
            <p className="text-sm text-slate-600 font-medium">
              This will permanently delete your profile, rooms, tenants, and all payment history. You will lose access to all reports.
            </p>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type "DELETE" to confirm</label>
              <input 
                type="text" 
                placeholder="DELETE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-red-600 transition-all uppercase"
              />
            </div>
            <button 
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="w-full bg-red-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-600/20 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={20} /> {isDeleting ? 'Deleting...' : 'Permanently Delete My Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- HELPERS ---

const ToggleItem = ({ label, desc, checked, onChange }: { label: string, desc: string, checked: boolean, onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-start gap-4">
      <div className={`mt-1 w-10 h-6 rounded-full transition-colors relative cursor-pointer ${checked ? 'bg-emerald-600' : 'bg-slate-200'}`} onClick={() => onChange(!checked)}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${checked ? 'left-5' : 'left-1'}`} />
      </div>
      <div>
        <h4 className="font-bold text-slate-900 leading-tight">{label}</h4>
        <p className="text-xs text-slate-500 font-medium">{desc}</p>
      </div>
    </div>
  </div>
);

const ChannelButton = ({ label, icon, active, onClick, disabled }: { label: string, icon: React.ReactNode, active: boolean, onClick: () => void, disabled?: boolean }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
      active 
        ? 'bg-emerald-50 border-emerald-600 text-emerald-700 shadow-sm' 
        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {icon}
    {label}
  </button>
);

export default Settings;
