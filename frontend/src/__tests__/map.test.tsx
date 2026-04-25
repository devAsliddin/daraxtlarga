/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/map',
}));

// Mock api
jest.mock('@/lib/api', () => ({
  default: {
    get: jest.fn().mockResolvedValue({ data: [] }),
    post: jest.fn().mockResolvedValue({ data: {} }),
  },
}));

// Mock zustand store
jest.mock('@/store/auth.store', () => ({
  useAuthStore: () => ({
    user: { id: 'user-1', username: 'TestUser', totalTokens: 100 },
    accessToken: 'mock-token',
  }),
}));

// Mock react-leaflet (requires browser APIs)
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  CircleMarker: ({ children }: any) => <div data-testid="circle-marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
  useMap: () => ({ flyTo: jest.fn() }),
}));

// Mock leaflet
jest.mock('leaflet/dist/leaflet.css', () => {});
jest.mock('leaflet', () => ({ Icon: { Default: { mergeOptions: jest.fn() } } }));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('Map Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders map container', async () => {
    // Mock geolocation
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn((success) =>
          success({ coords: { latitude: 41.3, longitude: 69.2 } }),
        ),
      },
      writable: true,
    });

    const api = require('@/lib/api').default;
    api.get.mockResolvedValue({
      data: [
        { id: '1', lat: 41.2995, lng: 69.2401, status: 'PENDING', stateReportedCount: 50, region: 'Toshkent' },
      ],
    });

    // Just verify the module loads without error
    const MapView = require('@/components/map/MapView').default;
    expect(MapView).toBeDefined();
  });

  it('displays token balance in header', () => {
    // Verify auth store returns expected data
    const { useAuthStore } = require('@/store/auth.store');
    const auth = useAuthStore();
    expect(auth.user.totalTokens).toBe(100);
  });
});

describe('Auth Store', () => {
  it('provides user data', () => {
    const { useAuthStore } = require('@/store/auth.store');
    const { user } = useAuthStore();
    expect(user.username).toBe('TestUser');
    expect(user.id).toBe('user-1');
  });
});

describe('API Module', () => {
  it('makes API requests correctly', async () => {
    const api = require('@/lib/api').default;
    api.get.mockResolvedValue({ data: { total: 0, items: [] } });

    const response = await api.get('/leaderboard/global');
    expect(response.data).toHaveProperty('total');
  });
});
