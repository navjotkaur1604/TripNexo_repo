import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { TripBuilderProvider } from '../context/TripBuilderContext';
import { ToastProvider } from '../context/ToastContext';
import { AppRoutes } from '../App';
import * as apiModule from '../services/api';

vi.mock('../services/api', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    destinationAPI: {
      list: vi.fn(),
      getById: vi.fn(),
    },
    authAPI: {
      ...actual.authAPI,
      getMe: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
    },
    budgetAPI: {
      estimate: vi.fn(),
    },
  };
});

function renderWithProviders(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ToastProvider>
        <AuthProvider>
          <TripBuilderProvider>
            <AppRoutes />
          </TripBuilderProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('TripNexo React Frontend Components & Routing', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    apiModule.destinationAPI.list.mockResolvedValue({
      success: true,
      total: 1,
      page: 1,
      hasMore: false,
      filters: { regions: ['Dhundhar'], seasons: ['Winter (Oct-Mar)'] },
      destinations: [
        {
          _id: 'dest-jaipur',
          name: 'Jaipur',
          slug: 'jaipur',
          region: 'Dhundhar',
          tagline: 'The Pink City',
          description: 'Historic forts and palaces of Rajasthan.',
          images: ['https://example.com/jaipur.jpg'],
          interests: ['heritage', 'culture'],
          recommendedDays: 3,
          bestSeason: 'Winter (Oct-Mar)',
          averageRating: 4.8,
          coordinates: { lat: 26.9124, lng: 75.7873 },
          accommodation: { moderate: { min: 2200, max: 4500 } },
          food: { moderate: { min: 900, max: 1600 } },
        },
      ],
    });
  });

  it('renders HomePage hero headline and featured destinations from API', async () => {
    renderWithProviders('/');

    expect(
      screen.getByText(/Trace Rajasthan’s forts, lakes, and desert skies/i)
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Jaipur')).toBeInTheDocument();
    });
  });

  it('does not render Contingency (%) or Intercity Override fields in Planner or Budget Calculator', async () => {
    renderWithProviders('/planner');
    await waitFor(() => {
      expect(screen.getByText(/Build Your Rajasthan Itinerary/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Contingency/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Intercity Override/i)).not.toBeInTheDocument();
  });

  it('allows adding a destination to TripBuilderContext from ExplorePage', async () => {
    const user = userEvent.setup();
    renderWithProviders('/explore');

    await waitFor(() => {
      expect(screen.getByText('Jaipur')).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /add/i });
    await user.click(addBtn);

    expect(screen.getByRole('button', { name: /added/i })).toBeInTheDocument();
  });

  it('redirects unauthenticated users from /my-trips protected route to /login', async () => {
    renderWithProviders('/my-trips');

    await waitFor(() => {
      expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
    });
  });
});
