import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Header } from './Header';
import { useAuth } from '@/hooks/useAuth';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders REHWAS brand name', () => {
    (useAuth as any).mockReturnValue({
      user: null,
      profile: null,
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getAllByText('REHWAS')).toHaveLength(1);
  });

  it('shows Sign In button when unauthenticated', () => {
    (useAuth as any).mockReturnValue({
      user: null,
      profile: null,
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('shows Find Home and profile avatar when authenticated as tenant', () => {
    (useAuth as any).mockReturnValue({
      user: { id: '123' },
      profile: { role: 'tenant', full_name: 'John Doe' },
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText('Find Home')).toBeInTheDocument();
    expect(screen.getByText('J')).toBeInTheDocument();
    expect(screen.queryByText('Management')).not.toBeInTheDocument();
  });

  it('shows Management link and List Property when authenticated as landlord', () => {
    (useAuth as any).mockReturnValue({
      user: { id: '123' },
      profile: { role: 'landlord', full_name: 'Jane Smith' },
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText('Management')).toBeInTheDocument();
    expect(screen.getByText('List Property')).toBeInTheDocument();
  });

  it('toggles mobile menu when menu button is clicked', () => {
    (useAuth as any).mockReturnValue({
      user: null,
      profile: null,
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Find the menu button (it has lucide-react Menu icon)
    // In Header.tsx: <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-600 p-2 min-h-[44px]">
    // It doesn't have an aria-label, but we can look for the button or use a test ID if needed.
    // For now, let's find it by the lucide icon or just the button element if there's only one md:hidden button.
    const menuButton = screen.getByRole('button', { selector: '.md\\:hidden button' });

    // Initially, mobile links shouldn't be visible in the desktop view (hidden md:flex)
    // But they are rendered when mobileMenuOpen is true.
    expect(screen.queryByText('Discover Rooms')).not.toBeInTheDocument();

    fireEvent.click(menuButton);

    expect(screen.getByText('Discover Rooms')).toBeInTheDocument();
  });
});
