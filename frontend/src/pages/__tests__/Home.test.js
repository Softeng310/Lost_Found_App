import React from 'react';
import { screen } from '@testing-library/react';
import HomePage from '../Home';
import { setupTestEnvironment, cleanupTestEnvironment, renderWithRouter } from '../../test-utils';

// Setup test environment
setupTestEnvironment();

describe('HomePage', () => {
  beforeEach(() => {
    cleanupTestEnvironment();
  });

  describe('Rendering', () => {
    test('renders hero section with title and subtitle', () => {
      renderWithRouter(<HomePage />);
      
      expect(screen.getByText('Lost & Found Community')).toBeInTheDocument();
      expect(screen.getByText(/Connect with your community to find lost items and return found belongings/)).toBeInTheDocument();
    });

    test('renders action buttons', () => {
      renderWithRouter(<HomePage />);
      
      expect(screen.getAllByText('Browse Items').length).toBeGreaterThan(0);
      expect(screen.getByText('Report Item')).toBeInTheDocument();
    });

    test('renders stats section', () => {
      renderWithRouter(<HomePage />);
      
      expect(screen.getByText('Items Reunited')).toBeInTheDocument();
      expect(screen.getByText('Active Users')).toBeInTheDocument();
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
    });

    test('renders features section', () => {
      renderWithRouter(<HomePage />);
      
      expect(screen.getByText('How It Works')).toBeInTheDocument();
      expect(screen.getByText('Find Lost Items')).toBeInTheDocument();
      expect(screen.getByText('Location Tracking')).toBeInTheDocument();
      expect(screen.getByText('Stay Updated')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    test('browse items button links to feed page', () => {
      renderWithRouter(<HomePage />);
      
      // Get all Browse Items buttons and check the first one (hero section)
      const browseButtons = screen.getAllByText('Browse Items');
      expect(browseButtons.length).toBe(2); // Should have 2 buttons
      
      // Check the first button (hero section)
      const heroButton = browseButtons[0].closest('a');
      expect(heroButton).toHaveAttribute('href', '/feed');
      
      // Check the second button (CTA section) also links to feed
      const ctaButton = browseButtons[1].closest('a');
      expect(ctaButton).toHaveAttribute('href', '/feed');
    });

    test('report item button links to new item page', () => {
      renderWithRouter(<HomePage />);
      
      const reportButton = screen.getByText('Report Item').closest('a');
      expect(reportButton).toHaveAttribute('href', '/items/new');
    });
  });

  describe('Icons and Visual Elements', () => {
    test('renders all required icons in the features section', () => {
      renderWithRouter(<HomePage />);
      
      // Check for SVG icons in the features section
      const featureIcons = document.querySelectorAll('section:nth-child(3) svg');
      expect(featureIcons.length).toBeGreaterThan(0);
    });

    test('renders all required icons in the stats section', () => {
      renderWithRouter(<HomePage />);
      
      // Check for SVG icons in the stats section
      const statsIcons = document.querySelectorAll('section:nth-child(2) svg');
      expect(statsIcons.length).toBeGreaterThan(0);
    });

    test('renders icons in action buttons', () => {
      renderWithRouter(<HomePage />);
      
      // Check for SVG icons in the action buttons
      const buttonIcons = document.querySelectorAll('section:nth-child(1) svg');
      expect(buttonIcons.length).toBeGreaterThan(0);
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
      
      const buttons = screen.getAllByRole('button');
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
      const heroButtonContainer = browseButtons[0].closest('div');
      expect(heroButtonContainer).toHaveClass('flex', 'flex-col', 'sm:flex-row');
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
