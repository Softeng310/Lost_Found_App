import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import EditAnnouncementPage from '../EditAnnouncement';
import { setupTestEnvironment, cleanupTestEnvironment, renderWithRouter } from '../../test-utils';
import { setupConsoleErrorSuppression } from '../../test-utils-shared';
import {
  setupStaffAuthMock,
  setupAnnouncementFirestoreMocks,
  createMockAnnouncement,
  fillAnnouncementForm,
  submitForm,
  clickButton,
  assertFormFields,
  assertButtons,
  assertErrorMessage,
  assertLoadingState,
  assertNavigationCalled,
} from '../../test-utils-announcements';

// Mock modules
jest.mock('firebase/firestore');
jest.mock('../../firebase/config', () => ({ db: {} }));
jest.mock('../../hooks/useStaffAuth', () => ({ useStaffAuth: jest.fn() }));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));

setupConsoleErrorSuppression();
setupTestEnvironment();

describe('EditAnnouncementPage', () => {
  const mockNavigate = jest.fn();
  const { useStaffAuth } = require('../../hooks/useStaffAuth');
  const mockAnnouncement = createMockAnnouncement();

  beforeEach(() => {
    jest.clearAllMocks();
    cleanupTestEnvironment();
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue({ id: 'test-announcement-id' });
    setupAnnouncementFirestoreMocks(
      { doc, getDoc, updateDoc, deleteDoc },
      [],
      mockAnnouncement
    );
  });

  describe('Access Control', () => {
    test('shows loading state while checking permissions', () => {
      setupStaffAuthMock(useStaffAuth, true, false);
      renderWithRouter(<EditAnnouncementPage />);
      assertLoadingState(screen, 'Checking permissions...');
    });

    test('shows loading state while fetching announcement', () => {
      getDoc.mockImplementation(() => new Promise(() => {}));
      setupStaffAuthMock(useStaffAuth, false, true);
      renderWithRouter(<EditAnnouncementPage />);
      assertLoadingState(screen, 'Loading...');
    });
  });

  describe('Form Rendering', () => {
    beforeEach(() => setupStaffAuthMock(useStaffAuth, false, true));

    test('renders edit form with existing data', async () => {
      renderWithRouter(<EditAnnouncementPage />);
      await waitFor(() => {
        expect(screen.getByText('Edit Announcement')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Announcement')).toBeInTheDocument();
        expect(screen.getByDisplayValue('This is a test announcement content.')).toBeInTheDocument();
      });
    });

    test('renders all form buttons', async () => {
      renderWithRouter(<EditAnnouncementPage />);
      await assertButtons(screen, waitFor, ['Save Changes', 'Cancel', 'Delete Announcement']);
    });

    test('has back button', async () => {
      renderWithRouter(<EditAnnouncementPage />);
      await assertButtons(screen, waitFor, ['Back to Announcements']);
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => setupStaffAuthMock(useStaffAuth, false, true));

    test('shows error when title is cleared', async () => {
      renderWithRouter(<EditAnnouncementPage />);
      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Test Announcement');
        fireEvent.change(titleInput, { target: { value: '' } });
        submitForm(screen, fireEvent, 'Save Changes');
      });
      await assertErrorMessage(screen, waitFor, 'Please enter a title');
    });

    test('shows error when announcement is cleared', async () => {
      renderWithRouter(<EditAnnouncementPage />);
      await waitFor(() => {
        const announcementInput = screen.getByDisplayValue('This is a test announcement content.');
        fireEvent.change(announcementInput, { target: { value: '' } });
        submitForm(screen, fireEvent, 'Save Changes');
      });
      await assertErrorMessage(screen, waitFor, 'Please enter an announcement');
    });
  });

  describe('Update Functionality', () => {
    beforeEach(() => setupStaffAuthMock(useStaffAuth, false, true));

    test('successfully updates announcement', async () => {
      renderWithRouter(<EditAnnouncementPage />);
      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Test Announcement');
        fireEvent.change(titleInput, { target: { value: 'Updated Announcement' } });
        submitForm(screen, fireEvent, 'Save Changes');
      });
      await waitFor(() => {
        expect(updateDoc).toHaveBeenCalled();
        assertNavigationCalled(mockNavigate, '/announcements');
      });
    });

    test('shows loading state during update', async () => {
      updateDoc.mockImplementation(() => new Promise(() => {}));
      renderWithRouter(<EditAnnouncementPage />);
      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Test Announcement');
        fireEvent.change(titleInput, { target: { value: 'Updated' } });
        submitForm(screen, fireEvent, 'Save Changes');
      });
      await waitFor(() => assertLoadingState(screen, 'Saving...'));
    });

    test('handles update error', async () => {
      updateDoc.mockRejectedValue(new Error('Failed'));
      renderWithRouter(<EditAnnouncementPage />);
      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Test Announcement');
        fireEvent.change(titleInput, { target: { value: 'Updated' } });
        submitForm(screen, fireEvent, 'Save Changes');
      });
      await assertErrorMessage(screen, waitFor, 'Failed to update announcement. Please try again.');
    });
  });

  describe('Delete Functionality', () => {
    beforeEach(() => setupStaffAuthMock(useStaffAuth, false, true));

    test('shows delete confirmation dialog', async () => {
      renderWithRouter(<EditAnnouncementPage />);
      await waitFor(() => clickButton(screen, fireEvent, 'Delete Announcement'));
      await waitFor(() => {
        expect(screen.getByText('Are you sure? This action cannot be undone.')).toBeInTheDocument();
        expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
      });
    });

    test('can cancel delete', async () => {
      renderWithRouter(<EditAnnouncementPage />);
      await waitFor(() => clickButton(screen, fireEvent, 'Delete Announcement'));
      await waitFor(() => {
        const cancelButtons = screen.getAllByText('Cancel');
        fireEvent.click(cancelButtons[cancelButtons.length - 1]);
      });
      await waitFor(() => {
        expect(screen.queryByText('Are you sure? This action cannot be undone.')).not.toBeInTheDocument();
        expect(deleteDoc).not.toHaveBeenCalled();
      });
    });

    test('successfully deletes announcement', async () => {
      renderWithRouter(<EditAnnouncementPage />);
      await waitFor(() => clickButton(screen, fireEvent, 'Delete Announcement'));
      await waitFor(() => clickButton(screen, fireEvent, 'Yes, Delete'));
      await waitFor(() => {
        expect(deleteDoc).toHaveBeenCalled();
        assertNavigationCalled(mockNavigate, '/announcements');
      });
    });

    test('handles delete error', async () => {
      deleteDoc.mockRejectedValue(new Error('Failed'));
      renderWithRouter(<EditAnnouncementPage />);
      await waitFor(() => clickButton(screen, fireEvent, 'Delete Announcement'));
      await waitFor(() => clickButton(screen, fireEvent, 'Yes, Delete'));
      await assertErrorMessage(screen, waitFor, 'Failed to delete announcement. Please try again.');
    });
  });

  describe('Navigation', () => {
    beforeEach(() => setupStaffAuthMock(useStaffAuth, false, true));

    test('back button navigates to announcements page', async () => {
      renderWithRouter(<EditAnnouncementPage />);
      await waitFor(() => clickButton(screen, fireEvent, 'Back to Announcements'));
      assertNavigationCalled(mockNavigate, '/announcements');
    });

    test('cancel button navigates to announcements page', async () => {
      renderWithRouter(<EditAnnouncementPage />);
      await waitFor(() => clickButton(screen, fireEvent, 'Cancel'));
      assertNavigationCalled(mockNavigate, '/announcements');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => setupStaffAuthMock(useStaffAuth, false, true));

    test('handles announcement not found', async () => {
      getDoc.mockResolvedValue({ exists: () => false, data: () => null });
      renderWithRouter(<EditAnnouncementPage />);
      await assertErrorMessage(screen, waitFor, 'Announcement not found');
    });
  });
});

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
  useParams: jest.fn(),
}));

