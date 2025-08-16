import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfilePage from './ProfilePage';

// TypeScript declarations for Jest globals
declare const jest: any;
declare const describe: any;
declare const test: any;
declare const expect: any;
declare const beforeEach: any;

describe('ProfilePage', () => {
  test('renders profile page with navigation', () => {
    render(<ProfilePage />);
    
    // Check for main navigation elements
    expect(screen.getByText(/Lost & Found Community/i)).toBeInTheDocument();
    
    // Check for Profile button in navigation
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  test('renders profile content', () => {
    render(<ProfilePage />);
    expect(screen.getByText(/Profile & History/i)).toBeInTheDocument();
    expect(screen.getByText(/Trust & Verification/i)).toBeInTheDocument();
    expect(screen.getByText(/My Posts/i)).toBeInTheDocument();
    expect(screen.getByText(/My Claims/i)).toBeInTheDocument();
  });

  test('renders trust and verification section', () => {
    render(<ProfilePage />);
    
    expect(screen.getByText(/Trust & Verification/i)).toBeInTheDocument();
    expect(screen.getByText(/Unverified/i)).toBeInTheDocument();
    expect(screen.getByText(/Connect university SSO to verify identity/i)).toBeInTheDocument();
  });

  test('renders navigation buttons correctly', () => {
    render(<ProfilePage />);
    
    // Check for all navigation buttons
    expect(screen.getByText('Feed')).toBeInTheDocument();
    expect(screen.getByText('Report')).toBeInTheDocument();
    expect(screen.getByText('Map')).toBeInTheDocument();
    expect(screen.getByText('Stats')).toBeInTheDocument();
    expect(screen.getByText('Notices')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Repo')).toBeInTheDocument();
  });
});
