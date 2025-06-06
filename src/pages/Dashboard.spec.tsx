import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './Dashboard';
import * as api from '@/lib/api';
import { DEMO_PRODUCTS, DEMO_SALES } from '@/lib/demo-data';

// Mock the entire api module to control what our component receives
vi.mock('@/lib/api');

// Create a new QueryClient for each test run to ensure isolation
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retries for tests for faster feedback
    },
  },
});

const renderDashboard = (client: QueryClient) => {
  render(
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard Page', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Create a new client for each test to prevent cache leakage
    queryClient = createTestQueryClient();
    // Reset any previous mocks
    vi.resetAllMocks();
  });

  it('should display the loading screen while queries are in progress', () => {
    // Arrange: Mock the API calls to be in a perpetual pending state
    vi.mocked(api.fetchSales).mockReturnValue(new Promise(() => {}));
    vi.mocked(api.fetchProducts).mockReturnValue(new Promise(() => {}));

    // Act
    renderDashboard(queryClient);

    // Assert
    expect(screen.getByText(/loading dashboard data/i)).toBeInTheDocument();
  });

  it('should display an error message if fetching sales fails', async () => {
    // Arrange: Simulate a failed sales fetch and a successful products fetch
    vi.mocked(api.fetchSales).mockRejectedValue(new Error('Network Error'));
    vi.mocked(api.fetchProducts).mockResolvedValue(DEMO_PRODUCTS);
    
    // Act
    renderDashboard(queryClient);

    // Assert: Wait for the error message to appear in the component
    await waitFor(() => {
      expect(screen.getByText(/Error Loading Dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/Network Error/i)).toBeInTheDocument();
    });
  });

  it('should render the dashboard cards with correct data on successful fetch', async () => {
    // Arrange: Simulate a successful fetch for both queries
    vi.mocked(api.fetchSales).mockResolvedValue(DEMO_SALES);
    vi.mocked(api.fetchProducts).mockResolvedValue(DEMO_PRODUCTS);
    
    // Act
    renderDashboard(queryClient);

    // Assert: Wait for the main heading to appear, confirming the page has loaded
    const heading = await screen.findByRole('heading', { name: /dashboard/i });
    expect(heading).toBeInTheDocument();
    
    // Assert: Find the specific card using its testId and then check the value within it
    const revenueCard = await screen.findByTestId("metrics-card-todays-revenue");
    const revenueValue = within(revenueCard).getByText('$4.50');
    expect(revenueValue).toBeInTheDocument();
    
    const profitCard = await screen.findByTestId("metrics-card-todays-profit");
    const profitValue = within(profitCard).getByText('$3.30');
    expect(profitValue).toBeInTheDocument();
  });
});
