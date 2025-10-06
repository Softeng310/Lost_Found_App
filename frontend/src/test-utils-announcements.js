/**
 * Shared test utilities for announcement-related tests
 * Reduces code duplication across test files
 */

/**
 * Setup mock for useStaffAuth hook
 */
export const setupStaffAuthMock = (useStaffAuth, loading = false, isStaff = true, user = null) => {
  const mockUser = user || {
    uid: isStaff ? 'staff-uid' : 'student-uid',
    email: isStaff ? 'staff@example.com' : 'student@example.com',
  };

  useStaffAuth.mockReturnValue({
    currentUser: isStaff || user ? mockUser : null,
    userRole: isStaff ? 'staff' : 'student',
    loading,
    isStaff,
  });
};

/**
 * Setup Firebase Firestore mocks for announcements
 */
export const setupAnnouncementFirestoreMocks = (
  mocks = {},
  announcements = [],
  announcement = null
) => {
  const { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc } = mocks;
  
  if (collection) {
    collection.mockReturnValue('mock-collection');
  }
  if (doc) {
    doc.mockReturnValue('mock-doc-ref');
  }
  
  if (getDocs) {
    getDocs.mockResolvedValue({
      docs: announcements.map(item => ({
        id: item.id,
        data: () => item,
      })),
    });
  }
  
  if (getDoc && announcement) {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => announcement,
    });
  } else if (getDoc) {
    getDoc.mockResolvedValue({
      exists: () => false,
      data: () => null,
    });
  }
  
  if (addDoc) {
    addDoc.mockResolvedValue({ id: 'new-announcement-id' });
  }
  
  if (updateDoc) {
    updateDoc.mockResolvedValue({});
  }
  
  if (deleteDoc) {
    deleteDoc.mockResolvedValue({});
  }
};

/**
 * Common test data
 */
export const createMockAnnouncement = (overrides = {}) => ({
  id: 'test-announcement-id',
  title: 'Test Announcement',
  announcement: 'This is a test announcement content.',
  datePosted: '2024-01-01T10:00:00.000Z',
  ...overrides,
});

export const createMockAnnouncements = () => [
  createMockAnnouncement({
    id: '1',
    title: 'iPad Pro Found',
    announcement: 'An iPad Pro was found in the Business School lecture theatre OGGB3. Please contact lost and found with a description to claim.',
  }),
  createMockAnnouncement({
    id: '2',
    title: 'Umbrella Reported',
    announcement: 'Umbrella near elevator on Engineering lvl 4 has been reported.',
    datePosted: '2024-01-02T10:00:00.000Z',
  }),
];

/**
 * Common form interaction helpers
 */
export const fillAnnouncementForm = async (screen, fireEvent, { title, announcement }) => {
  const titleInput = screen.getByLabelText('Title');
  const announcementInput = screen.getByLabelText('Announcement');
  
  if (title !== undefined) {
    fireEvent.change(titleInput, { target: { value: title } });
  }
  
  if (announcement !== undefined) {
    fireEvent.change(announcementInput, { target: { value: announcement } });
  }
};

export const submitForm = (screen, fireEvent, buttonText = 'Create Announcement') => {
  const submitButton = screen.getByText(buttonText);
  fireEvent.click(submitButton);
};

export const clickButton = (screen, fireEvent, buttonText) => {
  const button = screen.getByText(buttonText);
  fireEvent.click(button);
};

/**
 * Common assertions
 */
export const assertFormFields = async (screen, waitFor) => {
  await waitFor(() => {
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Announcement')).toBeInTheDocument();
  });
};

export const assertButtons = async (screen, waitFor, buttons = []) => {
  await waitFor(() => {
    buttons.forEach(buttonText => {
      expect(screen.getByText(buttonText)).toBeInTheDocument();
    });
  });
};

export const assertCharacterCounters = async (screen, waitFor) => {
  await waitFor(() => {
    expect(screen.getByText(/\/100 characters/)).toBeInTheDocument();
    expect(screen.getByText(/\/1000 characters/)).toBeInTheDocument();
  });
};

export const assertErrorMessage = async (screen, waitFor, message) => {
  await waitFor(() => {
    expect(screen.getByText(message)).toBeInTheDocument();
  });
};

export const assertLoadingState = (screen, loadingText) => {
  expect(screen.getByText(loadingText)).toBeInTheDocument();
};

export const assertNavigationCalled = (mockNavigate, path) => {
  expect(mockNavigate).toHaveBeenCalledWith(path);
};
