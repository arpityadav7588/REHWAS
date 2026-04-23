import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Room } from '@/types';

/**
 * Custom hook to manage Room data.
 * WHAT IT DOES: Provides functions to fetch, add, update, and soft-delete rooms in the Supabase database.
 * ANALOGY: A real estate agent coordinating between you (the app) and the master property ledger (the database).
 */
export const useRooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetches rooms based on optional filters.
   * WHAT IT DOES: Queries the 'rooms' table, optionally filtering by city, type, or rent.
   * ANALOGY: Asking the real estate agent to only show you 1BHKs in Bengaluru under ₹15,000.
   */
  const fetchRooms = async (filters?: { city?: string; room_type?: string; max_rent?: number }) => {
    setLoading(true);
    let query = supabase.from('rooms').select('*').eq('available', true);

    if (filters?.city) query = query.ilike('city', filters.city);
    if (filters?.room_type) query = query.eq('room_type', filters.room_type);
    if (filters?.max_rent) query = query.lte('rent_amount', filters.max_rent);

    query = query.order('boosted_until', { ascending: false, nullsFirst: false })
                 .order('created_at', { ascending: false });

    const { data, error } = await query;
    setLoading(false);
    
    if (!error && data) {
      setRooms(data as Room[]);
    }
    return { data, error };
  };

  /**
   * Fetches a single room by its ID.
   * WHAT IT DOES: Retrieves all details for one specific room.
   * ANALOGY: Asking the agent for the full brochure of a single property you liked.
   */
  const fetchRoomById = async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rooms')
      .select('*, profiles(full_name, phone, avatar_url)')
      .eq('id', id)
      .single();
    setLoading(false);
    return { data, error };
  };

  /**
   * Inserts a new room into the database.
   * WHAT IT DOES: Creates a new row in the 'rooms' table with the provided data.
   * ANALOGY: The agent officially adding your new property to the public marketplace.
   */
  const addRoom = async (data: Partial<Room>) => {
    setLoading(true);
    
    const insertData = { ...data };
    // Auto-set vacancy date if created as available
    if (data.available === true) {
      insertData.vacant_since = new Date().toISOString().split('T')[0];
    }

    const { data: newRoom, error } = await supabase
      .from('rooms')
      .insert([insertData])
      .select()
      .single();
    setLoading(false);
    return { data: newRoom, error };
  };

  /**
   * Updates an existing room's details.
   * WHAT IT DOES: Modifies specific fields and manages vacancy timestamps.
   * ANALOGY: Updating your property listing to say "Newly Painted!" instead of just "1BHK".
   */
  const updateRoom = async (id: string, data: Partial<Room>) => {
    setLoading(true);
    
    const updateData = { ...data };
    
    // Auto-manage vacant_since if availability is toggled
    if (data.available === true) {
      updateData.vacant_since = new Date().toISOString().split('T')[0];
    } else if (data.available === false) {
      updateData.vacant_since = null;
    }

    const { error } = await supabase
      .from('rooms')
      .update(updateData)
      .eq('id', id);
    setLoading(false);
    return { error };
  };

  /**
   * Soft-deletes a room by marking it unavailable.
   * WHAT IT DOES: Sets the 'available' status to false without deleting the row permanently.
   * ANALOGY: Taking down the "For Rent" sign from the yard without knocking down the house.
   */
  const deleteRoom = async (id: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('rooms')
      .update({ available: false, vacant_since: null })
      .eq('id', id);
    setLoading(false);
    return { error };
  };

  return {
    rooms,
    loading,
    fetchRooms,
    fetchRoomById,
    addRoom,
    updateRoom,
    deleteRoom
  };
};