setupConsoleErrorSuppression();
setupTestEnvironment();

describe('EditAnnouncementPage', () => {
  const mockNavigate = jest.fn();
  const { useStaffAuth } = require('../../hooks/useStaffAuth');

  const mockStaffUser = {
    uid: 'staff-uid',
    email: 'staff@example.com',
  };

  const mockAnnouncement = {
    id: 'test-announcement-id',
    title: 'Test Announcement',
    announcement: 'This is a test announcement content.',
    datePosted: '2024-01-01T10:00:00.000Z',
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
    useParams.mockReturnValue({ id: 'test-announcement-id' });
    doc.mockReturnValue('mock-doc-ref');
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockAnnouncement,
    });
    updateDoc.mockResolvedValue({});
    deleteDoc.mockResolvedValue({});
  });

  describe('Access Control', () => {
    test('shows loading state while checking permissions', () => {
      setupStaffAuthMock(true, false);
      renderWithRouter(<EditAnnouncementPage />);
      
      expect(screen.getByText('Checking permissions...')).toBeInTheDocument();
    });

    test('shows loading state while fetching announcement', () => {
      getDoc.mockImplementation(() => new Promise(() => {})); // Never resolves
      setupStaffAuthMock(false, true);
      renderWithRouter(<EditAnnouncementPage />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Form Rendering', () => {
    beforeEach(() => {
      setupStaffAuthMock(false, true);
    });

    test('renders edit form with existing data', async () => {
      renderWithRouter(<EditAnnouncementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Edit Announcement')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Announcement')).toBeInTheDocument();
        expect(screen.getByDisplayValue('This is a test announcement content.')).toBeInTheDocument();
      });
    });

    test('renders all form buttons', async () => {
      renderWithRouter(<EditAnnouncementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Delete Announcement')).toBeInTheDocument();
      });
    });

    test('has back button', async () => {
      renderWithRouter(<EditAnnouncementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Back to Announcements')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      setupStaffAuthMock(false, true);
    });

    test('shows error when title is cleared', async () => {
      renderWithRouter(<EditAnnouncementPage />);
      
      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Test Announcement');
        fireEvent.change(titleInput, { target: { value: '' } });
        
        const submitButton = screen.getByText('Save Changes');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Please enter a title')).toBeInTheDocument();
      });
    });

    test('shows error when announcement is cleared', async () => {
      renderWithRouter(<EditAnnouncementPage />);
      
      await waitFor(() => {
        const announcementInput = screen.getByDisplayValue('This is a test announcement content.');
        fireEvent.change(announcementInput, { target: { value: '' } });
        
        const submitButton = screen.getByText('Save Changes');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Please enter an announcement')).toBeInTheDocument();
      });
    });
  });

  describe('Update Functionality', () => {
    beforeEach(() => {
      setupStaffAuthMock(false, true);
    });

    test('successfully updates announcement', async () => {
      renderWithRouter(<EditAnnouncementPage />);
      
      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Test Announcement');
        fireEvent.change(titleInput, { target: { value: 'Updated Announcement' } });
        
        const submitButton = screen.getByText('Save Changes');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(updateDoc).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/announcements');
      });
    });

    test('shows loading state during update', async () => {
      updateDoc.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderWithRouter(<EditAnnouncementPage />);
      
      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Test Announcement');
        fireEvent.change(titleInput, { target: { value: 'Updated Announcement' } });
        
        const submitButton = screen.getByText('Save Changes');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });
    });

    test('handles update error', async () => {
      updateDoc.mockRejectedValue(new Error('Failed to update'));
      renderWithRouter(<EditAnnouncementPage />);
      
      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Test Announcement');
        fireEvent.change(titleInput, { target: { value: 'Updated Announcement' } });
        
        const submitButton = screen.getByText('Save Changes');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to update announcement. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Delete Functionality', () => {
    beforeEach(() => {
      setupStaffAuthMock(false, true);
    });

    test('shows delete confirmation dialog', async () => {
      renderWithRouter(<EditAnnouncementPage />);
      
      await waitFor(() => {
        const deleteButton = screen.getByText('Delete Announcement');
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Are you sure? This action cannot be undone.')).toBeInTheDocument();
        expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
      });
    });

    test('can cancel delete', async () => {
      renderWithRouter(<EditAnnouncementPage />);
      
      await waitFor(() => {
        const deleteButton = screen.getByText('Delete Announcement');
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        const cancelButtons = screen.getAllByText('Cancel');
        fireEvent.click(cancelButtons[cancelButtons.length - 1]); // Click the cancel in confirmation
      });

      await waitFor(() => {
        expect(screen.queryByText('Are you sure? This action cannot be undone.')).not.toBeInTheDocument();
        expect(deleteDoc).not.toHaveBeenCalled();
      });
    });

    test('successfully deletes announcement', async () => {
      renderWithRouter(<EditAnnouncementPage />);
      
      await waitFor(() => {
        const deleteButton = screen.getByText('Delete Announcement');
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        const confirmButton = screen.getByText('Yes, Delete');
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(deleteDoc).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/announcements');
      });
    });

    test('handles delete error', async () => {
      deleteDoc.mockRejectedValue(new Error('Failed to delete'));
      renderWithRouter(<EditAnnouncementPage />);
      
      await waitFor(() => {
        const deleteButton = screen.getByText('Delete Announcement');
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        const confirmButton = screen.getByText('Yes, Delete');
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to delete announcement. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      setupStaffAuthMock(false, true);
    });

    test('back button navigates to announcements page', async () => {
      renderWithRouter(<EditAnnouncementPage />);
      
      await waitFor(() => {
        const backButton = screen.getByText('Back to Announcements');
        fireEvent.click(backButton);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/announcements');
    });

    test('cancel button navigates to announcements page', async () => {
      renderWithRouter(<EditAnnouncementPage />);
      
      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/announcements');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      setupStaffAuthMock(false, true);
    });

    test('handles announcement not found', async () => {
      getDoc.mockResolvedValue({
        exists: () => false,
        data: () => null,
      });
      
      renderWithRouter(<EditAnnouncementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Announcement not found')).toBeInTheDocument();
      });
    });
  });
});
