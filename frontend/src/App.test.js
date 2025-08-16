import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app without crashing', () => {
  render(<App />);
  expect(screen.getByText(/Lost & Found Community/i)).toBeInTheDocument();
});

test('renders profile page content', () => {
  render(<App />);
  expect(screen.getByText(/Profile & History/i)).toBeInTheDocument();
  expect(screen.getByText(/Trust & Verification/i)).toBeInTheDocument();
});
