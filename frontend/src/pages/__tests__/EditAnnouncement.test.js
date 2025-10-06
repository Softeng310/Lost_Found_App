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
      // When authLoading is true and we haven't fetched yet, we see "Loading..." (fetchLoading takes priority)
      assertLoadingState(screen, 'Loading...');
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
