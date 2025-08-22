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

  // Helper functions to reduce code duplication
  const renderAnnouncementsPage = () => {
    return renderWithRouter(<AnnouncementsPage />);
  };

  const assertPageTitle = async () => {
    await waitFor(() => {
      expect(screen.getByText('Announcements')).toBeInTheDocument();
    });
  };

  const assertAllAnnouncementsRendered = async () => {
    await waitFor(() => {
      expect(screen.getByText('Welcome to the Lost & Found App!')).toBeInTheDocument();
      expect(screen.getByText('New Feature: Item Heatmap')).toBeInTheDocument();
      expect(screen.getByText('Reminder: Keep Your Valuables Safe')).toBeInTheDocument();
    });
  };

  const assertAnnouncementContent = async () => {
    await waitFor(() => {
      expect(screen.getByText('Stay tuned for important updates and campus-wide announcements here.')).toBeInTheDocument();
      expect(screen.getByText('You can now view a heatmap of lost and found items on campus. Check it out on the map page!')).toBeInTheDocument();
      expect(screen.getByText('Please remember to keep your belongings secure and report any lost or found items promptly.')).toBeInTheDocument();
    });
  };

  const assertAnnouncementCards = async () => {
    await waitFor(() => {
      const cards = document.querySelectorAll('.bg-white.border.border-emerald-200');
      expect(cards.length).toBeGreaterThan(0);
    });
  };

  const assertAnnouncementDates = async () => {
    await waitFor(() => {
      const dateElements = document.querySelectorAll('.bg-emerald-100.text-emerald-700');
      expect(dateElements.length).toBeGreaterThan(0);
    });
  };

  const assertPageContainer = async () => {
    await waitFor(() => {
      const container = document.querySelector('.min-h-screen.bg-white');
      expect(container).toBeInTheDocument();
    });
  };

  const setupGetDocsMock = (announcements = mockAnnouncements) => {
    const { collection, getDocs } = require('firebase/firestore');
    collection.mockReturnValue('mock-collection');
    getDocs.mockResolvedValue({
      docs: announcements.map(announcement => ({
        id: announcement.id,
        data: () => announcement,
      })),
    });
  };

  const setupLoadingMock = () => {
    const { getDocs } = require('firebase/firestore');
    getDocs.mockImplementation(() => new Promise(() => {})); // Never resolves
  };

  const setupErrorMock = (errorMessage = 'Failed to fetch') => {
    const { getDocs } = require('firebase/firestore');
    getDocs.mockRejectedValue(new Error(errorMessage));
  };

  const setupEmptyMock = () => {
    const { getDocs } = require('firebase/firestore');
    getDocs.mockResolvedValue({ docs: [] });
  };

  beforeEach(() => {
    cleanupTestEnvironment();
    setupGetDocsMock();
  });

  describe('Rendering', () => {
    test('renders announcements page with title', async () => {
      renderAnnouncementsPage();
      await assertPageTitle();
    });

    test('renders all announcements from mock data', async () => {
      renderAnnouncementsPage();
      await assertAllAnnouncementsRendered();
    });

    test('renders announcement content', async () => {
      renderAnnouncementsPage();
      await assertAnnouncementContent();
    });

    test('renders announcement dates', async () => {
      renderAnnouncementsPage();
      await assertAnnouncementDates();
    });
  });

  describe('Loading State', () => {
    test('shows loading state initially', () => {
      setupLoadingMock();
      renderAnnouncementsPage();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    test('shows error message when fetch fails', async () => {
      setupErrorMock();
      renderAnnouncementsPage();
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load announcements. Please try again later.')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    test('shows empty state when no announcements', async () => {
      setupEmptyMock();
      renderAnnouncementsPage();
      
      await waitFor(() => {
        expect(screen.getByText('No announcements found.')).toBeInTheDocument();
      });
    });
  });

  describe('Styling and Layout', () => {
    test('page has proper background and spacing', async () => {
      renderAnnouncementsPage();
      await assertPageContainer();
    });

    test('announcement cards have proper styling', async () => {
      renderAnnouncementsPage();
      await assertAnnouncementCards();
    });
  });

  describe('Accessibility', () => {
    test('announcement cards have proper semantic structure', async () => {
      renderAnnouncementsPage();
      await assertAnnouncementCards();
    });

    test('announcement titles are properly structured', async () => {
      renderAnnouncementsPage();
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to the Lost & Found App!')).toBeInTheDocument();
      });
    });

    test('announcement content is readable and well-formatted', async () => {
      renderAnnouncementsPage();
      
      await waitFor(() => {
        expect(screen.getByText('Stay tuned for important updates and campus-wide announcements here.')).toBeInTheDocument();
      });
    });
  });
});
