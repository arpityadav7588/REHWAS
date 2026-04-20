import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DigitalCertificate } from '../DigitalCertificate';
import type { Profile, RentLedger } from '@/types';

describe('DigitalCertificate', () => {
  const mockProfile: Profile = {
    id: '12345678-abcd-efgh-ijkl-1234567890ab',
    full_name: 'John Doe',
    phone: '1234567890',
    role: 'tenant',
    kyc_status: 'verified',
    kyc_verified: true,
    bhoomi_score: 800,
    created_at: new Date().toISOString(),
  };

  const mockHistory: RentLedger[] = [
    { id: '1', tenant_id: '123', landlord_id: '456', month: '2023-01', amount: 1000, status: 'paid' },
    { id: '2', tenant_id: '123', landlord_id: '456', month: '2023-02', amount: 1000, status: 'paid' },
    { id: '3', tenant_id: '123', landlord_id: '456', month: '2023-03', amount: 1000, status: 'unpaid' },
  ];

  beforeEach(() => {
    vi.stubGlobal('print', vi.fn());
  });

  it('renders correctly with profile and history data', () => {
    render(<DigitalCertificate profile={mockProfile} history={mockHistory} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText(/ID: 12345678/)).toBeInTheDocument();
    expect(screen.getByText('800')).toBeInTheDocument();
    expect(screen.getByText(/2 Months/)).toBeInTheDocument();
    expect(screen.getByText(/Verified Citizen/)).toBeInTheDocument();
  });

  it('displays Elite Tier for scores above 750', () => {
    render(<DigitalCertificate profile={mockProfile} history={mockHistory} />);
    expect(screen.getByText('Elite Tier')).toBeInTheDocument();
    expect(screen.getByText('EXCELLENT')).toBeInTheDocument();
  });

  it('displays Standard Tier for scores below or equal to 750', () => {
    const lowScoreProfile = { ...mockProfile, bhoomi_score: 700 };
    render(<DigitalCertificate profile={lowScoreProfile} history={mockHistory} />);
    expect(screen.getByText('Standard Tier')).toBeInTheDocument();
    expect(screen.getByText('GOOD')).toBeInTheDocument();
  });

  it('uses default score of 450 if bhoomi_score is missing', () => {
    const missingScoreProfile = { ...mockProfile, bhoomi_score: undefined };
    render(<DigitalCertificate profile={missingScoreProfile} history={mockHistory} />);
    expect(screen.getByText('450')).toBeInTheDocument();
    expect(screen.getByText('Standard Tier')).toBeInTheDocument();
  });

  it('displays Registered User when KYC is not verified', () => {
    const unverifiedProfile = { ...mockProfile, kyc_status: 'none' as const };
    render(<DigitalCertificate profile={unverifiedProfile} history={mockHistory} />);
    expect(screen.getByText(/Registered User/)).toBeInTheDocument();
  });

  it('calls window.print when Download button is clicked', () => {
    render(<DigitalCertificate profile={mockProfile} history={mockHistory} />);
    const downloadButton = screen.getByRole('button', { name: /Download Rental Passport/i });
    fireEvent.click(downloadButton);
    expect(window.print).toHaveBeenCalledTimes(1);
  });
});
