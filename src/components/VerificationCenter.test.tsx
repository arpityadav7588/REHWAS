import { render, screen, fireEvent } from '@testing-library/react';
import { VerificationCenter } from './VerificationCenter';
import { useKYC } from '@/hooks/useKYC';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

// Mock useKYC hook
vi.mock('@/hooks/useKYC', () => ({
  useKYC: vi.fn(),
}));

describe('VerificationCenter', () => {
  const mockStartVerification = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Identity Fully Verified" when kycStatus is "verified"', () => {
    (useKYC as Mock).mockReturnValue({
      isVerifying: false,
      startVerification: mockStartVerification,
      kycStatus: 'verified',
    });

    render(<VerificationCenter />);

    expect(screen.getByText('Identity Fully Verified')).toBeInTheDocument();
    expect(screen.getByText('You have 100% trust score on the platform.')).toBeInTheDocument();
    expect(screen.getByText('Verified Resident')).toBeInTheDocument();
  });

  it('renders "Get Your Verified Badge" when kycStatus is not "verified"', () => {
    (useKYC as Mock).mockReturnValue({
      isVerifying: false,
      startVerification: mockStartVerification,
      kycStatus: 'none',
    });

    render(<VerificationCenter />);

    expect(screen.getByText(/Get Your Verified Badge/)).toBeInTheDocument();
    expect(screen.getByText(/Boost your trust score by 40%/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Aadhaar KYC/i })).toBeInTheDocument();
  });

  it('shows Aadhaar input when "Start Aadhaar KYC" is clicked', () => {
    (useKYC as Mock).mockReturnValue({
      isVerifying: false,
      startVerification: mockStartVerification,
      kycStatus: 'none',
    });

    render(<VerificationCenter />);

    const startButton = screen.getByRole('button', { name: /Start Aadhaar KYC/i });
    fireEvent.click(startButton);

    expect(screen.getByPlaceholderText('Last 4 Digits of Aadhaar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verify/i })).toBeInTheDocument();
  });

  it('enables the verify button only when 4 digits are entered', () => {
    (useKYC as Mock).mockReturnValue({
      isVerifying: false,
      startVerification: mockStartVerification,
      kycStatus: 'none',
    });

    render(<VerificationCenter />);

    fireEvent.click(screen.getByRole('button', { name: /Start Aadhaar KYC/i }));

    const input = screen.getByPlaceholderText('Last 4 Digits of Aadhaar');
    const verifyButton = screen.getByRole('button', { name: /Verify/i });

    expect(verifyButton).toBeDisabled();

    fireEvent.change(input, { target: { value: '123' } });
    expect(verifyButton).toBeDisabled();

    fireEvent.change(input, { target: { value: '1234' } });
    expect(verifyButton).not.toBeDisabled();
  });

  it('calls startVerification when the verify button is clicked', () => {
    (useKYC as Mock).mockReturnValue({
      isVerifying: false,
      startVerification: mockStartVerification,
      kycStatus: 'none',
    });

    render(<VerificationCenter />);

    fireEvent.click(screen.getByRole('button', { name: /Start Aadhaar KYC/i }));

    const input = screen.getByPlaceholderText('Last 4 Digits of Aadhaar');
    fireEvent.change(input, { target: { value: '1234' } });

    const verifyButton = screen.getByRole('button', { name: /Verify/i });
    fireEvent.click(verifyButton);

    expect(mockStartVerification).toHaveBeenCalledWith('1234');
  });

  it('shows loader when isVerifying is true', () => {
    (useKYC as Mock).mockReturnValue({
      isVerifying: true,
      startVerification: mockStartVerification,
      kycStatus: 'none',
    });

    render(<VerificationCenter />);

    // Click to show input state
    fireEvent.click(screen.getByRole('button', { name: /Start Aadhaar KYC/i }));

    // We can't easily find Loader2 by text, but it's rendered when isVerifying is true
    // In our component: {isVerifying ? <Loader2 size={16} className="animate-spin" /> : 'Verify'}
    // So the 'Verify' text should NOT be present if it's verifying
    expect(screen.queryByText('Verify')).not.toBeInTheDocument();
  });
});
