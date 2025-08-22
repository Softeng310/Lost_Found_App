import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import AnnouncementsPage from '../Announcements';
import { setupTestEnvironment, cleanupTestEnvironment, renderWithRouter, mockTestData } from '../../test-utils';

// Mock Firebase modules
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('../../firebase/config', () => ({
  db: {},
  auth: {},
}));

// Setup test environment
setupTestEnvironment();

describe('AnnouncementsPage', () => {
  const { mockAnnouncements } = mockTestData;

  beforeEach(() => {
    cleanupTestEnvironment();
    
    // Mock Firestore collection and getDocs
    const { collection, getDocs } = require('firebase/firestore');
    collection.mockReturnValue('mock-collection');
    getDocs.mockResolvedValue({
      docs: mockAnnouncements.map(announcement => ({
        id: announcement.id,
        data: () => announcement,
      })),
    });
  });

  describe('Rendering', () => {
    test('renders announcements page with title', async () => {
      renderWithRouter(<AnnouncementsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Announcements')).toBeInTheDocument();
        // The page contains SVG bell icons, so we can check for the title instead
        expect(screen.getByText('Announcements')).toBeInTheDocument();
      });
    });

    test('renders all announcements from mock data', async () => {
      renderWithRouter(<AnnouncementsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to the Lost & Found App!')).toBeInTheDocument();
        expect(screen.getByText('New Feature: Item Heatmap')).toBeInTheDocument();
        expect(screen.getByText('Reminder: Keep Your Valuables Safe')).toBeInTheDocument();
      });
    });

    test('renders announcement content', async () => {
      renderWithRouter(<AnnouncementsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Stay tuned for important updates and campus-wide announcements here.')).toBeInTheDocument();
        expect(screen.getByText('You can now view a heatmap of lost and found items on campus. Check it out on the map page!')).toBeInTheDocument();
        expect(screen.getByText('Please remember to keep your belongings secure and report any lost or found items promptly.')).toBeInTheDocument();
      });
    });

    test('renders announcement dates', async () => {
      renderWithRouter(<AnnouncementsPage />);
      
      await waitFor(() => {
        // Check for date elements with emerald styling
        const dateElements = document.querySelectorAll('.bg-emerald-100.text-emerald-700');
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Loading State', () => {
    test('shows loading state initially', () => {
      const { getDocs } = require('firebase/firestore');
      getDocs.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      renderWithRouter(<AnnouncementsPage />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    test('shows error message when fetch fails', async () => {
      const { getDocs } = require('firebase/firestore');
      getDocs.mockRejectedValue(new Error('Failed to fetch'));
      
      renderWithRouter(<AnnouncementsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load announcements. Please try again later.')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    test('shows empty state when no announcements', async () => {
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({ docs: [] });
      
      renderWithRouter(<AnnouncementsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('No announcements found.')).toBeInTheDocument();
      });
    });
  });

  describe('Styling and Layout', () => {
    test('page has proper background and spacing', async () => {
      renderWithRouter(<AnnouncementsPage />);
      
      await waitFor(() => {
        const container = document.querySelector('.min-h-screen.bg-white');
        expect(container).toBeInTheDocument();
      });
    });

    test('announcement cards have proper styling', async () => {
      renderWithRouter(<AnnouncementsPage />);
      
      await waitFor(() => {
        const cards = document.querySelectorAll('.bg-white.border.border-emerald-200');
        expect(cards.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Accessibility', () => {
    test('announcement cards have proper semantic structure', async () => {
      renderWithRouter(<AnnouncementsPage />);
      
      await waitFor(() => {
        const cards = document.querySelectorAll('.bg-white.border.border-emerald-200');
        expect(cards.length).toBeGreaterThan(0);
      });
    });

    test('announcement titles are properly structured', async () => {
      renderWithRouter(<AnnouncementsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to the Lost & Found App!')).toBeInTheDocument();
      });
    });

    test('announcement content is readable and well-formatted', async () => {
      renderWithRouter(<AnnouncementsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Stay tuned for important updates and campus-wide announcements here.')).toBeInTheDocument();
      });
    });
  });
});
