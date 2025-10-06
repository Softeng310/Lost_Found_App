import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import AddAnnouncementPage from '../AddAnnouncement';
import { setupTestEnvironment, cleanupTestEnvironment, renderWithRouter } from '../../test-utils';
import { setupConsoleErrorSuppression } from '../../test-utils-shared';

// Mock Firebase modules
jest.mock('firebase/firestore');
jest.mock('../../firebase/config', () => ({
  db: {},
}));

// Mock the custom hook
jest.mock('../../hooks/useStaffAuth', () => ({
  useStaffAuth: jest.fn(),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

setupConsoleErrorSuppression();
setupTestEnvironment();

describe('AddAnnouncementPage', () => {
  const mockNavigate = jest.fn();
  const { useStaffAuth } = require('../../hooks/useStaffAuth');

  const mockStaffUser = {
    uid: 'staff-uid',
    email: 'staff@example.com',
  };

  const setupStaffAuthMock = (loading = false, isStaff = true) => {
    useStaffAuth.mockReturnValue({
      currentUser: isStaff ? mockStaffUser : null,
      userRole: isStaff ? 'staff' : 'student',
      loading,
      isStaff,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    cleanupTestEnvironment();
    useNavigate.mockReturnValue(mockNavigate);
    collection.mockReturnValue('mock-collection');
    addDoc.mockResolvedValue({ id: 'new-announcement-id' });
  });

  describe('Access Control', () => {
    test('shows loading state while checking permissions', () => {
      setupStaffAuthMock(true, false);
      renderWithRouter(<AddAnnouncementPage />);
      
      expect(screen.getByText('Checking permissions...')).toBeInTheDocument();
    });

    test('redirects non-staff users (handled by hook)', () => {
      setupStaffAuthMock(false, false);
      renderWithRouter(<AddAnnouncementPage />);
      
      expect(screen.getByText('Checking permissions...')).toBeInTheDocument();
    });

    test('renders form for staff users', async () => {
      setupStaffAuthMock(false, true);
      renderWithRouter(<AddAnnouncementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Announcement')).toBeInTheDocument();
      });
    });
  });

  describe('Form Rendering', () => {
    beforeEach(() => {
      setupStaffAuthMock(false, true);
    });

    test('renders all form fields', async () => {
      renderWithRouter(<AddAnnouncementPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Title')).toBeInTheDocument();
        expect(screen.getByLabelText('Announcement')).toBeInTheDocument();
        expect(screen.getByText('Create Announcement')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });

    test('has back button', async () => {
      renderWithRouter(<AddAnnouncementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Back to Announcements')).toBeInTheDocument();
      });
    });

    test('shows character counters', async () => {
      renderWithRouter(<AddAnnouncementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('0/100 characters')).toBeInTheDocument();
        expect(screen.getByText('0/1000 characters')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      setupStaffAuthMock(false, true);
    });

    test('shows error when title is empty', async () => {
      renderWithRouter(<AddAnnouncementPage />);
      
      await waitFor(() => {
        const submitButton = screen.getByText('Create Announcement');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Please enter a title')).toBeInTheDocument();
      });
    });

    test('shows error when announcement is empty', async () => {
      renderWithRouter(<AddAnnouncementPage />);
      
      await waitFor(() => {
        const titleInput = screen.getByLabelText('Title');
        fireEvent.change(titleInput, { target: { value: 'Test Title' } });
        
        const submitButton = screen.getByText('Create Announcement');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Please enter an announcement')).toBeInTheDocument();
      });
    });

    test('updates character counter when typing', async () => {
      renderWithRouter(<AddAnnouncementPage />);
      
      await waitFor(() => {
        const titleInput = screen.getByLabelText('Title');
        fireEvent.change(titleInput, { target: { value: 'Test' } });
      });

      await waitFor(() => {
        expect(screen.getByText('4/100 characters')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      setupStaffAuthMock(false, true);
    });

    test('successfully creates announcement', async () => {
      renderWithRouter(<AddAnnouncementPage />);
      
      await waitFor(() => {
        const titleInput = screen.getByLabelText('Title');
        const announcementInput = screen.getByLabelText('Announcement');
        
        fireEvent.change(titleInput, { target: { value: 'New Announcement' } });
        fireEvent.change(announcementInput, { target: { value: 'This is a test announcement with enough characters.' } });
        
        const submitButton = screen.getByText('Create Announcement');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(addDoc).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/announcements');
      });
    });

    test('shows loading state during submission', async () => {
      addDoc.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderWithRouter(<AddAnnouncementPage />);
      
      await waitFor(() => {
        const titleInput = screen.getByLabelText('Title');
        const announcementInput = screen.getByLabelText('Announcement');
        
        fireEvent.change(titleInput, { target: { value: 'New Announcement' } });
        fireEvent.change(announcementInput, { target: { value: 'This is a test announcement.' } });
        
        const submitButton = screen.getByText('Create Announcement');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Creating...')).toBeInTheDocument();
      });
    });

    test('handles submission error', async () => {
      addDoc.mockRejectedValue(new Error('Failed to create'));
      renderWithRouter(<AddAnnouncementPage />);
      
      await waitFor(() => {
        const titleInput = screen.getByLabelText('Title');
        const announcementInput = screen.getByLabelText('Announcement');
        
        fireEvent.change(titleInput, { target: { value: 'New Announcement' } });
        fireEvent.change(announcementInput, { target: { value: 'This is a test announcement.' } });
        
        const submitButton = screen.getByText('Create Announcement');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to create announcement. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      setupStaffAuthMock(false, true);
    });

    test('back button navigates to announcements page', async () => {
      renderWithRouter(<AddAnnouncementPage />);
      
      await waitFor(() => {
        const backButton = screen.getByText('Back to Announcements');
        fireEvent.click(backButton);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/announcements');
    });

    test('cancel button navigates to announcements page', async () => {
      renderWithRouter(<AddAnnouncementPage />);
      
      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/announcements');
    });
  });
});
