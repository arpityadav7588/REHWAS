import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';
import { useKYC } from './useKYC';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

// Mock dependencies
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useKYC', () => {
  const mockRefreshProfile = vi.fn();
  const mockedUseAuth = useAuth as Mock;
  const mockedSupabaseFrom = supabase.from as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockedUseAuth.mockReturnValue({
      profile: { id: 'user-123', kyc_status: 'none' },
      refreshProfile: mockRefreshProfile,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with correct state', () => {
    const { result } = renderHook(() => useKYC());
    expect(result.current.isVerifying).toBe(false);
    expect(result.current.kycStatus).toBe('none');
  });

  it('should not start verification if no profile', async () => {
    mockedUseAuth.mockReturnValue({
      profile: null,
      refreshProfile: mockRefreshProfile,
    });

    const { result } = renderHook(() => useKYC());

    await act(async () => {
      await result.current.startVerification('1234');
    });

    expect(result.current.isVerifying).toBe(false);
    expect(mockedSupabaseFrom).not.toHaveBeenCalled();
  });

  it('should show error for invalid Aadhaar format', async () => {
    const { result } = renderHook(() => useKYC());

    await act(async () => {
      const promise = result.current.startVerification('123');
      vi.advanceTimersByTime(2000);
      await promise;
    });

    expect(toast.error).toHaveBeenCalledWith('Invalid Aadhaar format. Need last 4 digits.');
    expect(result.current.isVerifying).toBe(false);
  });

  it('should complete verification successfully', async () => {
    mockedSupabaseFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    });

    const { result } = renderHook(() => useKYC());

    await act(async () => {
      const promise = result.current.startVerification('1234');
      vi.advanceTimersByTime(2000);
      await promise;
    });

    expect(mockedSupabaseFrom).toHaveBeenCalledWith('profiles');
    expect(toast.success).toHaveBeenCalledWith('Identity Verified! Welcome to the Trusted Circle 🛡️');
    expect(mockRefreshProfile).toHaveBeenCalled();
    expect(result.current.isVerifying).toBe(false);
  });

  it('should handle supabase error during verification', async () => {
    const mockError = { message: 'Update failed' };
    mockedSupabaseFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: mockError })),
      })),
    });

    const { result } = renderHook(() => useKYC());

    await act(async () => {
      const promise = result.current.startVerification('1234');
      vi.advanceTimersByTime(2000);
      await promise;
    });

    expect(toast.error).toHaveBeenCalledWith('Verification failed. Please try again.');
    expect(result.current.isVerifying).toBe(false);
  });
});
