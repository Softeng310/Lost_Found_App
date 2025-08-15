import reportWebVitals from './reportWebVitals';

// Mock web-vitals module
const mockGetCLS = jest.fn();
const mockGetFID = jest.fn();
const mockGetFCP = jest.fn();
const mockGetLCP = jest.fn();
const mockGetTTFB = jest.fn();

jest.mock('web-vitals', () => ({
  getCLS: mockGetCLS,
  getFID: mockGetFID,
  getFCP: mockGetFCP,
  getLCP: mockGetLCP,
  getTTFB: mockGetTTFB,
}));

describe('reportWebVitals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calls all web vitals functions when onPerfEntry is provided', async () => {
    const mockOnPerfEntry = jest.fn();
    
    reportWebVitals(mockOnPerfEntry);
    
    // Wait for the async import to resolve
    await new Promise(resolve => setImmediate(resolve));
    
    expect(mockGetCLS).toHaveBeenCalledWith(mockOnPerfEntry);
    expect(mockGetFID).toHaveBeenCalledWith(mockOnPerfEntry);
    expect(mockGetFCP).toHaveBeenCalledWith(mockOnPerfEntry);
    expect(mockGetLCP).toHaveBeenCalledWith(mockOnPerfEntry);
    expect(mockGetTTFB).toHaveBeenCalledWith(mockOnPerfEntry);
  });

  test('does not call web vitals functions when onPerfEntry is not provided', async () => {
    reportWebVitals();
    
    // Wait for the async import to resolve
    await new Promise(resolve => setImmediate(resolve));
    
    expect(mockGetCLS).not.toHaveBeenCalled();
    expect(mockGetFID).not.toHaveBeenCalled();
    expect(mockGetFCP).not.toHaveBeenCalled();
    expect(mockGetLCP).not.toHaveBeenCalled();
    expect(mockGetTTFB).not.toHaveBeenCalled();
  });

  test('does not call web vitals functions when onPerfEntry is not a function', async () => {
    const notAFunction = 'not a function';
    
    reportWebVitals(notAFunction);
    
    // Wait for the async import to resolve
    await new Promise(resolve => setImmediate(resolve));
    
    expect(mockGetCLS).not.toHaveBeenCalled();
    expect(mockGetFID).not.toHaveBeenCalled();
    expect(mockGetFCP).not.toHaveBeenCalled();
    expect(mockGetLCP).not.toHaveBeenCalled();
    expect(mockGetTTFB).not.toHaveBeenCalled();
  });

  test('does not call web vitals functions when onPerfEntry is null', async () => {
    reportWebVitals(null);
    
    // Wait for the async import to resolve
    await new Promise(resolve => setImmediate(resolve));
    
    expect(mockGetCLS).not.toHaveBeenCalled();
    expect(mockGetFID).not.toHaveBeenCalled();
    expect(mockGetFCP).not.toHaveBeenCalled();
    expect(mockGetLCP).not.toHaveBeenCalled();
    expect(mockGetTTFB).not.toHaveBeenCalled();
  });

  test('does not call web vitals functions when onPerfEntry is undefined', async () => {
    reportWebVitals(undefined);
    
    // Wait for the async import to resolve
    await new Promise(resolve => setImmediate(resolve));
    
    expect(mockGetCLS).not.toHaveBeenCalled();
    expect(mockGetFID).not.toHaveBeenCalled();
    expect(mockGetFCP).not.toHaveBeenCalled();
    expect(mockGetLCP).not.toHaveBeenCalled();
    expect(mockGetTTFB).not.toHaveBeenCalled();
  });
});
