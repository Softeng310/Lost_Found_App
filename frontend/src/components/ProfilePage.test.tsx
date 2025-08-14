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
  
  // Check for Profile link in navigation
  expect(screen.getByText(/Profile/i)).toBeInTheDocument();
  
  // Check for at least some navigation links
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
