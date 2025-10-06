import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import AddAnnouncementPage from '../AddAnnouncement';
import { setupTestEnvironment, cleanupTestEnvironment, renderWithRouter } from '../../test-utils';
import { setupConsoleErrorSuppression } from '../../test-utils-shared';
import {
  setupStaffAuthMock,
  setupAnnouncementFirestoreMocks,
  fillAnnouncementForm,
  submitForm,
  clickButton,
  assertFormFields,
  assertButtons,
  assertCharacterCounters,
  assertErrorMessage,
  assertLoadingState,
  assertNavigationCalled,
} from '../../test-utils-announcements';

// Mock Firebase modules
jest.mock('firebase/firestore');
jest.mock('../../firebase/config', () => ({ db: {} }));
jest.mock('../../hooks/useStaffAuth', () => ({ useStaffAuth: jest.fn() }));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

setupConsoleErrorSuppression();
setupTestEnvironment();

describe('AddAnnouncementPage', () => {
  const mockNavigate = jest.fn();
  const { useStaffAuth } = require('../../hooks/useStaffAuth');

  beforeEach(() => {
    jest.clearAllMocks();
    cleanupTestEnvironment();
    useNavigate.mockReturnValue(mockNavigate);
    setupAnnouncementFirestoreMocks({ collection, addDoc });
  });

  describe('Access Control', () => {
    test('shows loading state while checking permissions', () => {
      setupStaffAuthMock(useStaffAuth, true, false);
      renderWithRouter(<AddAnnouncementPage />);
      assertLoadingState(screen, 'Checking permissions...');
    });

    test('renders form for staff users', async () => {
      setupStaffAuthMock(useStaffAuth, false, true);
      renderWithRouter(<AddAnnouncementPage />);
      await waitFor(() => {
        expect(screen.getByText('Add New Announcement')).toBeInTheDocument();
      });
    });
  });

  describe('Form Rendering', () => {
    beforeEach(() => setupStaffAuthMock(useStaffAuth, false, true));

    test('renders all form fields', async () => {
      renderWithRouter(<AddAnnouncementPage />);
      await assertFormFields(screen, waitFor);
      await assertButtons(screen, waitFor, ['Create Announcement', 'Cancel']);
    });

    test('has back button', async () => {
      renderWithRouter(<AddAnnouncementPage />);
      await assertButtons(screen, waitFor, ['Back to Announcements']);
    });

    test('shows character counters', async () => {
      renderWithRouter(<AddAnnouncementPage />);
      await assertCharacterCounters(screen, waitFor);
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => setupStaffAuthMock(useStaffAuth, false, true));

    test('shows error when title is empty', async () => {
      renderWithRouter(<AddAnnouncementPage />);
      await waitFor(() => submitForm(screen, fireEvent));
      await assertErrorMessage(screen, waitFor, 'Please enter a title');
    });

    test('shows error when announcement is empty', async () => {
      renderWithRouter(<AddAnnouncementPage />);
      await waitFor(() => fillAnnouncementForm(screen, fireEvent, { title: 'Test' }));
      submitForm(screen, fireEvent);
      await assertErrorMessage(screen, waitFor, 'Please enter an announcement');
    });

    test('updates character counter when typing', async () => {
      renderWithRouter(<AddAnnouncementPage />);
      await waitFor(() => fillAnnouncementForm(screen, fireEvent, { title: 'Test' }));
      await waitFor(() => {
        expect(screen.getByText('4/100 characters')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => setupStaffAuthMock(useStaffAuth, false, true));

    test('successfully creates announcement', async () => {
      renderWithRouter(<AddAnnouncementPage />);
      await waitFor(() => {
        fillAnnouncementForm(screen, fireEvent, {
          title: 'New Announcement',
          announcement: 'This is a test announcement with enough characters.',
        });
        submitForm(screen, fireEvent);
      });
      await waitFor(() => {
        expect(addDoc).toHaveBeenCalled();
        assertNavigationCalled(mockNavigate, '/announcements');
      });
    });

    test('shows loading state during submission', async () => {
      addDoc.mockImplementation(() => new Promise(() => {}));
      renderWithRouter(<AddAnnouncementPage />);
      await waitFor(() => {
        fillAnnouncementForm(screen, fireEvent, {
          title: 'New',
          announcement: 'Test announcement.',
        });
        submitForm(screen, fireEvent);
      });
      await waitFor(() => assertLoadingState(screen, 'Creating...'));
    });

    test('handles submission error', async () => {
      addDoc.mockRejectedValue(new Error('Failed'));
      renderWithRouter(<AddAnnouncementPage />);
      await waitFor(() => {
        fillAnnouncementForm(screen, fireEvent, {
          title: 'New',
          announcement: 'Test.',
        });
        submitForm(screen, fireEvent);
      });
      await assertErrorMessage(screen, waitFor, 'Failed to create announcement. Please try again.');
    });
  });

  describe('Navigation', () => {
    beforeEach(() => setupStaffAuthMock(useStaffAuth, false, true));

    test('back button navigates to announcements page', async () => {
      renderWithRouter(<AddAnnouncementPage />);
      await waitFor(() => clickButton(screen, fireEvent, 'Back to Announcements'));
      assertNavigationCalled(mockNavigate, '/announcements');
    });

    test('cancel button navigates to announcements page', async () => {
      renderWithRouter(<AddAnnouncementPage />);
      await waitFor(() => clickButton(screen, fireEvent, 'Cancel'));
      assertNavigationCalled(mockNavigate, '/announcements');
    });
  });
});
