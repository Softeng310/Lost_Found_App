import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SignUpPage from '../SignUp';
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock Firebase modules
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('../../firebase/config', () => ({
  app: {}
}));

// Mock fetch for profile picture upload
globalThis.fetch = jest.fn();

// Helper to render component with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

// Helper to fill out the signup form
const fillSignupForm = (includeProfilePic = false, filename = 'profile.png', fileType = 'image/png') => {
  fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test User' } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
  fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
  
  if (includeProfilePic) {
    const fileInput = screen.getByLabelText(/profile picture/i);
    const file = new File(['dummy'], filename, { type: fileType });
    fireEvent.change(fileInput, { target: { files: [file] } });
  }
};

// Helper to mock successful upload
const mockSuccessfulUpload = () => {
  const mockResponse = {
    ok: true,
    json: async () => ({ success: true, url: 'https://cloudinary.com/test.jpg' })
  };
  
  globalThis.fetch.mockImplementation(() => 
    new Promise(resolve => {
      setTimeout(() => resolve(mockResponse), 100);
    })
  );
};

describe('SignUp Page - Profile Picture Upload', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockNavigate.mockClear();
    
    // Reset fetch mock completely
    globalThis.fetch.mockReset();
    
    // Mock Firebase auth
    getAuth.mockReturnValue({});
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null); // No user logged in
      return jest.fn(); // Return unsubscribe function
    });
    
    // Mock Firestore
    getFirestore.mockReturnValue({});
    doc.mockReturnValue({});
    setDoc.mockResolvedValue({});
    
    // Mock successful auth
    createUserWithEmailAndPassword.mockResolvedValue({
      user: { uid: 'test-uid', email: 'test@example.com' }
    });
  });

  describe('File Selection', () => {
    test('allows user to select a valid image file', () => {
      renderWithRouter(<SignUpPage />);
      
      const fileInput = screen.getByLabelText(/profile picture/i);
      const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      expect(screen.getByText(/Selected: test.png/i)).toBeInTheDocument();
    });

    test('shows error for invalid file type', () => {
      renderWithRouter(<SignUpPage />);
      
      const fileInput = screen.getByLabelText(/profile picture/i);
      const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      expect(screen.getByText(/please select a valid image file/i)).toBeInTheDocument();
    });

    test('shows error for file larger than 2MB', () => {
      renderWithRouter(<SignUpPage />);
      
      const fileInput = screen.getByLabelText(/profile picture/i);
      // Create a file larger than 2MB
      const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large.png', { type: 'image/png' });
      Object.defineProperty(largeFile, 'size', { value: 3 * 1024 * 1024 });
      
      fireEvent.change(fileInput, { target: { files: [largeFile] } });
      
      expect(screen.getByText(/image must be less than 2mb/i)).toBeInTheDocument();
    });

    test('accepts JPEG files', () => {
      renderWithRouter(<SignUpPage />);
      
      const fileInput = screen.getByLabelText(/profile picture/i);
      const file = new File(['dummy'], 'photo.jpg', { type: 'image/jpeg' });
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      expect(screen.getByText(/Selected: photo.jpg/i)).toBeInTheDocument();
    });

    test('accepts WEBP files', () => {
      renderWithRouter(<SignUpPage />);
      
      const fileInput = screen.getByLabelText(/profile picture/i);
      const file = new File(['dummy'], 'photo.webp', { type: 'image/webp' });
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      expect(screen.getByText(/Selected: photo.webp/i)).toBeInTheDocument();
    });
  });

  describe('Profile Picture Upload', () => {
    test('shows uploading state during upload', async () => {
      mockSuccessfulUpload();
      renderWithRouter(<SignUpPage />);
      
      fillSignupForm(true);
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);
      
      // Should show uploading state
      await waitFor(() => {
        expect(screen.getByText(/uploading image/i)).toBeInTheDocument();
      });
    });
  });

  describe('Account Creation Without Profile Picture', () => {
    test('creates account without profile picture', async () => {
      renderWithRouter(<SignUpPage />);
      
      fillSignupForm(false);
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);
      
      // Should NOT call upload endpoint
      expect(globalThis.fetch).not.toHaveBeenCalled();
      
      // Should still create account with empty profilePic
      await waitFor(() => {
        expect(setDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            profilePic: ''
          })
        );
      });
    });
  });

  describe('UI States', () => {
    test('disables file input during upload', async () => {
      mockSuccessfulUpload();
      renderWithRouter(<SignUpPage />);
      
      fillSignupForm(true);
      
      const fileInput = screen.getByLabelText(/profile picture/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);
      
      // File input should be disabled during upload
      await waitFor(() => {
        expect(fileInput).toBeDisabled();
      });
    });

    test('disables submit button during upload', async () => {
      mockSuccessfulUpload();
      renderWithRouter(<SignUpPage />);
      
      fillSignupForm(true);
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);
      
      // Submit button should be disabled during upload
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });
});