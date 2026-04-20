import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DigitalDossier } from './DigitalDossier';

// Mock Math.random to have consistent output for Dossier ID and Verification Hash
vi.spyOn(Math, 'random').mockReturnValue(0.123456789);

const mockTenant = {
  full_name: 'John Doe',
  phone: '+91 9876543210',
  move_in_date: '2024-01-01',
  rent_amount: 15000,
  room_title: 'Premium Studio, Indiranagar',
  kyc_verified: true,
};

describe('DigitalDossier', () => {
  it('renders tenant information correctly', () => {
    render(<DigitalDossier tenant={mockTenant} />);

    // Check for tenant name and phone
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('+91 9876543210')).toBeInTheDocument();

    // Check for stay information
    expect(screen.getByText('2024-01-01')).toBeInTheDocument();
    expect(screen.getByText('Premium Studio, Indiranagar')).toBeInTheDocument();

    // Check for verification status
    expect(screen.getByText(/KYC Verified/i)).toBeInTheDocument();
    expect(screen.getByText(/Registered Resident/i)).toBeInTheDocument();
    expect(screen.getByText(/TRUSTED/i)).toBeInTheDocument();
  });

  it('renders with premium financial standing', () => {
    render(<DigitalDossier tenant={mockTenant} />);
    expect(screen.getByText('PRIME')).toBeInTheDocument();
  });

  it('has hidden-print class for normal view but block for print', () => {
    const { container } = render(<DigitalDossier tenant={mockTenant} />);
    const dossierElement = container.querySelector('#digital-dossier-print');
    expect(dossierElement).toHaveClass('hidden');
    expect(dossierElement).toHaveClass('print:block');
  });
});
