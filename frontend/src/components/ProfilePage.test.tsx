import { render, screen } from '@testing-library/react';
import ProfilePage from './ProfilePage';

test('renders profile page with navigation', () => {
  render(<ProfilePage />);
  expect(screen.getByText(/Lost & Found Community/i)).toBeInTheDocument();
  expect(screen.getByText(/Profile/i)).toBeInTheDocument();
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
  expect(screen.getByText(/Lost iPhone 12/i)).toBeInTheDocument();
  expect(screen.getByText(/Found Wallet/i)).toBeInTheDocument();
});
