// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Initialize Firebase with a test config before any Firebase code runs in tests
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "test-api-key",
  authDomain: "test.firebaseapp.com",
  projectId: "test-project-id",
  // ...other config values as needed
};

try {
  initializeApp(firebaseConfig);
} catch (e) {
  // Ignore if already initialized (tests may re-run)
}

// ---------------------------------------------------------------------------
// Mock react-leaflet (ES module) for Jest tests
// react-leaflet ships ESM code that Jest may not transform in node_modules.
// Provide a lightweight CommonJS mock so components importing it in tests
// (MapPicker, MapDisplay, etc.) won't cause a parser error.
// ---------------------------------------------------------------------------
jest.mock('react-leaflet', () => {
  const React = require('react');
  return {
    MapContainer: ({ children, ...props }) => React.createElement('div', { 'data-testid': 'map-container', ...props }, children),
    TileLayer: (props) => React.createElement('div', { 'data-testid': 'tile-layer', ...props }),
    Marker: ({ children, ...props }) => React.createElement('div', { 'data-testid': 'marker', ...props }, children),
    Popup: ({ children, ...props }) => React.createElement('div', { 'data-testid': 'popup', ...props }, children),
    useMapEvents: () => ({}),
    useMap: () => ({}),
    useMapEvent: () => ({}),
    useMapEvents: () => ({}),
  };
});

// Mock the MapPicker component used by ItemReportForm so tests don't need to
// interact with a real map. The mock will call `onLocationSelect` with a
// default coordinate immediately on mount so forms that require coordinates
// will validate in tests.
jest.mock('./components/map/MapPicker', () => {
  const React = require('react');
  return ({ onLocationSelect, initialPosition }) => {
    React.useEffect(() => {
      if (onLocationSelect) {
        onLocationSelect({ latitude: -36.8524, longitude: 174.7691 });
      }
    }, [onLocationSelect]);

    return React.createElement('div', { 'data-testid': 'mock-map-picker' }, null);
  };
});

// Add Node.js polyfills for browser environment
global.setImmediate = global.setImmediate || ((fn, ...args) => global.setTimeout(fn, 0, ...args));
global.clearImmediate = global.clearImmediate || global.clearTimeout;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('@firebase') ||
       args[0].includes('FIREBASE') ||
       args[0].includes('analytics') ||
       args[0].includes('IndexedDB') ||
       args[0].includes('measurement ID') ||
       args[0].includes('Error signing out') ||
       args[0].includes('Error fetching items') ||
       args[0].includes('Error setting up items listener'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: componentWillReceiveProps') ||
       args[0].includes('Warning: componentWillUpdate') ||
       args[0].includes('React Router Future Flag Warning') ||
       args[0].includes('@firebase') ||
       args[0].includes('FIREBASE') ||
       args[0].includes('analytics') ||
       args[0].includes('IndexedDB') ||
       args[0].includes('measurement ID'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
