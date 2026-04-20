import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRooms } from '@/hooks/useRooms';
import { useLedger } from '@/hooks/useLedger';
import { RentLedgerTable } from '@/components/RentLedgerTable';
import { RoomCard } from '@/components/RoomCard';
import type { Tenant, RentLedger } from '@/types';
import toast from 'react-hot-toast';
import { format, parseISO, subMonths } from 'date-fns';
import { 
  Home, Users, BookOpen, Bell, Plus, IndianRupee,
  DoorOpen, Trash2, ShieldAlert, Phone, FileText, X
} from 'lucide-react';
import { DigitalDossier } from '@/components/DigitalDossier';
import { VerificationCenter } from '@/components/VerificationCenter';

/**
 * Extended Tenant Type for Dashboard
 */
interface TenantExtended extends Tenant {
  profiles?: { full_name: string; phone: string; } | null;
  rooms?: { title: string; } | null;
}

/**
 * Landlord Dashboard
 * WHAT IT DOES: The central hub for a landlord to manage properties, track rent via KhataBook style ledger, and view statistics.
 */
export default function LandlordDashboard() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const { rooms, fetchRooms, deleteRoom, updateRoom } = useRooms();
  const { fetchLedger, getMonthlyTotal, createLedgerEntries, updateLedgerEntry, applyBulkUtilityBill } = useLedger();

  // Selected Tab State
  const [activeTab, setActiveTab] = useState<'rooms' | 'tenants' | 'ledger' | 'reminders'>('rooms');
  
  // Data States
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<TenantExtended[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<RentLedger[]>([]);
  const [rentCollected, setRentCollected] = useState(0);

  // Dossier State
  const [selectedDossierTenant, setSelectedDossierTenant] = useState<any>(null);

  // Utility Billing Modal States
  const [isUtilModalOpen, setIsUtilModalOpen] = useState(false);
  const [utilTotalAmount, setUtilTotalAmount] = useState('');
  const [utilMonth, setUtilMonth] = useState(format(new Date(), 'MMM yyyy'));
  const [selectedTenantsForUtil, setSelectedTenantsForUtil] = useState<string[]>([]);
  const [applyingUtil, setApplyingUtil] = useState(false);

  // Add Tenant Modal States
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [tenantRoomId, setTenantRoomId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantMoveIn, setTenantMoveIn] = useState('');
  const [tenantRent, setTenantRent] = useState('');
  const [addingTenant, setAddingTenant] = useState(false);

  // Load Everything
  const loadDashboardData = async () => {
    if (!profile) return;
    setLoading(true);

    try {
      const currentMonthStr = format(new Date(), 'MMM yyyy');

      // Execute all data fetching concurrently for better performance
      const [tenantResult, ledgerResult, monthlyTotalResult] = await Promise.all([
        supabase
          .from('tenants')
          .select(`*, profiles(full_name, phone), rooms(title)`)
          .eq('landlord_id', profile.id)
          .eq('status', 'active'),
        fetchLedger(profile.id),
        getMonthlyTotal(profile.id, currentMonthStr),
        fetchRooms()
      ]);

      // Update state with results
      if (tenantResult.data) setTenants(tenantResult.data as TenantExtended[]);
      if (ledgerResult.data) setLedgerEntries(ledgerResult.data as any);
      setRentCollected(monthlyTotalResult.total);

    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !profile) {
      navigate('/discover'); // Redirect non-logged in or tenants
      return;
    }
    if (profile && profile.role !== 'landlord') {
      navigate('/discover');
      return;
    }

    if (profile && profile.role === 'landlord') {
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, authLoading, navigate]);

  // Derived Values
  const landlordRooms = useMemo(() => rooms.filter(r => r.landlord_id === profile?.id), [rooms, profile]);
  const occupiedCount = useMemo(() => landlordRooms.filter(r => !r.available).length, [landlordRooms]);
  const vacantCount = useMemo(() => landlordRooms.filter(r => r.available).length, [landlordRooms]);
  const vacantRoomsList = useMemo(() => landlordRooms.filter(r => r.available), [landlordRooms]);

  // Reminders - unpaid for current month
  const unpaidThisMonth = useMemo(() => {
    const currentMonth = format(new Date(), 'MMM yyyy');
    return ledgerEntries.filter(e => e.month === currentMonth && e.status === 'unpaid');
  }, [ledgerEntries]);

  // Actions
  const handleDeleteRoom = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      await deleteRoom(id);
      toast.success('Room deleted');
      loadDashboardData();
    }
  };

  const handleToggleVacancy = async (id: string, currentAvailable: boolean) => {
    await updateRoom(id, { available: !currentAvailable });
    toast.success(`Room marked as ${!currentAvailable ? 'Vacant' : 'Occupied'}`);
    loadDashboardData();
  };

  const handleEndTenancy = async (tenantId: string, roomId: string) => {
    if (window.confirm('Are you sure you want to end this tenancy?')) {
      await supabase.from('tenants').update({ status: 'past', move_out_date: format(new Date(), 'yyyy-MM-dd') }).eq('id', tenantId);
      await updateRoom(roomId, { available: true });
      toast.success('Tenancy ended. Room is now vacant.');
      loadDashboardData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-100">
                <Home size={20}/>
             </div>
             <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tighter">Landlord Portal</h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{profile?.full_name}</p>
             </div>
          </div>
          <button
            onClick={() => navigate('/add-room')}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-gray-200"
          >
            <Plus size={18}/>
            <span>New Property</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6">
        {/* STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Properties</p>
             <p className="text-3xl font-black text-gray-900 tracking-tighter">{landlordRooms.length}</p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
             <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Occupied</p>
             <p className="text-3xl font-black text-gray-900 tracking-tighter">{occupiedCount}</p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
             <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Vacant</p>
             <p className="text-3xl font-black text-gray-900 tracking-tighter">{vacantCount}</p>
          </div>
          <div className="bg-emerald-600 p-5 rounded-3xl shadow-xl shadow-emerald-100">
             <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-1">Rent Collected</p>
             <p className="text-3xl font-black text-white tracking-tighter">₹{rentCollected.toLocaleString()}</p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 mb-8 overflow-x-auto no-scrollbar">
          {[
            { id: 'rooms', label: 'Properties', icon: DoorOpen },
            { id: 'tenants', label: 'Tenants', icon: Users },
            { id: 'ledger', label: 'KhataBook', icon: BookOpen },
            { id: 'reminders', label: 'Compliance', icon: ShieldAlert }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-fit px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
              {tab.id === 'reminders' && unpaidThisMonth.length > 0 && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>
          ))}
        </div>

        {/* CONTENT AREA */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
             <div className="w-12 h-12 border-4 border-slate-200 border-t-green-600 rounded-full animate-spin"></div>
             <p className="font-bold text-slate-400 animate-pulse">Refreshing your portfolio...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'rooms' && (
              <>
                <div className="flex justify-between items-center mb-2">
                   <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Your Properties</h2>
                   <div className="flex gap-2">
                      <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">Live</div>
                   </div>
                </div>
                {landlordRooms.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-[32px] p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Plus className="text-slate-300" />
                    </div>
                    <h3 className="font-black text-gray-900 mb-2">No properties yet</h3>
                    <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">Start by adding your first rental property to manage tenants and rent collection.</p>
                    <button onClick={() => navigate('/add-room')} className="bg-green-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-green-700 transition-all">Add Property</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {landlordRooms.map(room => (
                      <div key={room.id} className="relative group">
                        <RoomCard room={room} />
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => handleToggleVacancy(room.id, room.available)} className="bg-white/90 backdrop-blur p-2 rounded-xl shadow-lg text-gray-700 hover:text-green-600">
                             {room.available ? <Users size={16}/> : <DoorOpen size={16}/>}
                           </button>
                           <button onClick={() => handleDeleteRoom(room.id, room.title)} className="bg-white/90 backdrop-blur p-2 rounded-xl shadow-lg text-gray-700 hover:text-red-600">
                             <Trash2 size={16}/>
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'tenants' && (
              <>
                <div className="flex justify-between items-center mb-2">
                   <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Active Tenants</h2>
                   <button
                     onClick={() => {
                        if (vacantRoomsList.length === 0) {
                           toast.error('No vacant rooms available');
                           return;
                        }
                        setIsAddTenantModalOpen(true);
                     }}
                     className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2"
                   >
                     <Plus size={16}/>
                     <span>Add Tenant</span>
                   </button>
                </div>
                {tenants.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-[32px] p-12 text-center">
                    <Users className="text-slate-200 mx-auto mb-4" size={48} />
                    <h3 className="font-black text-gray-900 mb-2">No active tenants</h3>
                    <p className="text-gray-500 text-sm">Move in tenants to start tracking payments.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tenants.map(tenant => (
                      <div key={tenant.id} className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-gray-400 font-black text-xl">
                              {tenant.profiles?.full_name?.charAt(0)}
                            </div>
                            <div>
                               <h4 className="font-black text-gray-900 text-lg leading-tight">{tenant.profiles?.full_name}</h4>
                               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{tenant.rooms?.title}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                             <a href={`tel:${tenant.profiles?.phone}`} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-gray-500 hover:bg-green-50 hover:text-green-600 transition-colors">
                                <Phone size={18}/>
                             </a>
                             <button
                                onClick={() => setSelectedDossierTenant(tenant)}
                                className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                             >
                                <FileText size={18}/>
                             </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                           <div className="bg-slate-50 p-3 rounded-2xl">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Monthly Rent</p>
                              <p className="font-black text-gray-900">₹{tenant.rent_amount.toLocaleString()}</p>
                           </div>
                           <div className="bg-slate-50 p-3 rounded-2xl">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Move In</p>
                              <p className="font-black text-gray-900">{format(parseISO(tenant.move_in_date), 'dd MMM yyyy')}</p>
                           </div>
                        </div>

                        <div className="flex gap-3">
                           <button 
                             onClick={() => handleEndTenancy(tenant.id, tenant.room_id)}
                             className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl font-bold text-xs hover:bg-red-100 transition-colors"
                           >
                             End Tenancy
                           </button>
                           <button 
                             onClick={() => setActiveTab('ledger')}
                             className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold text-xs hover:bg-gray-800 transition-colors"
                           >
                             View Ledger
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'ledger' && (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                   <div>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Rent KhataBook</h2>
                      <p className="text-xs font-bold text-gray-400">Track and manage all rent payments</p>
                   </div>
                   <button
                     onClick={() => setIsUtilModalOpen(true)}
                     className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-100"
                   >
                     <Bell size={18}/>
                     <span>Split Utility Bill</span>
                   </button>
                </div>
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                  <RentLedgerTable
                    ledgerEntries={ledgerEntries as any}
                    onUpdate={updateLedgerEntry}
                  />
                </div>
              </>
            )}

            {activeTab === 'reminders' && (
              <div className="max-w-3xl mx-auto">
                 <h2 className="text-2xl font-black text-gray-900 tracking-tighter mb-6">Compliance & Alerts</h2>
                 <VerificationCenter />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADD TENANT MODAL */}
      {isAddTenantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" onClick={() => setIsAddTenantModalOpen(false)}></div>
          <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative z-10">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-gray-900 tracking-tighter">New Tenancy</h3>
                <button onClick={() => setIsAddTenantModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                setAddingTenant(true);
                try {
                  // 1. Create Profile first (or find existing) - simple version creates new profile
                  // In a real app, we would search by phone or invite.
                  // For this demo, we assume a profile already exists or we use a dummy ID.
                  const dummyProfileId = '77777777-7777-7777-7777-777777777777'; // Mock

                  // 2. Insert Tenant
                  const { data: newTenant, error: tenantError } = await supabase
                    .from('tenants')
                    .insert([{
                      landlord_id: profile!.id,
                      room_id: tenantRoomId,
                      tenant_profile_id: dummyProfileId,
                      rent_amount: parseFloat(tenantRent),
                      move_in_date: tenantMoveIn,
                      status: 'active'
                    }])
                    .select()
                    .single();

                  if (tenantError) throw tenantError;

                  // 3. Mark Room as occupied
                  await updateRoom(tenantRoomId, { available: false });

                  // 4. Create Ledger Entries for next 6 months
                  const nextMonths = Array.from({ length: 6 }).map((_, i) => format(subMonths(new Date(), -i), 'MMM yyyy'));
                  await createLedgerEntries(newTenant.id, profile!.id, parseFloat(tenantRent), nextMonths);

                  toast.success('Tenant added & ledger initialized!');
                  setIsAddTenantModalOpen(false);
                  loadDashboardData();
                } catch (err) {
                  toast.error('Failed to add tenant');
                  console.error(err);
                } finally {
                  setAddingTenant(false);
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Property / Room</label>
                  <select 
                    value={tenantRoomId} onChange={(e) => setTenantRoomId(e.target.value)}
                    required
                    className="w-full px-4 py-3 min-h-[44px] bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium text-gray-800 text-base"
                  >
                    <option value="">Select a vacant room</option>
                    {vacantRoomsList.map(r => <option key={r.id} value={r.id}>{r.title} - ₹{r.rent_amount}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Tenant Name</label>
                  <input 
                    type="text" 
                    value={tenantName} onChange={(e) => setTenantName(e.target.value)}
                    required placeholder="Full Name"
                    className="w-full px-4 py-3 min-h-[44px] bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium text-gray-800 text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone Number</label>
                  <input 
                    type="tel" 
                    value={tenantPhone} onChange={(e) => setTenantPhone(e.target.value)}
                    required placeholder="+91"
                    className="w-full px-4 py-3 min-h-[44px] bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium text-gray-800 text-base"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Rent Amount</label>
                    <input 
                      type="number" 
                      value={tenantRent} onChange={(e) => setTenantRent(e.target.value)}
                      required placeholder="₹"
                      className="w-full px-4 py-3 min-h-[44px] bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-bold text-gray-900 text-base"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Move-In Date</label>
                    <input 
                      type="date" 
                      value={tenantMoveIn} onChange={(e) => setTenantMoveIn(e.target.value)}
                      required
                      className="w-full px-4 py-3 min-h-[44px] bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium text-gray-800 text-base"
                    />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button 
                    type="submit" 
                    disabled={addingTenant}
                    className={`w-full font-bold py-4 min-h-[44px] rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${addingTenant ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20 active:scale-[0.98]'}`}
                  >
                    {addingTenant ? 'Adding Tenant Framework...' : 'Save Tenant & Create Ledger'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* UTILITY BILLING MODAL */}
      {isUtilModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsUtilModalOpen(false)}></div>
          
          <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8 flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                      <IndianRupee size={20}/>
                   </div>
                   <h3 className="text-2xl font-black text-gray-900 tracking-tighter">Split Utility Bill</h3>
                </div>
                <button 
                  onClick={() => setIsUtilModalOpen(false)} 
                  className="bg-gray-100 hover:bg-gray-200 p-2 min-w-[44px] min-h-[44px] rounded-full text-gray-500 transition-colors flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-5">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                   <p className="text-xs font-bold text-indigo-800 leading-relaxed">
                      💡 <strong>Shared Split Strategy:</strong> Enter the building's total bill. It will be divided equally across selected active tenants.
                   </p>
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-1.5 ml-1">Total Bill Amount (₹)</label>
                  <input 
                    type="number" 
                    value={utilTotalAmount} onChange={(e) => setUtilTotalAmount(e.target.value)}
                    required placeholder="e.g. 5400"
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-black text-gray-900 text-xl"
                  />
                </div>

                <div>
                   <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-1.5 ml-1">Billing Month</label>
                   <select 
                     value={utilMonth}
                     onChange={(e) => setUtilMonth(e.target.value)}
                     className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-black text-gray-800 text-lg appearance-none"
                   >
                     {Array.from({ length: 6 }).map((_, i) => {
                        const m = format(subMonths(new Date(), i), 'MMM yyyy');
                        return <option key={m} value={m}>{m}</option>
                     })}
                   </select>
                </div>

                <div>
                   <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-1.5 ml-1">Included Tenants ({selectedTenantsForUtil.length})</label>
                   <div className="max-h-48 overflow-y-auto border-2 border-gray-50 rounded-2xl p-3 flex flex-col gap-2 bg-slate-50/30">
                      {tenants.map(t => (
                        <label key={t.id} className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer border-2 transition-all ${selectedTenantsForUtil.includes(t.id) ? 'bg-white border-indigo-200 shadow-sm' : 'border-transparent opacity-60'}`}>
                           <input 
                             type="checkbox" 
                             checked={selectedTenantsForUtil.includes(t.id)}
                             onChange={(e) => {
                                if (e.target.checked) setSelectedTenantsForUtil([...selectedTenantsForUtil, t.id]);
                                else setSelectedTenantsForUtil(selectedTenantsForUtil.filter(id => id !== t.id));
                             }}
                             className="w-5 h-5 accent-indigo-600 rounded-md"
                           />
                           <div className="flex flex-col">
                              <span className="font-black text-sm text-gray-900 leading-tight">{t.profiles?.full_name}</span>
                              <span className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">{t.rooms?.title}</span>
                           </div>
                        </label>
                      ))}
                   </div>
                </div>

                {utilTotalAmount && selectedTenantsForUtil.length > 0 && (
                   <div className="p-5 bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-100 rounded-[2rem] flex justify-between items-center mt-2 shadow-inner">
                      <div>
                         <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Individual Share</p>
                         <p className="text-3xl font-black text-emerald-800 tracking-tighter">₹{Math.round(parseFloat(utilTotalAmount) / selectedTenantsForUtil.length).toLocaleString()}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-[spin_3s_linear_infinite]"></div>
                   </div>
                )}

                <div className="mt-4 pt-6 border-t border-gray-100">
                  <button 
                    onClick={async () => {
                       if (!utilTotalAmount || selectedTenantsForUtil.length === 0) {
                          toast.error('Please fill all fields');
                          return;
                       }
                       setApplyingUtil(true);
                       const { error } = await applyBulkUtilityBill(profile!.id, utilMonth, parseFloat(utilTotalAmount), selectedTenantsForUtil);
                       setApplyingUtil(false);
                       if (error) toast.error('Error applying bill: ' + (error as any).message);
                       else {
                          toast.success('Building bill split successfully! ⚡');
                          setIsUtilModalOpen(false);
                          loadDashboardData();
                       }
                    }}
                    disabled={applyingUtil}
                    className={`w-full font-black py-5 rounded-[2rem] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${applyingUtil ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'}`}
                  >
                    {applyingUtil ? (
                       <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Calculating Shares...</span>
                       </div>
                    ) : (
                       <>
                          <IndianRupee size={20} />
                          <span>Finalize & Update Ledger</span>
                       </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Hidden Digital Dossier for Printing */}
      {selectedDossierTenant && <DigitalDossier tenant={selectedDossierTenant} />}
    </div>
  );
}
