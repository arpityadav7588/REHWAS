import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommuteWidget } from './CommuteWidget';
import { describe, it, expect } from 'vitest';
import type { Room } from '@/types';

const mockRoom: Room = {
  id: '1',
  landlord_id: 'l1',
  title: 'Test Room',
  description: 'A test room',
  rent_amount: 1000,
  room_type: '1BHK',
  furnished: true,
  city: 'Bangalore',
  locality: 'Koramangala',
  address: '123 Test St',
  latitude: 12.9716,
  longitude: 77.5946,
  available: true,
  amenities: ['Wifi'],
  photos: [],
  created_at: new Date().toISOString(),
  commute_metadata: {
    peak_traffic_multiplier: 1.5
  }
};

describe('CommuteWidget', () => {
  it('renders initial state correctly', () => {
    render(<CommuteWidget room={mockRoom} />);

    expect(screen.getByText('Locality Intelligence')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your office address/i)).toBeInTheDocument();
    expect(screen.getByText(/REHWAS uses real-time traffic data specifically for Koramangala/i)).toBeInTheDocument();
  });

  it('updates input value on change', () => {
    render(<CommuteWidget room={mockRoom} />);
    const input = screen.getByPlaceholderText(/Enter your office address/i) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'Manyata Tech Park' } });
    expect(input.value).toBe('Manyata Tech Park');
  });

  it('calculates commute times after clicking the button', async () => {
    render(<CommuteWidget room={mockRoom} />);

    const input = screen.getByPlaceholderText(/Enter your office address/i);
    fireEvent.change(input, { target: { value: 'Manyata Tech Park' } });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Should show loading state
    expect(document.querySelector(".lucide-zap")).toBeInTheDocument();

    // Wait for results (timeout in component is 1500ms)
    await waitFor(() => {
      expect(screen.getByText('Car')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText('38 mins')).toBeInTheDocument();
    expect(screen.getByText('27 mins')).toBeInTheDocument();
    expect(screen.getByText('60 mins')).toBeInTheDocument();
  });

  it('button is disabled when input is empty', () => {
    render(<CommuteWidget room={mockRoom} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
