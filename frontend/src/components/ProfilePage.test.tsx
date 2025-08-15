import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfilePage from './ProfilePage';

// Mock the mock-data module
jest.mock('../lib/mock-data', () => ({
  getItemsClient: jest.fn()
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders profile page with navigation', () => {
    // Mock the getItemsClient to return empty array
    const { getItemsClient } = require('../lib/mock-data');
    getItemsClient.mockReturnValue([]);
    
    render(<ProfilePage />);
    
    // Check for main navigation elements
    expect(screen.getByText(/Lost & Found Community/i)).toBeInTheDocument();
    
    // Check for Profile link in navigation - use more specific text
    expect(screen.getByText('Profile')).toBeInTheDocument();
    
    // Check for navigation links using getAllByText to handle hidden elements
    const feedLinks = screen.getAllByText(/Feed/i);
    const reportLinks = screen.getAllByText(/Report/i);
    
    // At least one instance of each should exist (even if hidden)
    expect(feedLinks.length).toBeGreaterThan(0);
    expect(reportLinks.length).toBeGreaterThan(0);
  });

  test('renders profile content', () => {
    const { getItemsClient } = require('../lib/mock-data');
    getItemsClient.mockReturnValue([]);
    
    render(<ProfilePage />);
    expect(screen.getByText(/Profile & History/i)).toBeInTheDocument();
    expect(screen.getByText(/Trust & Verification/i)).toBeInTheDocument();
    expect(screen.getByText(/My Posts/i)).toBeInTheDocument();
    expect(screen.getByText(/My Claims/i)).toBeInTheDocument();
  });

  test('renders mock data correctly', () => {
    const mockItems = [
      {
        id: 1,
        title: 'Lost: Black iPhone 13',
        reporter: { name: 'Guest User' },
        claims: []
      },
      {
        id: 2,
        title: 'Found AirPods',
        reporter: { name: 'Other User' },
        claims: [{ claimer: 'Guest User' }]
      }
    ];
    
    const { getItemsClient } = require('../lib/mock-data');
    getItemsClient.mockReturnValue(mockItems);
    
    render(<ProfilePage />);
    expect(screen.getByText(/Lost: Black iPhone 13/i)).toBeInTheDocument();
    expect(screen.getByText(/Found AirPods/i)).toBeInTheDocument();
  });

  test('renders empty state when no posts exist', () => {
    const mockItems = [
      {
        id: 1,
        title: 'Lost: Black iPhone 13',
        reporter: { name: 'Other User' }, // Not Guest User
        claims: []
      }
    ];
    
    const { getItemsClient } = require('../lib/mock-data');
    getItemsClient.mockReturnValue(mockItems);
    
    render(<ProfilePage />);
    expect(screen.getByText(/No posts yet./i)).toBeInTheDocument();
  });

  test('renders empty state when no claims exist', () => {
    const mockItems = [
      {
        id: 1,
        title: 'Lost: Black iPhone 13',
        reporter: { name: 'Guest User' },
        claims: [{ claimer: 'Other User' }] // Not Guest User
      }
    ];
    
    const { getItemsClient } = require('../lib/mock-data');
    getItemsClient.mockReturnValue(mockItems);
    
    render(<ProfilePage />);
    expect(screen.getByText(/No claims yet./i)).toBeInTheDocument();
  });

  test('renders posts with correct status', () => {
    const mockItems = [
      {
        id: 1,
        title: 'Lost: Black iPhone 13',
        reporter: { name: 'Guest User' },
        claims: []
      }
    ];
    
    const { getItemsClient } = require('../lib/mock-data');
    getItemsClient.mockReturnValue(mockItems);
    
    render(<ProfilePage />);
    expect(screen.getByText(/Lost: Black iPhone 13/i)).toBeInTheDocument();
    expect(screen.getByText(/Open/i)).toBeInTheDocument();
  });

  test('renders claims with correct status', () => {
    const mockItems = [
      {
        id: 1,
        title: 'Found AirPods',
        reporter: { name: 'Other User' },
        claims: [{ claimer: 'Guest User' }],
        status: 'Pending'
      }
    ];
    
    const { getItemsClient } = require('../lib/mock-data');
    getItemsClient.mockReturnValue(mockItems);
    
    render(<ProfilePage />);
    expect(screen.getByText(/Found AirPods/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending/i)).toBeInTheDocument();
  });

  test('handles multiple posts and claims', () => {
    const mockItems = [
      {
        id: 1,
        title: 'Lost: Black iPhone 13',
        reporter: { name: 'Guest User' },
        claims: []
      },
      {
        id: 2,
        title: 'Found AirPods',
        reporter: { name: 'Other User' },
        claims: [{ claimer: 'Guest User' }],
        status: 'Pending'
      },
      {
        id: 3,
        title: 'Lost: Keys',
        reporter: { name: 'Guest User' },
        claims: []
      }
    ];
    
    const { getItemsClient } = require('../lib/mock-data');
    getItemsClient.mockReturnValue(mockItems);
    
    render(<ProfilePage />);
    expect(screen.getByText(/Lost: Black iPhone 13/i)).toBeInTheDocument();
    expect(screen.getByText(/Found AirPods/i)).toBeInTheDocument();
    expect(screen.getByText(/Lost: Keys/i)).toBeInTheDocument();
  });

  test('renders trust and verification section', () => {
    const { getItemsClient } = require('../lib/mock-data');
    getItemsClient.mockReturnValue([]);
    
    render(<ProfilePage />);
    
    expect(screen.getByText(/Trust & Verification/i)).toBeInTheDocument();
    expect(screen.getByText(/Unverified/i)).toBeInTheDocument();
    expect(screen.getByText(/Connect university SSO to verify identity/i)).toBeInTheDocument();
  });

  test('renders navigation links correctly', () => {
    const { getItemsClient } = require('../lib/mock-data');
    getItemsClient.mockReturnValue([]);
    
    render(<ProfilePage />);
    
    // Check for all navigation links - use more specific text matching
    expect(screen.getByText('Feed')).toBeInTheDocument();
    expect(screen.getByText('Report')).toBeInTheDocument();
    expect(screen.getByText('Map')).toBeInTheDocument();
    expect(screen.getByText('Stats')).toBeInTheDocument();
    expect(screen.getByText('Notices')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Repo')).toBeInTheDocument();
  });
});
