import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { getIdToken } from 'firebase/auth';
import NotificationBell from '../../components/NotificationBell';
import { setupTestEnvironment, cleanupTestEnvironment, renderWithRouter } from '../../test-utils';
import { setupConsoleErrorSuppression, setupGlobalFetchMock } from '../../test-utils-shared';

// Mock Firebase auth
jest.mock('firebase/auth', () => ({
  getIdToken: jest.fn(),
}));

jest.mock('../../firebase/config', () => ({
  auth: {
    currentUser: null,
  },
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ children, to, onClick, className, ...props }) => (
    <a href={to} onClick={onClick} className={className} {...props}>
      {children}
    </a>
  ),
}));

setupConsoleErrorSuppression();
setupTestEnvironment();

describe('NotificationBell', () => {
  const mockNotifications = [
    {
      id: '1',
      title: 'New lost item matches your interests',
      message: 'Lost iPhone - Keyword: iPhone',
      itemId: 'item-1',
      itemData: {
        title: 'Lost iPhone',
        location: 'Library',
        imageUrl: 'https://example.com/image.jpg',
      },
      read: false,
      createdAt: '2024-01-15T10:00:00.000Z',
    },
    {
      id: '2',
      title: 'New found item matches your interests',
      message: 'Found Wallet - Category: Accessories',
      itemId: 'item-2',
      itemData: {
        title: 'Found Wallet',
        location: 'OGGB',
        imageUrl: 'https://example.com/wallet.jpg',
      },
      read: true,
      createdAt: '2024-01-14T10:00:00.000Z',
    },
  ];

  const mockUser = {
    uid: 'test-user-id',
  };

  const setupAuthMock = (user = mockUser) => {
    const { auth } = require('../../firebase/config');
    auth.currentUser = user;
    if (user) {
      getIdToken.mockResolvedValue('mock-token');
    }
  };

  const setupFetchMock = (notifications = mockNotifications) => {
    global.fetch = jest.fn((url) => {
      if (url.includes('/api/notifications')) {
        return Promise.resolve({
          ok: true,
          json: async () => notifications,
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  };

  const renderNotificationBell = () => renderWithRouter(<NotificationBell />);

  const getBellButton = () => screen.getAllByRole('button')[0]; // Get the first button (bell icon)

  const openDropdown = () => {
    const bellButton = getBellButton();
    fireEvent.click(bellButton);
  };

  const waitForNotificationsToLoad = async () => {
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5876/api/notifications',
        expect.objectContaining({
          headers: { Authorization: 'Bearer mock-token' },
        })
      );
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    cleanupTestEnvironment();
    setupAuthMock();
    setupFetchMock();
    // Mock console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('Rendering', () => {
    test('renders bell icon', () => {
      renderNotificationBell();
      expect(getBellButton()).toBeInTheDocument();
    });

    test('shows unread count badge when there are unread notifications', async () => {
      renderNotificationBell();
      await waitForNotificationsToLoad();
      
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    test('does not show badge when all notifications are read', async () => {
      setupFetchMock([mockNotifications[1]]);
      renderNotificationBell();
      await waitForNotificationsToLoad();
      
      await waitFor(() => {
        expect(screen.queryByText('1')).not.toBeInTheDocument();
      });
    });

    test('does not fetch notifications when user is not logged in', () => {
      setupAuthMock(null);
      renderNotificationBell();
      
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Dropdown Functionality', () => {
    test('opens dropdown when bell is clicked', async () => {
      renderNotificationBell();
      await waitForNotificationsToLoad();
      
      openDropdown();
      
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
    });

    test('closes dropdown when bell is clicked again', async () => {
      renderNotificationBell();
      await waitForNotificationsToLoad();
      
      openDropdown();
      
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
      
      const bellButton = getBellButton();
      fireEvent.click(bellButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
      });
    });

    test('displays all notifications in dropdown', async () => {
      renderNotificationBell();
      await waitForNotificationsToLoad();
      
      openDropdown();
      
      await waitFor(() => {
        expect(screen.getByText('Lost iPhone - Keyword: iPhone')).toBeInTheDocument();
        expect(screen.getByText('Found Wallet - Category: Accessories')).toBeInTheDocument();
      });
    });

    test('shows empty state when no notifications', async () => {
      setupFetchMock([]);
      renderNotificationBell();
      await waitForNotificationsToLoad();
      
      openDropdown();
      
      await waitFor(() => {
        expect(screen.getByText('No notifications')).toBeInTheDocument();
      });
    });

    test('highlights unread notifications', async () => {
      renderNotificationBell();
      await waitForNotificationsToLoad();
      
      openDropdown();
      
      await waitFor(() => {
        const unreadNotif = screen.getByText('Lost iPhone - Keyword: iPhone').closest('a');
        expect(unreadNotif).toHaveClass('bg-blue-50');
      });
    });
  });

  describe('Notification Display', () => {
    test('displays notification title and message', async () => {
      renderNotificationBell();
      await waitForNotificationsToLoad();
      
      openDropdown();
      
      await waitFor(() => {
        expect(screen.getByText('New lost item matches your interests')).toBeInTheDocument();
        expect(screen.getByText('Lost iPhone - Keyword: iPhone')).toBeInTheDocument();
      });
    });

    test('displays item image when available', async () => {
      renderNotificationBell();
      await waitForNotificationsToLoad();
      
      openDropdown();
      
      await waitFor(() => {
        const image = screen.getByAltText('Lost iPhone');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
      });
    });

    test('displays location with pin icon', async () => {
      renderNotificationBell();
      await waitForNotificationsToLoad();
      
      openDropdown();
      
      await waitFor(() => {
        expect(screen.getByText('Library')).toBeInTheDocument();
      });
    });
  });

  describe('Mark as Read', () => {
    test('marks notification as read when clicked', async () => {
      renderNotificationBell();
      await waitForNotificationsToLoad();
      
      openDropdown();
      
      await waitFor(() => {
        const notif = screen.getByText('Lost iPhone - Keyword: iPhone');
        fireEvent.click(notif);
      });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:5876/api/notifications/1/read',
          expect.objectContaining({
            method: 'PATCH',
            headers: { Authorization: 'Bearer mock-token' },
          })
        );
      });
    });

    test('does not mark already read notifications', async () => {
      renderNotificationBell();
      await waitForNotificationsToLoad();
      
      openDropdown();
      
      const fetchCallCount = global.fetch.mock.calls.length;
      
      await waitFor(() => {
        const notif = screen.getByText('Found Wallet - Category: Accessories');
        fireEvent.click(notif);
      });
      
      // Should not make additional PATCH call
      expect(global.fetch.mock.calls.length).toBe(fetchCallCount);
    });
  });

  describe('Dismiss Notifications', () => {
    test('dismisses notification when X button is clicked', async () => {
      renderNotificationBell();
      await waitForNotificationsToLoad();
      
      openDropdown();
      
      await waitFor(() => {
        const dismissButtons = screen.getAllByText('×');
        fireEvent.click(dismissButtons[0]);
      });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:5876/api/notifications/1',
          expect.objectContaining({
            method: 'DELETE',
            headers: { Authorization: 'Bearer mock-token' },
          })
        );
      });
    });

    test('prevents event propagation when dismissing', async () => {
      renderNotificationBell();
      await waitForNotificationsToLoad();
      
      openDropdown();
      
      const patchCallsBefore = global.fetch.mock.calls.filter(
        call => call[1]?.method === 'PATCH'
      ).length;
      
      await waitFor(() => {
        const dismissButtons = screen.getAllByText('×');
        fireEvent.click(dismissButtons[0]);
      });
      
      // Should not trigger mark as read
      const patchCallsAfter = global.fetch.mock.calls.filter(
        call => call[1]?.method === 'PATCH'
      ).length;
      
      expect(patchCallsAfter).toBe(patchCallsBefore);
    });
  });

  describe('Navigation', () => {
    test('has settings link in dropdown', async () => {
      renderNotificationBell();
      await waitForNotificationsToLoad();
      
      openDropdown();
      
      await waitFor(() => {
        const settingsLink = screen.getByText('Notification Settings');
        expect(settingsLink.closest('a')).toHaveAttribute('href', '/notifications/settings');
      });
    });

    test('closes dropdown when navigating to item', async () => {
      renderNotificationBell();
      await waitForNotificationsToLoad();
      
      openDropdown();
      
      await waitFor(() => {
        const notif = screen.getByText('Lost iPhone - Keyword: iPhone').closest('a');
        expect(notif).toHaveAttribute('href', '/items/item-1');
      });
    });

    test('closes dropdown when clicking settings link', async () => {
      renderNotificationBell();
      await waitForNotificationsToLoad();
      
      openDropdown();
      
      await waitFor(() => {
        const settingsLink = screen.getByText('Notification Settings');
        fireEvent.click(settingsLink);
      });
      
      await waitFor(() => {
        expect(screen.queryByText(/^Notifications$/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Auto-refresh', () => {
    test('sets up interval to fetch notifications', async () => {
      jest.useFakeTimers();
      renderNotificationBell();
      await waitForNotificationsToLoad();
      
      const initialCallCount = global.fetch.mock.calls.length;
      
      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);
      
      await waitFor(() => {
        expect(global.fetch.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
      
      jest.useRealTimers();
    });

    test('cleans up interval on unmount', () => {
      jest.useFakeTimers();
      const { unmount } = renderNotificationBell();
      
      unmount();
      
      const callCount = global.fetch.mock.calls.length;
      jest.advanceTimersByTime(30000);
      
      expect(global.fetch.mock.calls.length).toBe(callCount);
      
      jest.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    test('handles fetch error gracefully', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
      
      renderNotificationBell();
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching notifications:',
          expect.any(Error)
        );
      });
    });

    test('handles mark as read error gracefully', async () => {
      global.fetch = jest.fn((url) => {
        if (url.includes('/read')) {
          return Promise.reject(new Error('Failed'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockNotifications,
        });
      });
      
      renderNotificationBell();
      await waitForNotificationsToLoad();
      
      openDropdown();
      
      await waitFor(() => {
        const notif = screen.getByText('Lost iPhone - Keyword: iPhone');
        fireEvent.click(notif);
      });
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error marking notification as read:',
          expect.any(Error)
        );
      });
    });

    test('handles dismiss error gracefully', async () => {
      global.fetch = jest.fn((url, options) => {
        if (options?.method === 'DELETE') {
          return Promise.reject(new Error('Failed'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockNotifications,
        });
      });
      
      renderNotificationBell();
      await waitForNotificationsToLoad();
      
      openDropdown();
      
      await waitFor(() => {
        const dismissButtons = screen.getAllByText('×');
        fireEvent.click(dismissButtons[0]);
      });
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error dismissing notification:',
          expect.any(Error)
        );
      });
    });
  });

  describe('Accessibility', () => {
    test('bell button has proper role', () => {
      renderNotificationBell();
      expect(getBellButton()).toBeInTheDocument();
    });

    test('notifications are clickable', async () => {
      renderNotificationBell();
      await waitForNotificationsToLoad();
      
      openDropdown();
      
      await waitFor(() => {
        const notif = screen.getByText('Lost iPhone - Keyword: iPhone').closest('a');
        expect(notif).toHaveAttribute('href', '/items/item-1');
      });
    });

    test('dismiss buttons are accessible', async () => {
      renderNotificationBell();
      await waitForNotificationsToLoad();
      
      openDropdown();
      
      await waitFor(() => {
        const dismissButtons = screen.getAllByText('×');
        dismissButtons.forEach(button => {
          expect(button).toBeInTheDocument();
        });
      });
    });
  });
});