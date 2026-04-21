import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * usePlatformStats Hook
 * 
 * WHAT IT DOES: Fetches real-time platform metrics directly from the source of truth.
 * 
 * PRINCIPLE: Faking numbers destroys the #1 asset of a marketplace: Trust.
 * This hook ensures that every number displayed on the home page is backed by a DB record.
 */
export const usePlatformStats = () => {
  const [stats, setStats] = useState({
    rooms: 0,
    tenants: 0,
    cityCounts: {} as Record<string, number>,
    loading: true
  });

  const fetchStats = async () => {
    // REAL DATA ONLY — this number comes from the database.
    // Never replace this with a hardcoded value.
    const { count: roomCount } = await supabase
      .from('rooms')
      .select('id', { count: 'exact', head: true })
      .eq('available', true);

    // REAL DATA ONLY — this number comes from the database.
    // Never replace this with a hardcoded value.
    const { count: userCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'tenant');

    // REAL DATA ONLY — this number comes from the database.
    // Never replace this with a hardcoded value.
    const { data: cityData } = await supabase
      .from('rooms')
      .select('city')
      .eq('available', true);

    const cityCounts: Record<string, number> = {};
    cityData?.forEach(room => {
      const city = room.city;
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    });

    setStats({
      rooms: roomCount || 0,
      tenants: userCount || 0,
      cityCounts,
      loading: false
    });
  };

  useEffect(() => {
    fetchStats();
  }, []);

  /**
   * Formats the room count based on launch-phase rules.
   */
  const formatRoomCount = () => {
    if (stats.loading) return null;
    if (stats.rooms < 10) return "Be among the first 10 landlords to list →";
    if (stats.rooms < 100) return `${stats.rooms} rooms live`;
    // Round down to nearest 10 for 100+
    const rounded = Math.floor(stats.rooms / 10) * 10;
    return `${rounded}+ rooms`;
  };

  return {
    ...stats,
    formattedRooms: formatRoomCount(),
  };
};
