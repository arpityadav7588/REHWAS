import { render, screen, fireEvent } from '@testing-library/react';
import { VerificationCenter } from './VerificationCenter';
import { useKYC } from '@/hooks/useKYC';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

// Mock the dependencies of VerificationCenter
vi.mock('@/hooks/useKYC');
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

describe('VerificationCenter', () => {
  const mockStartVerification = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Start Aadhaar KYC" button when not verified', () => {
    (useKYC as Mock).mockReturnValue({
      isVerifying: false,
      startVerification: mockStartVerification,
      kycStatus: 'none',
    });

    render(<VerificationCenter />);

    expect(screen.getByText(/Start Aadhaar KYC/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Last 4 Digits of Aadhaar/i)).not.toBeInTheDocument();
  });

  it('shows Aadhaar input field when "Start Aadhaar KYC" is clicked', () => {
    (useKYC as Mock).mockReturnValue({
      isVerifying: false,
      startVerification: mockStartVerification,
      kycStatus: 'none',
    });

    render(<VerificationCenter />);

    const startButton = screen.getByText(/Start Aadhaar KYC/i);
    fireEvent.click(startButton);

    expect(screen.getByPlaceholderText(/Last 4 Digits of Aadhaar/i)).toBeInTheDocument();
    expect(startButton).not.toBeInTheDocument();
  });

  it('enables "Verify" button only when 4 digits are entered', () => {
    (useKYC as Mock).mockReturnValue({
      isVerifying: false,
      startVerification: mockStartVerification,
      kycStatus: 'none',
    });

    render(<VerificationCenter />);

    fireEvent.click(screen.getByText(/Start Aadhaar KYC/i));

    const input = screen.getByPlaceholderText(/Last 4 Digits of Aadhaar/i);
    const verifyButton = screen.getByText(/Verify/i);

    expect(verifyButton).toBeDisabled();

    fireEvent.change(input, { target: { value: '123' } });
    expect(verifyButton).toBeDisabled();

    fireEvent.change(input, { target: { value: '1234' } });
    expect(verifyButton).not.toBeDisabled();
  });

  it('calls startVerification when "Verify" button is clicked', () => {
    (useKYC as Mock).mockReturnValue({
      isVerifying: false,
      startVerification: mockStartVerification,
      kycStatus: 'none',
    });

    render(<VerificationCenter />);

    fireEvent.click(screen.getByText(/Start Aadhaar KYC/i));

    const input = screen.getByPlaceholderText(/Last 4 Digits of Aadhaar/i);
    fireEvent.change(input, { target: { value: '1234' } });

    const verifyButton = screen.getByText(/Verify/i);
    fireEvent.click(verifyButton);

    expect(mockStartVerification).toHaveBeenCalledWith('1234');
  });

  it('renders "Identity Fully Verified" when status is verified', () => {
    (useKYC as Mock).mockReturnValue({
      isVerifying: false,
      startVerification: mockStartVerification,
      kycStatus: 'verified',
    });

    render(<VerificationCenter />);

    expect(screen.getByText(/Identity Fully Verified/i)).toBeInTheDocument();
    expect(screen.getByText(/You have 100% trust score on the platform/i)).toBeInTheDocument();
    expect(screen.getByText(/Verified Resident/i)).toBeInTheDocument();
  });

  it('shows loading spinner when isVerifying is true', () => {
    (useKYC as Mock).mockReturnValue({
      isVerifying: true,
      startVerification: mockStartVerification,
      kycStatus: 'none',
    });

    render(<VerificationCenter />);

    // Click to show input
    fireEvent.click(screen.getByText(/Start Aadhaar KYC/i));

    // Input 4 digits
    const input = screen.getByPlaceholderText(/Last 4 Digits of Aadhaar/i);
    fireEvent.change(input, { target: { value: '1234' } });

    // Verify button should show loader (it's a Lucide icon, let's check for the button being disabled or by test id if we added one, but here we can check for no "Verify" text if it's replaced or just the icon)
    // Looking at the code: {isVerifying ? <Loader2 size={16} className="animate-spin" /> : 'Verify'}
    expect(screen.queryByText('Verify')).not.toBeInTheDocument();
  });
});
