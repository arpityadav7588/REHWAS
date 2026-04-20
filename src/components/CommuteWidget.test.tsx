import { render, screen, fireEvent, act } from '@testing-library/react';
import { CommuteWidget } from './CommuteWidget';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Room } from '@/types';
import '@testing-library/jest-dom';

const mockRoom: Room = {
  id: '1',
  landlord_id: 'l1',
  title: 'Test Room',
  description: 'Test Description',
  rent_amount: 1000,
  room_type: '1BHK',
  furnished: true,
  city: 'Test City',
  locality: 'Test Locality',
  address: '123 Test St',
  latitude: 0,
  longitude: 0,
  available: true,
  amenities: [],
  photos: [],
  created_at: new Date().toISOString(),
  commute_metadata: {
    peak_traffic_multiplier: 1.5
  }
};

describe('CommuteWidget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders correctly in initial state', () => {
    render(<CommuteWidget room={mockRoom} />);

    expect(screen.getByText('Locality Intelligence')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your office address/i)).toBeInTheDocument();
    expect(screen.getByText(/REHWAS uses real-time traffic data specifically for Test Locality/i)).toBeInTheDocument();
  });

  it('updates input value on change', () => {
    render(<CommuteWidget room={mockRoom} />);
    const input = screen.getByPlaceholderText(/Enter your office address/i) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'Manyata Tech Park' } });
    expect(input.value).toBe('Manyata Tech Park');
  });

  it('calculates and displays results after delay', async () => {
    render(<CommuteWidget room={mockRoom} />);
    const input = screen.getByPlaceholderText(/Enter your office address/i);
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'Manyata Tech Park' } });
    fireEvent.click(button);

    // Should show loading state (pulse icon/isCalculating is true)
    expect(screen.queryByText(/mins/i)).not.toBeInTheDocument();

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Verify results
    // With 1.5 multiplier:
    // Car: 25 * 1.5 = 37.5 -> 38
    // Bike: 18 * 1.5 = 27
    // Transit: 40 * 1.5 = 60
    expect(screen.getByText('38 mins')).toBeInTheDocument();
    expect(screen.getByText('27 mins')).toBeInTheDocument();
    expect(screen.getByText('60 mins')).toBeInTheDocument();

    // Testing with case-insensitive regex or exact casing
    expect(screen.getByText(/car/i)).toBeInTheDocument();
    expect(screen.getByText(/bike/i)).toBeInTheDocument();
    expect(screen.getByText(/public/i)).toBeInTheDocument();
  });

  it('uses default multiplier if not provided', () => {
    const roomWithoutMetadata: Room = { ...mockRoom, commute_metadata: undefined };
    render(<CommuteWidget room={roomWithoutMetadata} />);

    const input = screen.getByPlaceholderText(/Enter your office address/i);
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'Manyata Tech Park' } });
    fireEvent.click(button);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Default multiplier is 1.4
    // Car: 25 * 1.4 = 35
    // Bike: 18 * 1.4 = 25.2 -> 25
    // Transit: 40 * 1.4 = 56
    expect(screen.getByText('35 mins')).toBeInTheDocument();
    expect(screen.getByText('25 mins')).toBeInTheDocument();
    expect(screen.getByText('56 mins')).toBeInTheDocument();
  });
});
