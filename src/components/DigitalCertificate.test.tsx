import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DigitalCertificate } from './DigitalCertificate';
import type { Profile, RentLedger } from '@/types';

// Mock window.print
vi.stubGlobal('print', vi.fn());

const mockProfile: Profile = {
  id: 'user-12345678',
  full_name: 'John Doe',
  phone: '1234567890',
  role: 'tenant',
  kyc_status: 'verified',
  kyc_verified: true,
  bhoomi_score: 800,
  created_at: new Date().toISOString(),
};

const mockHistory: RentLedger[] = [
  { id: '1', tenant_id: 't1', landlord_id: 'l1', month: '2023-01', amount: 1000, status: 'paid' },
  { id: '2', tenant_id: 't1', landlord_id: 'l1', month: '2023-02', amount: 1000, status: 'paid' },
  { id: '3', tenant_id: 't1', landlord_id: 'l1', month: '2023-03', amount: 1000, status: 'unpaid' },
];

describe('DigitalCertificate', () => {
  it('renders holder name and truncated ID', () => {
    render(<DigitalCertificate profile={mockProfile} history={mockHistory} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    // Use a more flexible matcher since ID might be split across text nodes
    expect(screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'p' && content.includes('ID:') && content.includes('USER-123');
    })).toBeInTheDocument();
  });

  it('renders correct Bhoomi score and tier', () => {
    const { rerender } = render(<DigitalCertificate profile={mockProfile} history={mockHistory} />);

    expect(screen.getByText('800')).toBeInTheDocument();
    expect(screen.getByText('Elite Tier')).toBeInTheDocument();

    const lowScoreProfile = { ...mockProfile, bhoomi_score: 600 };
    rerender(<DigitalCertificate profile={lowScoreProfile} history={mockHistory} />);

    expect(screen.getByText('600')).toBeInTheDocument();
    expect(screen.getByText('Standard Tier')).toBeInTheDocument();
  });

  it('renders correct consistency count', () => {
    render(<DigitalCertificate profile={mockProfile} history={mockHistory} />);

    // There are 2 'paid' entries in mockHistory
    expect(screen.getByText('2 Months')).toBeInTheDocument();
  });

  it('renders standing based on score', () => {
    const { rerender } = render(<DigitalCertificate profile={mockProfile} history={mockHistory} />);

    expect(screen.getByText('EXCELLENT')).toBeInTheDocument();

    const lowScoreProfile = { ...mockProfile, bhoomi_score: 600 };
    rerender(<DigitalCertificate profile={lowScoreProfile} history={mockHistory} />);

    expect(screen.getByText('GOOD')).toBeInTheDocument();
  });

  it('renders download button and handles click', () => {
    render(<DigitalCertificate profile={mockProfile} history={mockHistory} />);

    const downloadButton = screen.getByRole('button', { name: /download rental passport/i });
    expect(downloadButton).toBeInTheDocument();

    downloadButton.click();
    expect(window.print).toHaveBeenCalled();
  });
});
