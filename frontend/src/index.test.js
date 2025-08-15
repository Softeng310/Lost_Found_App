import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock ReactDOM
const mockCreateRoot = jest.fn();
const mockRender = jest.fn();

jest.mock('react-dom/client', () => ({
  createRoot: mockCreateRoot.mockReturnValue({
    render: mockRender
  })
}));

// Mock App component
jest.mock('./App', () => {
  return function MockApp() {
    return <div data-testid="app">Mock App</div>;
  };
});

// Mock reportWebVitals
const mockReportWebVitals = jest.fn();
jest.mock('./reportWebVitals', () => mockReportWebVitals);

// Mock CSS import
jest.mock('./index.css', () => ({}));

describe('index.js', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock document.getElementById
    document.getElementById = jest.fn().mockReturnValue({
      // Mock DOM element
    });
  });

  test('creates root and renders App component', () => {
    // Import the module to trigger the execution
    require('./index');
    
    // Verify createRoot was called with the correct element
    expect(mockCreateRoot).toHaveBeenCalledWith(expect.any(Object));
    
    // Verify render was called with App wrapped in StrictMode
    expect(mockRender).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.any(Object), // React.StrictMode
        props: expect.objectContaining({
          children: expect.any(Object) // App component
        })
      })
    );
  });

  test('calls reportWebVitals', () => {
    // Import the module to trigger the execution
    require('./index');
    
    // Verify reportWebVitals was called
    expect(mockReportWebVitals).toHaveBeenCalled();
  });

  test('document.getElementById is called with root', () => {
    // Import the module to trigger the execution
    require('./index');
    
    // Verify getElementById was called with 'root'
    expect(document.getElementById).toHaveBeenCalledWith('root');
  });
});
