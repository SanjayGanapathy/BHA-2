// src/pages/Dashboard.spec.tsx
import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './Dashboard';
import * as api from '@/lib/api';
import { DEMO_PRODUCTS, DEMO_SALES } from '@/lib/demo-data';

// Mock the entire api module
vi.mock('@/lib/api');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retries for tests
    },
  },
});

const renderDashboard = () => {
  render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    queryClient.clear();
  });

  it('should display the loading screen while queries are in progress', () => {
    vi.mocked(api.fetchSales).mockReturnValue(new Promise(() => {}));
    vi.mocked(api.fetchProducts).mockReturnValue(new Promise(() => {}));
    renderDashboard();
    expect(screen.getByText(/loading dashboard data/i)).toBeInTheDocument();
  });

  it('should display an error message if fetching sales fails', async () => {
    vi.mocked(api.fetchSales).mockRejectedValue(new Error('Network Error'));
    vi.mocked(api.fetchProducts).mockResolvedValue(DEMO_PRODUCTS);
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Network Error/i)).toBeInTheDocument();
    });
  });

  it('should render the dashboard cards with correct data on successful fetch', async () => {
    vi.mocked(api.fetchSales).mockResolvedValue(DEMO_SALES);
    vi.mocked(api.fetchProducts).mockResolvedValue(DEMO_PRODUCTS);
    renderDashboard();

    const heading = await screen.findByRole('heading', { name: /dashboard/i });
    expect(heading).toBeInTheDocument();
    
    // THE FIX: The test ID string now includes the apostrophe, matching the rendered output exactly.
    const revenueCard = await screen.findByTestId("metrics-card-today's-revenue");
    
    const revenueValue = within(revenueCard).getByText('$4.50');
    expect(revenueValue).toBeInTheDocument();
  });
});
