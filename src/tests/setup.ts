import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock the ResizeObserver API for the 'recharts' library
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
vi.stubGlobal('ResizeObserver', ResizeObserverMock);

// Mock the entire API layer. Now, any test that imports from "@/lib/api"
// will get this fake version instead of the one that talks to Supabase.
vi.mock('@/lib/api', () => ({
  apiLogin: vi.fn(),
  apiLogout: vi.fn(),
  getCurrentUser: vi.fn(),
  fetchProducts: vi.fn(),
  addProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  fetchUsers: vi.fn(),
  addUser: vi.fn(),
  updateUser: vi.fn(),
  fetchSales: vi.fn(),
  createSale: vi.fn(),
  fetchAiResponse: vi.fn(),
}));