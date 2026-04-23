import { useState } from 'react';

/**
 * useCommute Hook
 * 
 * WHAT IT DOES: 
 * Upgrades REHWAS from mock data to real-world routing using OSRM and Nominatim.
 * 
 * 1. OSRM (Open Source Routing Machine): 
 *    Analogy: It's like Google Maps but 100% free and open-source. It uses 
 *    OpenStreetMap data maintained by thousands of volunteers to calculate routes.
 * 
 * 2. GEOCONDING: 
 *    Analogy: Think of it as a "Map Phonebook." It converts a human-readable 
 *    address (like "Manyata Tech Park") into GPS coordinates (Lat/Lng) that 
 *    computers can understand.
 * 
 * 3. PEAK HOUR MULTIPLIER (1.4x): 
 *    Analogy: Like how a 20-minute walk takes 28 minutes when you're carrying 
 *    heavy bags, peak traffic adds a "weight" to your travel time. We use 
 *    a 40% buffer to reflect Indian city traffic realities.
 * 
 * @returns {Object} { drivingMins, peakMins, distanceKm, officeCoords, loading, error, calculateCommute }
 */
export const useCommute = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Return values requested
  const [drivingMins, setDrivingMins] = useState<number>(0);
  const [peakMins, setPeakMins] = useState<number>(0);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [officeCoords, setOfficeCoords] = useState<{ lat: number; lng: number } | null>(null);

  /**
   * Calculates commute using Nominatim for geocoding and OSRM for routing.
   * 
   * @param roomLat - Latitude of the room
   * @param roomLng - Longitude of the room
   * @param officeAddress - Human readable address of the destination
   */
  const calculateCommute = async (roomLat: number, roomLng: number, officeAddress: string) => {
    if (!roomLat || !roomLng) {
      setError("Location not pinned — cannot calculate commute");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // STEP 1: Geocoding with Nominatim
      // Nominatim requires a User-Agent header to identify the application.
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(officeAddress)}&format=json&limit=1&countrycodes=in`,
        {
          headers: {
            'User-Agent': 'REHWAS/1.0 (contact@rehwas.in)'
          }
        }
      );

      const geoResults = await geoResponse.json();

      if (!geoResults || geoResults.length === 0) {
        throw new Error("Could not find that address. Try adding the city name.");
      }

      const oLat = parseFloat(geoResults[0].lat);
      const oLng = parseFloat(geoResults[0].lon);
      setOfficeCoords({ lat: oLat, lng: oLng });

      // STEP 2: Routing with OSRM
      // Base URL for OSRM driving profile.
      const routeResponse = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${roomLng},${roomLat};${oLng},${oLat}?overview=false&annotations=false`
      );

      const routeData = await routeResponse.json();

      if (routeData.code !== 'Ok' || !routeData.routes || routeData.routes.length === 0) {
        throw new Error("Route calculation unavailable. Please try Google Maps.");
      }

      const route = routeData.routes[0];
      const durationSeconds = route.duration; // OSRM returns duration in seconds
      const distanceMeters = route.distance;   // OSRM returns distance in meters

      const dMins = Math.round(durationSeconds / 60);
      const dKm = parseFloat((distanceMeters / 1000).toFixed(1));
      
      // Calculate peak-hour estimate: multiply duration by 1.4 (40% slower in traffic)
      const pMins = Math.round(dMins * 1.4);

      setDrivingMins(dMins);
      setDistanceKm(dKm);
      setPeakMins(pMins);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during calculation.");
      setOfficeCoords(null);
    } finally {
      setLoading(false);
    }
  };

  return { 
    drivingMins, 
    peakMins, 
    distanceKm, 
    officeCoords, 
    loading, 
    error, 
    calculateCommute 
  };
};
