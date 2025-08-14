import { render, screen } from '@testing-library/react';
import ProfilePage from './ProfilePage';

test('renders profile page with navigation', () => {
  render(<ProfilePage />);
  
  // Check for main navigation elements
  expect(screen.getByText(/Lost & Found Community/i)).toBeInTheDocument();
  
  // Check for Profile link in navigation
  const profileLink = screen.getByText(/Profile/i);
  expect(profileLink).toBeInTheDocument();
  
  // Check for other navigation elements
  expect(screen.getByText(/Feed/i)).toBeInTheDocument();
  expect(screen.getByText(/Report/i)).toBeInTheDocument();
});

test('renders profile content', () => {
  render(<ProfilePage />);
  expect(screen.getByText(/Profile & History/i)).toBeInTheDocument();
  expect(screen.getByText(/Trust & Verification/i)).toBeInTheDocument();
  expect(screen.getByText(/My Posts/i)).toBeInTheDocument();
  expect(screen.getByText(/My Claims/i)).toBeInTheDocument();
});

test('renders mock data correctly', () => {
  render(<ProfilePage />);
  expect(screen.getByText(/Lost: Black iPhone 13/i)).toBeInTheDocument();
  expect(screen.getByText(/Found AirPods/i)).toBeInTheDocument();
});
