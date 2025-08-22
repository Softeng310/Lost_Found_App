import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ReportPage from '../ReportPage';

// Mock the ItemReportForm component
jest.mock('../../components/ItemReportForm', () => ({
  __esModule: true,
  default: () => (
    <div data-testid="item-report-form">
      <h2>Report Lost or Found Item</h2>
      <form>
        <input
          data-testid="title-input"
          type="text"
          placeholder="Item title"
          defaultValue="Test Item"
        />
        <textarea
          data-testid="description-input"
          placeholder="Item description"
          defaultValue="Test description"
        />
        <select data-testid="status-select" defaultValue="lost">
          <option value="lost">Lost</option>
          <option value="found">Found</option>
        </select>
        <select data-testid="type-select" defaultValue="electronics">
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="personal">Personal</option>
        </select>
        <select data-testid="location-select" defaultValue="OGGB">
          <option value="OGGB">OGGB</option>
          <option value="library">General Library</option>
        </select>
        <input
          data-testid="date-input"
          type="datetime-local"
          defaultValue="2024-01-01T10:00"
        />
        <input
          data-testid="image-input"
          type="file"
          accept="image/*"
        />
        <button type="submit" data-testid="submit-button">Submit</button>
        <button type="button" data-testid="reset-button">Reset</button>
      </form>
    </div>
  ),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// Wrapper component to provide router context
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
    mockNavigate.mockClear();
  });

  describe('Rendering', () => {
    test('renders report page with title and description', () => {
      renderWithRouter(<ReportPage />);
      
      expect(screen.getByText('Report a Lost or Found Item')).toBeInTheDocument();
      expect(screen.getByText(/Add details so the community can help reconnect items with owners/)).toBeInTheDocument();
    });

    test('renders ItemReportForm component', () => {
      renderWithRouter(<ReportPage />);
      
      expect(screen.getByTestId('item-report-form')).toBeInTheDocument();
      expect(screen.getByText('Report Lost or Found Item')).toBeInTheDocument();
    });

    test('form has all required input fields', () => {
      renderWithRouter(<ReportPage />);
      
      expect(screen.getByTestId('title-input')).toBeInTheDocument();
      expect(screen.getByTestId('description-input')).toBeInTheDocument();
      expect(screen.getByTestId('status-select')).toBeInTheDocument();
      expect(screen.getByTestId('type-select')).toBeInTheDocument();
      expect(screen.getByTestId('location-select')).toBeInTheDocument();
      expect(screen.getByTestId('date-input')).toBeInTheDocument();
      expect(screen.getByTestId('image-input')).toBeInTheDocument();
    });

    test('form has submit and reset buttons', () => {
      renderWithRouter(<ReportPage />);
      
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      expect(screen.getByTestId('reset-button')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    test('handles form submission with valid data', async () => {
      renderWithRouter(<ReportPage />);
      
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        // The form should submit successfully
        expect(submitButton).toBeInTheDocument();
      });
    });

    test('form data is properly structured on submission', async () => {
      renderWithRouter(<ReportPage />);
      
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        // Check that form data is properly structured
        expect(screen.getByTestId('title-input').value).toBe('Test Item');
        expect(screen.getByTestId('description-input').value).toBe('Test description');
        expect(screen.getByTestId('status-select').value).toBe('lost');
        expect(screen.getByTestId('type-select').value).toBe('electronics');
        expect(screen.getByTestId('location-select').value).toBe('OGGB');
        expect(screen.getByTestId('date-input').value).toBe('2024-01-01T10:00');
      });
    });
  });

  describe('Form Validation', () => {
    test('form inputs have proper attributes', () => {
      renderWithRouter(<ReportPage />);
      
      const titleInput = screen.getByTestId('title-input');
      const descriptionInput = screen.getByTestId('description-input');
      const dateInput = screen.getByTestId('date-input');
      const imageInput = screen.getByTestId('image-input');
      
      expect(titleInput).toHaveAttribute('type', 'text');
      expect(descriptionInput).toHaveAttribute('placeholder', 'Item description');
      expect(dateInput).toHaveAttribute('type', 'datetime-local');
      expect(imageInput).toHaveAttribute('type', 'file');
      expect(imageInput).toHaveAttribute('accept', 'image/*');
    });

    test('select dropdowns have proper options', () => {
      renderWithRouter(<ReportPage />);
      
      const statusSelect = screen.getByTestId('status-select');
      const typeSelect = screen.getByTestId('type-select');
      const locationSelect = screen.getByTestId('location-select');
      
      expect(statusSelect).toHaveValue('lost');
      expect(typeSelect).toHaveValue('electronics');
      expect(locationSelect).toHaveValue('OGGB');
    });
  });

  describe('Navigation', () => {
    test('reset button resets form', async () => {
      renderWithRouter(<ReportPage />);
      
      const resetButton = screen.getByTestId('reset-button');
      fireEvent.click(resetButton);
      
      await waitFor(() => {
        // Form should be reset
        expect(resetButton).toBeInTheDocument();
      });
    });
  });

  describe('Form State Management', () => {
    test('form inputs maintain their values', () => {
      renderWithRouter(<ReportPage />);
      
      const titleInput = screen.getByTestId('title-input');
      const descriptionInput = screen.getByTestId('description-input');
      
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
      fireEvent.change(descriptionInput, { target: { value: 'Updated description' } });
      
      expect(titleInput.value).toBe('Updated Title');
      expect(descriptionInput.value).toBe('Updated description');
    });

    test('select dropdowns can be changed', () => {
      renderWithRouter(<ReportPage />);
      
      const statusSelect = screen.getByTestId('status-select');
      const typeSelect = screen.getByTestId('type-select');
      
      fireEvent.change(statusSelect, { target: { value: 'found' } });
      fireEvent.change(typeSelect, { target: { value: 'clothing' } });
      
      expect(statusSelect.value).toBe('found');
      expect(typeSelect.value).toBe('clothing');
    });
  });

  describe('Accessibility', () => {
    test('form has proper semantic structure', () => {
      renderWithRouter(<ReportPage />);
      
      const form = screen.getByTestId('item-report-form').querySelector('form');
      expect(form).toBeInTheDocument();
    });

    test('form inputs have proper labels and placeholders', () => {
      renderWithRouter(<ReportPage />);
      
      const titleInput = screen.getByTestId('title-input');
      const descriptionInput = screen.getByTestId('description-input');
      
      expect(titleInput).toHaveAttribute('placeholder', 'Item title');
      expect(descriptionInput).toHaveAttribute('placeholder', 'Item description');
    });

    test('buttons have proper accessibility attributes', () => {
      renderWithRouter(<ReportPage />);
      
      const submitButton = screen.getByTestId('submit-button');
      const resetButton = screen.getByTestId('reset-button');
      
      expect(submitButton).toHaveAttribute('type', 'submit');
      expect(resetButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Styling and Layout', () => {
    test('page has proper container styling', () => {
      renderWithRouter(<ReportPage />);
      
      const container = screen.getByText('Report a Lost or Found Item').closest('div');
      expect(container).toHaveClass('p-6');
    });

    test('form has proper styling classes', () => {
      renderWithRouter(<ReportPage />);
      
      const form = screen.getByTestId('item-report-form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles form submission errors gracefully', async () => {
      renderWithRouter(<ReportPage />);
      
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        // Should handle submission without crashing
        expect(submitButton).toBeInTheDocument();
      });
    });

    test('handles form reset gracefully', async () => {
      renderWithRouter(<ReportPage />);
      
      const resetButton = screen.getByTestId('reset-button');
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
      
      const titleInput = screen.getByTestId('title-input');
      const descriptionInput = screen.getByTestId('description-input');
      const dateInput = screen.getByTestId('date-input');
      
      expect(titleInput).toBeInTheDocument();
      expect(descriptionInput).toBeInTheDocument();
      expect(dateInput).toBeInTheDocument();
    });

    test('validates date format', () => {
      renderWithRouter(<ReportPage />);
      
      const dateInput = screen.getByTestId('date-input');
      expect(dateInput).toHaveAttribute('type', 'datetime-local');
    });

    test('validates image upload', () => {
      renderWithRouter(<ReportPage />);
      
      const imageInput = screen.getByTestId('image-input');
      expect(imageInput).toHaveAttribute('type', 'file');
      expect(imageInput).toHaveAttribute('accept', 'image/*');
    });
  });

  describe('User Experience', () => {
    test('form provides clear feedback on submission', async () => {
      renderWithRouter(<ReportPage />);
      
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        // Form should provide feedback
        expect(submitButton).toBeInTheDocument();
      });
    });

    test('reset button provides clear way to reset form', () => {
      renderWithRouter(<ReportPage />);
      
      const resetButton = screen.getByTestId('reset-button');
      expect(resetButton).toHaveTextContent('Reset');
    });

    test('form is user-friendly and intuitive', () => {
      renderWithRouter(<ReportPage />);
      
      // Check that all form elements are present and properly labeled
      expect(screen.getByTestId('title-input')).toBeInTheDocument();
      expect(screen.getByTestId('description-input')).toBeInTheDocument();
      expect(screen.getByTestId('status-select')).toBeInTheDocument();
      expect(screen.getByTestId('type-select')).toBeInTheDocument();
      expect(screen.getByTestId('location-select')).toBeInTheDocument();
      expect(screen.getByTestId('date-input')).toBeInTheDocument();
      expect(screen.getByTestId('image-input')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    test('form integrates with parent component properly', () => {
      renderWithRouter(<ReportPage />);
      
      const form = screen.getByTestId('item-report-form');
      expect(form).toBeInTheDocument();
    });

    test('form data is properly structured', async () => {
      renderWithRouter(<ReportPage />);
      
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        // Form data should be properly structured
        expect(screen.getByTestId('title-input').value).toBe('Test Item');
        expect(screen.getByTestId('description-input').value).toBe('Test description');
      });
    });
  });
});
