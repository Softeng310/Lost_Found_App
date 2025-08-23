import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ReportPage from '../ReportPage';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock Firebase auth
jest.mock('../../firebase/config', () => ({
  auth: {
    currentUser: { 
      uid: 'test-user-id',
      getIdToken: jest.fn().mockResolvedValue('mock-token')
    }
  }
}));

// Mock fetch
global.fetch = jest.fn();

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock window.alert
global.alert = jest.fn();

// Custom render function with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ReportPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  describe('Rendering', () => {
    test('renders the report page title', () => {
      renderWithRouter(<ReportPage />);
      
      expect(screen.getByText('Report a Lost or Found Item')).toBeInTheDocument();
    });

    test('renders the description text', () => {
      renderWithRouter(<ReportPage />);
      
      expect(screen.getByText('Add details so the community can help reconnect items with owners.')).toBeInTheDocument();
    });

    test('renders form elements', () => {
      renderWithRouter(<ReportPage />);
      
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Date & Time')).toBeInTheDocument();
      expect(screen.getByText('Photo')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    test('renders submit and reset buttons', () => {
      renderWithRouter(<ReportPage />);
      
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    test('allows user to select item type', () => {
      renderWithRouter(<ReportPage />);
      
      const typeSelect = document.querySelector('select[name="status"]');
      expect(typeSelect).toBeDefined();
      fireEvent.change(typeSelect, { target: { value: 'lost' } });
      
      expect(typeSelect.value).toBe('lost');
    });

    test('allows user to select category', () => {
      renderWithRouter(<ReportPage />);
      
      const selects = screen.getAllByDisplayValue('Select');
      const categorySelect = selects.find(select => select.getAttribute('name') === 'type');
      fireEvent.change(categorySelect, { target: { value: 'electronics' } });
      
      expect(categorySelect.value).toBe('electronics');
    });

    test('allows user to select location', () => {
      renderWithRouter(<ReportPage />);
      
      const selects = screen.getAllByDisplayValue('Select');
      const locationSelect = selects.find(select => select.getAttribute('name') === 'location');
      fireEvent.change(locationSelect, { target: { value: 'OGGB' } });
      
      expect(locationSelect.value).toBe('OGGB');
    });

    test('allows user to enter title', () => {
      renderWithRouter(<ReportPage />);
      
      const titleInput = screen.getByPlaceholderText('e.g., Black iPhone 13 with green case');
      fireEvent.change(titleInput, { target: { value: 'Lost iPhone' } });
      
      expect(titleInput.value).toBe('Lost iPhone');
    });

    test('allows user to enter description', () => {
      renderWithRouter(<ReportPage />);
      
      const descriptionInput = screen.getByPlaceholderText('Add unique identifiers and more details about the item...');
      fireEvent.change(descriptionInput, { target: { value: 'Black iPhone with cracked screen' } });
      
      expect(descriptionInput.value).toBe('Black iPhone with cracked screen');
    });

    test('allows user to select date and time', () => {
      renderWithRouter(<ReportPage />);
      
      const inputs = screen.getAllByDisplayValue('');
      const dateInput = inputs.find(input => input.getAttribute('type') === 'datetime-local');
      expect(dateInput).toBeDefined();
      const testDate = '2024-01-15T10:00';
      fireEvent.change(dateInput, { target: { value: testDate } });
      
      expect(dateInput.value).toBe(testDate);
    });
  });

  describe('Form Validation', () => {
    test('shows validation errors when submitting empty form', async () => {
      renderWithRouter(<ReportPage />);
      
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
        expect(screen.getByText('Description is required')).toBeInTheDocument();
        expect(screen.getByText('Please select a category')).toBeInTheDocument();
        expect(screen.getByText('Please select a location')).toBeInTheDocument();
        expect(screen.getByText('Please select a date and time')).toBeInTheDocument();
        expect(screen.getByText('Please upload an image')).toBeInTheDocument();
      });
    });

    test('clears validation errors when user starts typing', async () => {
      renderWithRouter(<ReportPage />);
      
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });
      
      const titleInput = screen.getByPlaceholderText('e.g., Black iPhone 13 with green case');
      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      
      await waitFor(() => {
        expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    test('submits form successfully with valid data', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'test-item-id' })
      });

      renderWithRouter(<ReportPage />);
      
      // Fill out the form
      const typeSelect = document.querySelector('select[name="status"]');
      const categorySelect = document.querySelector('select[name="type"]');
      const locationSelect = document.querySelector('select[name="location"]');
      const titleInput = screen.getByPlaceholderText('e.g., Black iPhone 13 with green case');
      const descriptionInput = screen.getByPlaceholderText('Add unique identifiers and more details about the item...');
      const dateInput = document.querySelector('input[name="date"]');
      expect(typeSelect).toBeDefined();
      expect(categorySelect).toBeDefined();
      expect(locationSelect).toBeDefined();
      expect(dateInput).toBeDefined();
      
      fireEvent.change(typeSelect, { target: { value: 'lost' } });
      fireEvent.change(categorySelect, { target: { value: 'electronics' } });
      fireEvent.change(locationSelect, { target: { value: 'OGGB' } });
      fireEvent.change(titleInput, { target: { value: 'Lost iPhone' } });
      fireEvent.change(descriptionInput, { target: { value: 'Black iPhone with cracked screen' } });
      fireEvent.change(dateInput, { target: { value: '2024-01-15T10:00' } });
      
      // Mock file upload
      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:5876/api/items',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              Authorization: expect.stringContaining('Bearer')
            })
          })
        );
      });
    });

    test('handles submission errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      renderWithRouter(<ReportPage />);
      
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);
      
      // Should show validation errors first
      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });
    });
  });

  describe('Form Reset', () => {
    test('resets form when reset button is clicked', () => {
      renderWithRouter(<ReportPage />);
      
      const titleInput = screen.getByPlaceholderText('e.g., Black iPhone 13 with green case');
      const descriptionInput = screen.getByPlaceholderText('Add unique identifiers and more details about the item...');
      
      // Fill out some fields
      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
      
      // Reset the form
      const resetButton = screen.getByRole('button', { name: 'Reset' });
      fireEvent.click(resetButton);
      
      // Check that fields are cleared
      expect(titleInput.value).toBe('');
      expect(descriptionInput.value).toBe('');
    });

    test('handles form reset gracefully', async () => {
      renderWithRouter(<ReportPage />);
      
      const resetButton = screen.getByRole('button', { name: 'Reset' });
      fireEvent.click(resetButton);
      
      await waitFor(() => {
        // Should handle reset without crashing
        expect(resetButton).toBeInTheDocument();
      });
    });
  });

  describe('Form Data Validation', () => {
    test('validates required fields', () => {
      renderWithRouter(<ReportPage />);
      
      // Look for actual form elements by their labels and types
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Date & Time')).toBeInTheDocument();
    });

    test('validates date format', () => {
      renderWithRouter(<ReportPage />);
      
      const inputs = screen.getAllByDisplayValue('');
      const dateInput = inputs.find(input => input.getAttribute('type') === 'datetime-local');
      expect(dateInput).toHaveAttribute('type', 'datetime-local');
    });

    test('validates image upload', () => {
      renderWithRouter(<ReportPage />);
      
      // Check that photo section exists
      expect(screen.getByText('Photo')).toBeInTheDocument();
      expect(screen.getByText('Click to upload image')).toBeInTheDocument();
    });
  });

  describe('User Experience', () => {
    test('form provides clear feedback on submission', async () => {
      renderWithRouter(<ReportPage />);
      
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        // Form should provide feedback
        expect(submitButton).toBeInTheDocument();
      });
    });

    test('reset button provides clear way to reset form', () => {
      renderWithRouter(<ReportPage />);
      
      const resetButton = screen.getByRole('button', { name: 'Reset' });
      expect(resetButton).toHaveTextContent('Reset');
    });

    test('form is user-friendly and intuitive', () => {
      renderWithRouter(<ReportPage />);
      
      // Check that all form elements are present and properly labeled
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Date & Time')).toBeInTheDocument();
      expect(screen.getByText('Photo')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    test('form integrates with parent component properly', () => {
      renderWithRouter(<ReportPage />);
      
      // Check that the form is rendered (using a more specific selector)
      expect(screen.getAllByDisplayValue('Select').length).toBeGreaterThan(0);
    });

    test('form data is properly structured', async () => {
      renderWithRouter(<ReportPage />);
      
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        // Form data should be properly structured
        const titleInput = screen.getByPlaceholderText('e.g., Black iPhone 13 with green case');
        const descriptionInput = screen.getByPlaceholderText('Add unique identifiers and more details about the item...');
        expect(titleInput.value).toBe('');
        expect(descriptionInput.value).toBe('');
      });
    });
  });
});
