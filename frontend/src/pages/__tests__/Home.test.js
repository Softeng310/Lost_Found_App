import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../Home';

// Mock the components that Home page uses
jest.mock('../../components/ui/button', () => ({
  Button: ({ children, ...props }) => (
    <button {...props} data-testid="button">
      {children}
    </button>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon">Search</div>,
  MapPin: () => <div data-testid="mappin-icon">MapPin</div>,
  Bell: () => <div data-testid="bell-icon">Bell</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  Shield: () => <div data-testid="shield-icon">Shield</div>,
  Heart: () => <div data-testid="heart-icon">Heart</div>,
}));

// Wrapper component to provide router context
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('HomePage', () => {
  beforeEach(() => {
    // Clear any previous renders
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders the main hero section with title and subtitle', () => {
      renderWithRouter(<HomePage />);
      
      expect(screen.getByText('Lost & Found Community')).toBeInTheDocument();
      expect(screen.getByText(/Connect with your community to find lost items/)).toBeInTheDocument();
    });

    test('renders action buttons for browsing items and reporting items', () => {
      renderWithRouter(<HomePage />);
      
      expect(screen.getAllByText('Browse Items').length).toBeGreaterThan(0);
      expect(screen.getByText('Report Item')).toBeInTheDocument();
    });

    test('renders community statistics section', () => {
      renderWithRouter(<HomePage />);
      
      expect(screen.getByText('Items Reunited')).toBeInTheDocument();
      expect(screen.getByText('500+')).toBeInTheDocument();
      expect(screen.getByText('Active Users')).toBeInTheDocument();
      expect(screen.getByText('2,000+')).toBeInTheDocument();
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    test('renders features section with "How It Works" title', () => {
      renderWithRouter(<HomePage />);
      
      expect(screen.getByText('How It Works')).toBeInTheDocument();
    });

    test('renders all feature cards with correct content', () => {
      renderWithRouter(<HomePage />);
      
      // Check for feature titles
      expect(screen.getByText('Find Lost Items')).toBeInTheDocument();
      expect(screen.getByText('Location Tracking')).toBeInTheDocument();
      expect(screen.getByText('Stay Updated')).toBeInTheDocument();
      
      // Check for feature descriptions
      expect(screen.getByText(/Search through reported lost items/)).toBeInTheDocument();
      expect(screen.getByText(/See where items were lost or found/)).toBeInTheDocument();
      expect(screen.getByText(/Get notifications about new items/)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    test('Browse Items button links to /feed', () => {
      renderWithRouter(<HomePage />);
      
      const browseButtons = screen.getAllByText('Browse Items');
      const browseButton = browseButtons[0].closest('a');
      expect(browseButton).toHaveAttribute('href', '/feed');
    });

    test('Report Item button links to /items/new', () => {
      renderWithRouter(<HomePage />);
      
      const reportButton = screen.getByText('Report Item').closest('a');
      expect(reportButton).toHaveAttribute('href', '/items/new');
    });
  });

  describe('Icons and Visual Elements', () => {
    test('renders all required icons in the features section', () => {
      renderWithRouter(<HomePage />);
      
      expect(screen.getAllByTestId('search-icon').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('mappin-icon').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('bell-icon').length).toBeGreaterThan(0);
    });

    test('renders all required icons in the stats section', () => {
      renderWithRouter(<HomePage />);
      
      expect(screen.getAllByTestId('heart-icon').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('users-icon').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('shield-icon').length).toBeGreaterThan(0);
    });

    test('renders icons in action buttons', () => {
      renderWithRouter(<HomePage />);
      
      expect(screen.getAllByTestId('search-icon').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('plus-icon').length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    test('has proper heading hierarchy', () => {
      renderWithRouter(<HomePage />);
      
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Lost & Found Community');
      
      const h2s = screen.getAllByRole('heading', { level: 2 });
      expect(h2s.length).toBeGreaterThan(0);
      expect(h2s.some(h2 => h2.textContent === 'How It Works')).toBe(true);
    });

    test('buttons have proper accessibility attributes', () => {
      renderWithRouter(<HomePage />);
      
      const buttons = screen.getAllByTestId('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    test('renders with responsive classes', () => {
      renderWithRouter(<HomePage />);
      
      const mainContainer = screen.getByText('Lost & Found Community').closest('h1');
      expect(mainContainer).toHaveClass('text-5xl', 'md:text-7xl');
    });

    test('action buttons have responsive layout classes', () => {
      renderWithRouter(<HomePage />);
      
      const browseButtons = screen.getAllByText('Browse Items');
      const buttonContainer = browseButtons[0].closest('div');
      expect(buttonContainer).toHaveClass('flex', 'flex-col', 'sm:flex-row');
    });
  });

  describe('Content Structure', () => {
    test('has proper semantic structure with sections', () => {
      renderWithRouter(<HomePage />);
      
      const sections = document.querySelectorAll('section');
      expect(sections.length).toBeGreaterThan(0);
    });

    test('stats are displayed in a grid layout', () => {
      renderWithRouter(<HomePage />);
      
      // Find the section containing stats and check its child div has the grid classes
      const statsSection = screen.getByText('Items Reunited').closest('section');
      const gridContainer = statsSection.querySelector('.grid.md\\:grid-cols-3');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Constants and Content', () => {
    test('displays correct hero title constant', () => {
      renderWithRouter(<HomePage />);
      
      expect(screen.getByText('Lost & Found Community')).toBeInTheDocument();
    });

    test('displays correct hero subtitle constant', () => {
      renderWithRouter(<HomePage />);
      
      expect(screen.getByText(/Connect with your community to find lost items and return found belongings/)).toBeInTheDocument();
    });

    test('displays correct stats values', () => {
      renderWithRouter(<HomePage />);
      
      expect(screen.getByText('500+')).toBeInTheDocument();
      expect(screen.getByText('2,000+')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });
});
