-- STEP 1: CREATE THE SUPABASE RPC FUNCTION
-- WHAT IT DOES: Fetches 12 months of historical average rent for a specific locality, room type, and city.
-- ANALOGY: This is an RPC (Remote Procedure Call). It's like asking the database a complex 
-- question in its own language ("Hey, give me the monthly trend for 1BHKs in Koramangala") 
-- instead of making 10 separate simple requests and doing the math in your head.

CREATE OR REPLACE FUNCTION get_locality_rent_history(
  p_locality TEXT,
  p_city TEXT,
  p_room_type TEXT
)
RETURNS TABLE (month TEXT, avg_rent NUMERIC, listing_count INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(r.created_at, 'YYYY-MM') AS month,
    ROUND(AVG(r.rent_amount), 0) AS avg_rent,
    COUNT(*)::INTEGER AS listing_count
  FROM rooms r
  WHERE
    LOWER(r.locality) = LOWER(p_locality)
    AND LOWER(r.city) = LOWER(p_city)
    AND r.room_type = p_room_type
    AND r.created_at >= NOW() - INTERVAL '12 months'
  GROUP BY TO_CHAR(r.created_at, 'YYYY-MM')
  ORDER BY month ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
