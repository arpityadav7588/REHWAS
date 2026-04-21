import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterPanel } from './FilterPanel';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as reactRouterDom from 'react-router-dom';

// Mock useSearchParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useSearchParams: vi.fn(),
  };
});

describe('FilterPanel', () => {
  const mockSetSearchParams = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (reactRouterDom.useSearchParams as any).mockReturnValue([new URLSearchParams(), mockSetSearchParams]);
  });

  it('renders with default values', () => {
    render(
      <MemoryRouter>
        <FilterPanel />
      </MemoryRouter>
    );

    expect(screen.getByLabelText('City')).toHaveValue('Bengaluru');
    expect(screen.getByLabelText('Min Rent')).toHaveValue(null);
    expect(screen.getByLabelText('Max Rent')).toHaveValue(null);

    // Room Type radio
    expect(screen.getByLabelText('All')).toBeChecked();

    // Furnished button group - "Any" should be active
    const anyFurnishedButton = screen.getByRole('button', { name: 'Any' });
    expect(anyFurnishedButton).toHaveClass('bg-white');

    // Gender radio
    const genderAny = screen.getAllByLabelText('Any').find(el => (el as HTMLInputElement).name === 'gender');
    expect(genderAny).toBeChecked();
  });

  it('updates input values on user interaction', () => {
    render(
      <MemoryRouter>
        <FilterPanel />
      </MemoryRouter>
    );

    const citySelect = screen.getByLabelText('City');
    fireEvent.change(citySelect, { target: { value: 'Pune' } });
    expect(citySelect).toHaveValue('Pune');

    const minRentInput = screen.getByLabelText('Min Rent');
    fireEvent.change(minRentInput, { target: { value: '10000' } });
    expect(minRentInput).toHaveValue(10000);

    const roomTypePG = screen.getByLabelText('PG');
    fireEvent.click(roomTypePG);
    expect(roomTypePG).toBeChecked();

    const furnishedButton = screen.getByRole('button', { name: 'Furnished' });
    fireEvent.click(furnishedButton);
    expect(furnishedButton).toHaveClass('bg-white');
  });

  it('submits the form and updates search params', () => {
    render(
      <MemoryRouter>
        <FilterPanel />
      </MemoryRouter>
    );

    // Change some values
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Mumbai' } });
    fireEvent.change(screen.getByLabelText('Min Rent'), { target: { value: '15000' } });
    fireEvent.click(screen.getByLabelText('1BHK'));
    fireEvent.click(screen.getByRole('button', { name: 'Furnished' }));
    fireEvent.click(screen.getByLabelText('Male Only'));

    // Submit
    fireEvent.click(screen.getByRole('button', { name: 'Search Rooms' }));

    expect(mockSetSearchParams).toHaveBeenCalled();
    const calledParams = mockSetSearchParams.mock.calls[0][0];
    expect(calledParams.get('city')).toBe('Mumbai');
    expect(calledParams.get('min_rent')).toBe('15000');
    expect(calledParams.get('room_type')).toBe('1BHK');
    expect(calledParams.get('furnished')).toBe('Furnished');
    expect(calledParams.get('gender')).toBe('Male Only');
  });

  it('resets filters when Reset button is clicked', () => {
    render(
      <MemoryRouter>
        <FilterPanel />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reset Filters' }));

    expect(mockSetSearchParams).toHaveBeenCalled();
    const calledParams = mockSetSearchParams.mock.calls[0][0];
    expect(Array.from(calledParams.keys()).length).toBe(0);
  });
});
