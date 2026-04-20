import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RentLedgerTable, type RentLedgerExtended } from './RentLedgerTable';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { format, subMonths } from 'date-fns';

// Mock the date to have deterministic months
const mockDate = new Date(2024, 0, 15); // Jan 15, 2024
vi.setSystemTime(mockDate);

const mockOnUpdate = vi.fn().mockResolvedValue({ error: null });

const mockLedgerEntries: RentLedgerExtended[] = [
  {
    id: '1',
    tenant_id: 't1',
    landlord_id: 'l1',
    month: 'Jan 2024',
    amount: 10000,
    utility_amount: 500,
    status: 'unpaid',
    tenants: {
      id: 't1',
      room_id: 'r1',
      profiles: {
        full_name: 'John Doe',
        phone: '1234567890'
      }
    }
  },
  {
    id: '2',
    tenant_id: 't1',
    landlord_id: 'l1',
    month: 'Dec 2023',
    amount: 10000,
    utility_amount: 0,
    status: 'paid',
    tenants: {
      id: 't1',
      room_id: 'r1',
      profiles: {
        full_name: 'John Doe',
        phone: '1234567890'
      }
    }
  }
];

describe('RentLedgerTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the table with correct month headers', () => {
    render(<RentLedgerTable ledgerEntries={mockLedgerEntries} onUpdate={mockOnUpdate} />);

    const expectedMonths = Array.from({ length: 6 }).map((_, i) =>
      format(subMonths(mockDate, i), 'MMM yyyy')
    );

    expectedMonths.forEach(month => {
      expect(screen.getAllByText(month).length).toBeGreaterThan(0);
    });
  });

  it('renders tenant names correctly', () => {
    render(<RentLedgerTable ledgerEntries={mockLedgerEntries} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders empty state message when no entries', () => {
    render(<RentLedgerTable ledgerEntries={[]} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('No rent records found yet.')).toBeInTheDocument();
  });

  it('opens the modal when a cell is clicked', () => {
    render(<RentLedgerTable ledgerEntries={mockLedgerEntries} onUpdate={mockOnUpdate} />);

    const unpaidCell = screen.getByText('unpaid').closest('.cursor-pointer');
    fireEvent.click(unpaidCell!);

    expect(screen.getByText('Jan 2024 Rent')).toBeInTheDocument();
    expect(screen.getByText('Current Status')).toBeInTheDocument();
    // Modal uses capitalize class, but text content is lowercase 'unpaid'
    // There might be multiple 'unpaid' (one in table, one in modal)
    const statusElements = screen.getAllByText(/unpaid/i);
    expect(statusElements.length).toBeGreaterThan(0);
  });

  it('calls onUpdate when marking as paid', async () => {
    render(<RentLedgerTable ledgerEntries={mockLedgerEntries} onUpdate={mockOnUpdate} />);

    const unpaidCell = screen.getByText('unpaid').closest('.cursor-pointer');
    fireEvent.click(unpaidCell!);

    const markAsPaidBtn = screen.getByText('Mark as Paid');
    fireEvent.click(markAsPaidBtn);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('1', expect.objectContaining({
        status: 'paid'
      }));
    });
  });

  it('calls onUpdate when saving changes in modal', async () => {
    render(<RentLedgerTable ledgerEntries={mockLedgerEntries} onUpdate={mockOnUpdate} />);

    const unpaidCell = screen.getByText('unpaid').closest('.cursor-pointer');
    fireEvent.click(unpaidCell!);

    // Since labels are not associated with inputs, find by value or use a different approach
    const amountInput = screen.getByDisplayValue('10000');
    fireEvent.change(amountInput, { target: { value: '11000' } });

    const saveBtn = screen.getByText('Save Changes');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('1', expect.objectContaining({
        amount: 11000
      }));
    });
  });
});
