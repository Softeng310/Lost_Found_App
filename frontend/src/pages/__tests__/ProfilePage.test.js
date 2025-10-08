// frontend/src/pages/__tests__/ProfilePage.test.js
import React from "react"
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import ProfilePage from "../ProfilePage"
import { MemoryRouter } from "react-router-dom"

/* -------------------- Global mocks & helpers -------------------- */
const mockNavigate = jest.fn()
const mockSignOut = jest.fn()

// window side-effects
const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {})
const confirmSpy = jest.spyOn(window, "confirm").mockImplementation(() => true)

afterAll(() => {
  alertSpy.mockRestore()
  confirmSpy.mockRestore()
})

/* -------------------- Module mocks (INLINE factories only) -------------------- */
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  MemoryRouter: ({ children }) => <div data-testid="memory-router">{children}</div>,
}))

jest.mock("firebase/auth", () => ({
  getAuth: () => ({
    currentUser: { uid: "u1", displayName: "Hans", email: "hans@example.com" },
  }),
  signOut: (...args) => mockSignOut(...args),
}))

// Icons -> simple span
jest.mock("lucide-react", () => ({
  LogOut: () => <span>icon-logout</span>,
  Trash2: () => <span>icon-trash</span>,
  Edit3: () => <span>icon-edit</span>,
  X: () => <span>icon-x</span>,
}))

// UI Card components -> semantic wrappers
jest.mock("../../components/ui/card", () => ({
  Card: ({ children }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }) => <h2>{children}</h2>,
}))

// ProfileBadge -> plain span
jest.mock("../../components/ui/ProfileBadge", () => ({
  ProfileBadge: ({ children }) => <span data-testid="profile-badge">{children}</span>,
}))

// Firestore functions (we will reconfigure in each test)
const fs = {
  getUserPosts: jest.fn(),
  getUserClaims: jest.fn(),
  formatTimestamp: jest.fn((iso) => "2025-10-01 10:00"),
  updateItemStatus: jest.fn(),
  updateItem: jest.fn(),
}
jest.mock("../../firebase/firestore", () => fs)

/* -------------------- Test data -------------------- */
const postsFixture = [
  {
    id: "p1",
    title: "Lost Wallet",
    status: "lost",
    location: "OGGB",
    date: "2025-09-29T09:00:00.000Z",
  },
  {
    id: "p2",
    title: "Found Hoodie",
    status: "open", // unresolved -> should show Edit/Close
    location: "Engineering Building",
    date: "2025-09-28T09:00:00.000Z",
  },
]
const claimsFixture = [
  {
    id: "c1",
    title: "My Phone Claim",
    status: "approved",
    claimData: { status: "approved" },
    date: "2025-09-27T09:00:00.000Z",
  },
]

/* -------------------- Render helper -------------------- */
const renderPage = () =>
  render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>
  )

beforeEach(() => {
  jest.clearAllMocks()
  fs.formatTimestamp.mockImplementation(() => "2025-10-01 10:00")
})

/* -------------------- Tests -------------------- */
test("renders header and welcome with current user name", async () => {
  fs.getUserPosts.mockResolvedValueOnce([])
  fs.getUserClaims.mockResolvedValueOnce([])

  renderPage()

  expect(screen.getByText("Profile & History")).toBeInTheDocument()
  // loading state
  expect(screen.getByText("Loading your data...")).toBeInTheDocument()

  // final welcome
  expect(await screen.findByText(/Welcome back, Hans!/)).toBeInTheDocument()
  expect(screen.getByRole("button", { name: /Logout/i })).toBeInTheDocument()
})

test("shows empty states for posts and claims", async () => {
  fs.getUserPosts.mockResolvedValueOnce([])
  fs.getUserClaims.mockResolvedValueOnce([])

  renderPage()

  // Wait until loading done
  await screen.findByText(/Welcome back/)

  expect(screen.getByText(/My Posts \(0\)/)).toBeInTheDocument()
  expect(screen.getByText("No posts yet. Start by reporting a lost or found item!")).toBeInTheDocument()

  expect(screen.getByText(/My Claims \(0\)/)).toBeInTheDocument()
  expect(screen.getByText("No claims yet. Browse the feed to claim items you've lost!")).toBeInTheDocument()
})

