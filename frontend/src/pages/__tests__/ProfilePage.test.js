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

// --- mock firebase/auth ---
const mockSignOut = jest.fn().mockResolvedValue()
const mockAuthObj = { currentUser: { uid: 'uid-123', displayName: 'Mock User', email: 'mock@example.com' } }

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => mockAuthObj),
  signOut: mockSignOut,
}))

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
const mockFormatTimestamp = jest.fn((iso) => '2025-10-01 10:20')

jest.mock('../../firebase/firestore', () => ({
  getUserPosts: (...args) => mockGetUserPosts(...args),
  getUserClaims: (...args) => mockGetUserClaims(...args),
  updateItemStatus: (...args) => mockUpdateItemStatus(...args),
  updateItem: (...args) => mockUpdateItem(...args),
  formatTimestamp: (...args) => mockFormatTimestamp(...args),
}))

// --- stub UI components so we don't depend on shadcn/tailwind rendering ---
jest.mock('../../components/ui/card', () => ({
  Card: ({ children }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }) => <div>{children}</div>,
  CardTitle: ({ children }) => <h2>{children}</h2>,
  CardContent: ({ children }) => <div>{children}</div>,
}))

jest.mock('../../components/ui/ProfileBadge', () => ({
  ProfileBadge: ({ children }) => <span data-testid="profile-badge">{children}</span>,
}))

// --- SUT ---
import ProfilePage from '../ProfilePage'

describe('ProfilePage (aligned tests)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Ensure we always have a current user for these tests
    mockAuthObj.currentUser = { uid: 'uid-123', displayName: 'Mock User', email: 'mock@example.com' }
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

    // Wait for data
    await waitFor(() => {
      expect(mockGetUserPosts).toHaveBeenCalledTimes(1)
      expect(mockGetUserClaims).toHaveBeenCalledTimes(1)
    })

    // Card titles with counts
    expect(screen.getByRole('heading', { name: /My Posts \(2\)/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /My Claims \(1\)/i })).toBeInTheDocument()

    // Some item titles present
    expect(screen.getByText(/Lost iPad/i)).toBeInTheDocument()
    expect(screen.getByText(/Found Card/i)).toBeInTheDocument()
  })

  test('logout button calls signOut and navigates home', async () => {
    render(<ProfilePage />)

    const btn = screen.getByRole('button', { name: /logout/i })
    fireEvent.click(btn)

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  test('edit button shows Edit Modal for non-resolved post and can be closed', async () => {
    render(<ProfilePage />)
    await screen.findByText(/Lost iPad/i)

    // Find the "Edit post" button (aria-label set in component)
    const editButtons = screen.getAllByRole('button', { name: /Edit post/i })
    expect(editButtons.length).toBeGreaterThan(0)

    fireEvent.click(editButtons[0])

    // Modal title appears
    const modalTitle = await screen.findByRole('heading', { name: /Edit Post/i })
    expect(modalTitle).toBeInTheDocument()

    // Close via "Cancel"
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
    // No currentUser
    mockAuthObj.currentUser = null
    render(<ProfilePage />)

    // Should render page and generic welcome
    expect(await screen.findByRole('heading', { name: /Profile & History/i })).toBeInTheDocument()
    expect(screen.getByText(/Welcome back, User!/i)).toBeInTheDocument()
  })
})
