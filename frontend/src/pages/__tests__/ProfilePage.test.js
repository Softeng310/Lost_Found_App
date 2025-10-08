/**
 * ProfilePage.test.js — slimmed & aligned with current component logic
 * - Mocks getAuth().currentUser (no onAuthStateChanged expectations)
 * - Mocks firestore calls to return deterministic data
 * - Stubs UI components (Card, ProfileBadge) for RTL
 * - Verifies header, welcome text, lists, counts, and logout flow (signOut + navigate)
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

// --- mock react-router-dom (useNavigate) ---
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

/**
 * --- mock firebase/auth ---
 * Note: jest.mock is hoisted, so create mocks inside the factory and
 * expose the mock auth object via __mockAuthObj for runtime access.
 */
jest.mock('firebase/auth', () => {
  const authObj = {
    currentUser: { uid: 'uid-123', displayName: 'Mock User', email: 'mock@example.com' },
  }
  const getAuth = jest.fn(() => authObj)
  const signOut = jest.fn().mockResolvedValue()

  return {
    getAuth,
    signOut,
    __mockAuthObj: authObj, // allows tests to modify currentUser dynamically
  }
})

// --- mock firestore used by ProfilePage ---
const mockGetUserPosts = jest.fn(async () => ([
  { id: 'p1', title: 'Lost iPad', status: 'lost', location: 'OGGB', date: '2025-10-01T10:20:00Z' },
  { id: 'p2', title: 'Found Card', status: 'found', location: 'Engineering Building', date: '2025-10-02T11:00:00Z' },
]))
const mockGetUserClaims = jest.fn(async () => ([
  { id: 'c1', title: 'My Library Card', status: 'pending', claimData: { status: 'pending' }, date: '2025-10-03T09:00:00Z' },
]))
const mockUpdateItemStatus = jest.fn(async () => {})
const mockUpdateItem = jest.fn(async () => {})
const mockFormatTimestamp = jest.fn(() => '2025-10-01 10:20')

jest.mock('../../firebase/firestore', () => ({
  getUserPosts: (...args) => mockGetUserPosts(...args),
  getUserClaims: (...args) => mockGetUserClaims(...args),
  updateItemStatus: (...args) => mockUpdateItemStatus(...args),
  updateItem: (...args) => mockUpdateItem(...args),
  formatTimestamp: (...args) => mockFormatTimestamp(...args),
}))

/**
 * --- stub UI components (inline factories required by jest-hoist) ---
 * The component imports '../components/ui/...'; this test lives in src/pages/__tests__.
 * Mock both import paths to avoid path resolution mismatches.
 */
jest.mock('../components/ui/card', () => ({
  Card: ({ children }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }) => <div>{children}</div>,
  CardTitle: ({ children }) => <h2>{children}</h2>,
  CardContent: ({ children }) => <div>{children}</div>,
}))
jest.mock('../components/ui/ProfileBadge', () => ({
  ProfileBadge: ({ children }) => <span data-testid="profile-badge">{children}</span>,
}))
jest.mock('../../components/ui/card', () => ({
  Card: ({ children }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }) => <div>{children}</div>,
  CardTitle: ({ children }) => <h2>{children}</h2>,
  CardContent: ({ children }) => <div>{children}</div>,
}))
jest.mock('../../components/ui/ProfileBadge', () => ({
  ProfileBadge: ({ children }) => <span data-testid="profile-badge">{children}</span>,
}))

// Optional: stub lucide-react icons with an inline factory as well
jest.mock('lucide-react', () => new Proxy({}, {
  get: () => (props) => <svg role="img" aria-hidden="true" {...props} />
}))

// --- SUT ---
import ProfilePage from '../ProfilePage'

describe('ProfilePage (aligned tests)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset the mock auth user before each test
    const { __mockAuthObj } = require('firebase/auth')
    __mockAuthObj.currentUser = { uid: 'uid-123', displayName: 'Mock User', email: 'mock@example.com' }
  })

  test('renders header and welcome text with current user', async () => {
    render(<ProfilePage />)

    // Header
    expect(await screen.findByRole('heading', { name: /Profile & History/i })).toBeInTheDocument()

    // Welcome
    expect(screen.getByText(/Welcome back, Mock User!/i)).toBeInTheDocument()
  })

  test('loads and displays My Posts and My Claims with counts', async () => {
    render(<ProfilePage />)

    // Wait for mock data to be fetched
    await waitFor(() => {
      expect(mockGetUserPosts).toHaveBeenCalledTimes(1)
      expect(mockGetUserClaims).toHaveBeenCalledTimes(1)
    })

    // Verify section titles and item counts
    expect(screen.getByRole('heading', { name: /My Posts \(2\)/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /My Claims \(1\)/i })).toBeInTheDocument()

    // Verify sample item titles
    expect(screen.getByText(/Lost iPad/i)).toBeInTheDocument()
    expect(screen.getByText(/Found Card/i)).toBeInTheDocument()
  })

  test('logout button calls signOut and navigates home', async () => {
    const { signOut } = require('firebase/auth')
    render(<ProfilePage />)

    const btn = screen.getByRole('button', { name: /logout/i })
    fireEvent.click(btn)

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledTimes(1)
    })
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  test('edit button shows Edit Modal for non-resolved post and can be closed', async () => {
    render(<ProfilePage />)
    await screen.findByText(/Lost iPad/i)

    // Click the first edit button
    const editButtons = screen.getAllByRole('button', { name: /Edit post/i })
    expect(editButtons.length).toBeGreaterThan(0)
    fireEvent.click(editButtons[0])

    // Modal should open
    const modalTitle = await screen.findByRole('heading', { name: /Edit Post/i })
    expect(modalTitle).toBeInTheDocument()

    // Close the modal via Cancel button
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i })
    fireEvent.click(cancelBtn)

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Edit Post/i })).not.toBeInTheDocument()
    })
  })

  test('shows Trust & Verification section', async () => {
    render(<ProfilePage />)
    expect(await screen.findByTestId('profile-badge')).toHaveTextContent(/Unverified/i)
  })

  test('handles missing user gracefully (shows "User")', async () => {
    const { __mockAuthObj } = require('firebase/auth')
    __mockAuthObj.currentUser = null

    render(<ProfilePage />)

    // Should display the generic user message
    expect(await screen.findByRole('heading', { name: /Profile & History/i })).toBeInTheDocument()
    expect(screen.getByText(/Welcome back, User!/i)).toBeInTheDocument()
  })
})