test("loads and renders posts and claims with counts", async () => {
  fs.getUserPosts.mockResolvedValueOnce(postsFixture)
  fs.getUserClaims.mockResolvedValueOnce(claimsFixture)

  renderPage()
  await screen.findByText(/Welcome back/)

  expect(screen.getByText(/My Posts \(2\)/)).toBeInTheDocument()
  expect(screen.getByText(/My Claims \(1\)/)).toBeInTheDocument()

  // Items visible
  expect(screen.getByText("Lost Wallet")).toBeInTheDocument()
  expect(screen.getByText("Found Hoodie")).toBeInTheDocument()
  expect(screen.getByText("My Phone Claim")).toBeInTheDocument()

  // A date from formatTimestamp
  expect(screen.getAllByText("📅 2025-10-01 10:00").length).toBeGreaterThan(0)
})

test("navigates to item detail when an item row is clicked", async () => {
  fs.getUserPosts.mockResolvedValueOnce(postsFixture)
  fs.getUserClaims.mockResolvedValueOnce([])

  renderPage()
  await screen.findByText(/Welcome back/)

  // ItemRow is a div[role="button"] with aria-label containing the title
  const lostWalletRow = screen.getByRole("button", { name: /View details for Lost Wallet/i })
  fireEvent.click(lostWalletRow)

  expect(mockNavigate).toHaveBeenCalledWith("/items/p1")
})

test("shows Edit and Close controls for unresolved own posts only, opens modal and saves", async () => {
  fs.getUserPosts
    .mockResolvedValueOnce(postsFixture) // initial load
    .mockResolvedValueOnce(postsFixture) // reload after save
  fs.getUserClaims
    .mockResolvedValueOnce([])           // initial load
    .mockResolvedValueOnce([])           // reload after save

  renderPage()
  await screen.findByText(/Welcome back/)

  // "Found Hoodie" is unresolved -> its row should have Edit/Close buttons
  const hoodieRow = screen.getByRole("button", { name: /View details for Found Hoodie/i })
  // The buttons are separate elements; use getByLabelText
  const editBtn = screen.getAllByLabelText("Edit post")[0]
  const closeBtn = screen.getAllByLabelText("Close post")[0]
  expect(editBtn).toBeInTheDocument()
  expect(closeBtn).toBeInTheDocument()

  // Open modal
  fireEvent.click(editBtn)
  const modalTitle = await screen.findByText("Edit Post")
  expect(modalTitle).toBeInTheDocument()

  // Prefilled title
  const titleInput = screen.getByLabelText(/Title \*/i)
  expect(titleInput).toHaveValue("Found Hoodie")

  // Change, then save
  fireEvent.change(titleInput, { target: { value: "Found Hoodie (edited)" } })
  const saveBtn = screen.getByRole("button", { name: /Save Changes/i })
  fireEvent.click(saveBtn)

  await waitFor(() => expect(fs.updateItem).toHaveBeenCalledTimes(1))
  expect(fs.updateItem).toHaveBeenCalledWith("p2", expect.objectContaining({
    title: "Found Hoodie (edited)",
    status: "lost" // default selected kind if unchanged; component maps back to 'status'
  }))

  // Success alert after close
  await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Post updated successfully!"))
})

test("closes a post after confirmation and optimistically removes it", async () => {
  // Start with one post that can be closed
  const closable = [
    { id: "p3", title: "Closable Post", status: "open", location: "OGGB", date: "2025-09-29T09:00:00.000Z" },
  ]
  fs.getUserPosts.mockResolvedValueOnce(closable)
  fs.getUserClaims.mockResolvedValueOnce([])

  renderPage()
  await screen.findByText(/Welcome back/)

  const row = screen.getByRole("button", { name: /View details for Closable Post/ })
  const closeBtn = screen.getByLabelText("Close post")
  fireEvent.click(closeBtn)

  // confirm() mocked to true
  await waitFor(() => expect(fs.updateItemStatus).toHaveBeenCalledWith("p3", "resolved"))

  // Optimistic removal: title disappears
  await waitFor(() => expect(screen.queryByText("Closable Post")).not.toBeInTheDocument())
})

test("logout triggers signOut and navigates home", async () => {
  fs.getUserPosts.mockResolvedValueOnce([])
  fs.getUserClaims.mockResolvedValueOnce([])

  renderPage()
  await screen.findByText(/Welcome back/)

  fireEvent.click(screen.getByRole("button", { name: /Logout/i }))
  await waitFor(() => expect(mockSignOut).toHaveBeenCalled())
  expect(mockNavigate).toHaveBeenCalledWith("/")
})

test("shows error state when data fetch fails", async () => {
  fs.getUserPosts.mockRejectedValueOnce(new Error("boom"))
  fs.getUserClaims.mockResolvedValueOnce([])

  renderPage()

  const err = await screen.findByText("Failed to load your data. Please try again.")
  expect(err).toBeInTheDocument()
})
