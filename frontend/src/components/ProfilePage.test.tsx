import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfilePage from './ProfilePage';

// Mock the mock-data module
const mockGetItemsClient = jest.fn();
jest.mock('../lib/mock-data', () => ({
  getItemsClient: mockGetItemsClient
}));

declare global {
  const test: any;
  const expect: any;
  const describe: any;
  const beforeEach: any;
  const jest: any;
}

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders profile page with navigation', () => {
    mockGetItemsClient.mockReturnValue([]);
    render(<ProfilePage />);
    
    // Check for main navigation elements
    expect(screen.getByText(/Lost & Found Community/i)).toBeInTheDocument();
    
    // Check for Profile link in navigation
    expect(screen.getByText(/Profile/i)).toBeInTheDocument();
    
    // Check for navigation links using getAllByText to handle hidden elements
    const feedLinks = screen.getAllByText(/Feed/i);
    const reportLinks = screen.getAllByText(/Report/i);
    
    // At least one instance of each should exist (even if hidden)
    expect(feedLinks.length).toBeGreaterThan(0);
    expect(reportLinks.length).toBeGreaterThan(0);
  });

  test('renders profile content', () => {
    mockGetItemsClient.mockReturnValue([]);
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
    mockGetItemsClient.mockReturnValue(mockItems);
    
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
    mockGetItemsClient.mockReturnValue(mockItems);
    
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
    mockGetItemsClient.mockReturnValue(mockItems);
    
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
    mockGetItemsClient.mockReturnValue(mockItems);
    
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
    mockGetItemsClient.mockReturnValue(mockItems);
    
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
    mockGetItemsClient.mockReturnValue(mockItems);
    
    render(<ProfilePage />);
    expect(screen.getByText(/Lost: Black iPhone 13/i)).toBeInTheDocument();
    expect(screen.getByText(/Found AirPods/i)).toBeInTheDocument();
    expect(screen.getByText(/Lost: Keys/i)).toBeInTheDocument();
  });

  test('renders trust and verification section', () => {
    mockGetItemsClient.mockReturnValue([]);
    render(<ProfilePage />);
    
    expect(screen.getByText(/Trust & Verification/i)).toBeInTheDocument();
    expect(screen.getByText(/Unverified/i)).toBeInTheDocument();
    expect(screen.getByText(/Connect university SSO to verify identity/i)).toBeInTheDocument();
  });

  test('renders navigation links correctly', () => {
    mockGetItemsClient.mockReturnValue([]);
    render(<ProfilePage />);
    
    // Check for all navigation links
    expect(screen.getByText(/Feed/i)).toBeInTheDocument();
    expect(screen.getByText(/Report/i)).toBeInTheDocument();
    expect(screen.getByText(/Map/i)).toBeInTheDocument();
    expect(screen.getByText(/Stats/i)).toBeInTheDocument();
    expect(screen.getByText(/Notices/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin/i)).toBeInTheDocument();
    expect(screen.getByText(/Repo/i)).toBeInTheDocument();
  });
});
