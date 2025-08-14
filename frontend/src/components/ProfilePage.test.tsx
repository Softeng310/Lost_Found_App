import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfilePage from './ProfilePage';

declare global {
  const test: any;
  const expect: any;
}

test('renders profile page with navigation', () => {
  render(<ProfilePage />);
  
  // Check for main navigation elements
  expect(screen.getByText(/Lost & Found Community/i)).toBeInTheDocument();
  
  // Check for Profile link in navigation (this should always be visible)
  const profileLink = screen.getByText(/Profile/i);
  expect(profileLink).toBeInTheDocument();
  
  // Check for navigation links (these are hidden on mobile with 'hidden md:flex' classes)
  // We need to check if they exist in the DOM, even if hidden
  const navigationContainer = screen.getByText(/Feed/i).closest('div');
  expect(navigationContainer).toBeInTheDocument();
  
  // Verify the navigation container has the correct classes
  expect(navigationContainer).toHaveClass('hidden', 'md:flex');
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
