// Simple test to ensure index.js can be imported without errors
test('index.js can be imported', () => {
  // Mock the DOM element that React needs
  document.getElementById = jest.fn().mockReturnValue({
    // Mock DOM element
  });
  
  // Mock ReactDOM.createRoot
  const mockRender = jest.fn();
  const mockCreateRoot = jest.fn().mockReturnValue({
    render: mockRender
  });
  
  // Mock the modules
  jest.doMock('react-dom/client', () => ({
    createRoot: mockCreateRoot
  }));
  
  jest.doMock('./App', () => {
    return function MockApp() {
      return null;
    };
  });
  
  jest.doMock('./reportWebVitals', () => jest.fn());
  jest.doMock('./index.css', () => ({}));
  
  // Import the module
  require('./index');
  
  // Verify the mocks were called
  expect(document.getElementById).toHaveBeenCalledWith('root');
  expect(mockCreateRoot).toHaveBeenCalled();
  expect(mockRender).toHaveBeenCalled();
});
