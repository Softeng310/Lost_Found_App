import reportWebVitals from './reportWebVitals';

describe('reportWebVitals', () => {
  test('can be called with a function', () => {
    const mockOnPerfEntry = jest.fn();
    
    // Should not throw an error
    expect(() => {
      reportWebVitals(mockOnPerfEntry);
    }).not.toThrow();
  });

  test('can be called without parameters', () => {
    // Should not throw an error
    expect(() => {
      reportWebVitals();
    }).not.toThrow();
  });

  test('can be called with non-function parameter', () => {
    const notAFunction = 'not a function';
    
    // Should not throw an error
    expect(() => {
      reportWebVitals(notAFunction);
    }).not.toThrow();
  });

  test('can be called with null', () => {
    // Should not throw an error
    expect(() => {
      reportWebVitals(null);
    }).not.toThrow();
  });

  test('can be called with undefined', () => {
    // Should not throw an error
    expect(() => {
      reportWebVitals(undefined);
    }).not.toThrow();
  });
});
