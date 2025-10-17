import React, { useState, useEffect, memo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth"
import { LogOut, Trash2, Edit3, X } from "lucide-react"
import PropTypes from 'prop-types'
import { getUserPosts, getUserClaims, formatTimestamp, updateItemStatus, updateItem } from "../firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { ProfileBadge } from '../components/ui/ProfileBadge'

/** ---------- Small utilities (deduplicated helpers) ---------- **/
const coalesceDate = (item) =>
  item.date || item.createdAt || item.created_at || item.timestamp || item.dateCreated

const isResolvedStatus = (s) => (s || '').toLowerCase() === 'resolved'

const StatusPill = memo(({ color, text }) => (
  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${color}`}>
    {text}
  </span>
))

StatusPill.propTypes = {
  color: PropTypes.string,
  text: PropTypes.string
}

/** Keep original business logic: compute status badge by context (posts vs claims) */
const getStatusBadgeForPost = (item) => {
  const status = (item.status || 'open').toLowerCase()
  switch (status) {
    case 'found':
    case 'resolved':
      return { variant: 'default', text: 'Resolved', color: 'bg-green-100 text-green-800' }
    case 'claimed':
      return { variant: 'secondary', text: 'Claimed', color: 'bg-purple-100 text-purple-800' }
    case 'pending':
      return { variant: 'secondary', text: 'Pending', color: 'bg-orange-100 text-orange-800' }
    case 'lost':
    case 'open':
    case 'active':
    default:
      return { variant: 'secondary', text: 'Active', color: 'bg-blue-100 text-blue-800' }
  }
}

const getStatusBadgeForClaim = (item) => {
  const claimStatus = (item.claimData?.status || item.status || 'pending').toLowerCase()
  switch (claimStatus) {
    case 'pending':
      return { variant: 'secondary', text: 'Pending', color: 'bg-orange-100 text-orange-800' }
    case 'approved':
      return { variant: 'default', text: 'Approved', color: 'bg-green-100 text-green-800' }
    case 'rejected':
      return { variant: 'outline', text: 'Rejected', color: 'bg-red-100 text-red-800' }
    default:
      return { variant: 'secondary', text: 'Pending', color: 'bg-orange-100 text-orange-800' }
  }
}

const getStatusBadge = (item, isMyPost = false) => (isMyPost ? getStatusBadgeForPost(item) : getStatusBadgeForClaim(item))

/** Shared row component used by both Posts and Claims lists */
const ItemRow = memo(function ItemRow({
  item,
  isMyPost,
  onNavigate,
  onEdit,
  onClose,
}) {
  const badge = getStatusBadge(item, isMyPost)
  const resolved = isResolvedStatus(item.status)
  const kindLabel = item.status === 'lost' ? 'Lost Item' : 'Found Item'
  const kindClass = item.status === 'lost' ? 'text-red-700' : 'text-blue-700'
  const when = formatTimestamp(coalesceDate(item))

  const go = () => onNavigate(item.id)

  return (
    <div className="flex justify-between items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100 hover:shadow-sm transition-all duration-200">
      <button
        type="button"
        onClick={go}
        className="flex-1 text-left"
        aria-label={`View details for ${item.title || 'Untitled Item'}`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900">{item.title || 'Untitled Item'}</span>
          <StatusPill color={badge.color} text={badge.text} />
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className={kindClass}>{kindLabel}</span>
          <span>📅 {when}</span>
          {item.location && <span>📍 {item.location}</span>}
        </div>
      </button>

      {/* Edit/Close buttons only for user's posts and only when not resolved */}
      {isMyPost && !resolved && (
        <div className="ml-2 flex items-center">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(item) }}
            className="ml-2 p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Edit this post"
            aria-label="Edit post"
            type="button"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(item.id, item.title) }}
            className="ml-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Close this post"
            aria-label="Close post"
            type="button"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
})

ItemRow.propTypes = {
  item: PropTypes.object.isRequired,
  isMyPost: PropTypes.bool,
  onNavigate: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  onClose: PropTypes.func,
}

/** Shared card (title + empty text + list renderer) */
const ItemsCard = memo(function ItemsCard({
  title,
  emptyText,
  items,
  renderItem
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title} ({items.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">{emptyText}</p>
        ) : (
          items.map(renderItem)
        )}
      </CardContent>
    </Card>
  )
})

ItemsCard.propTypes = {
  title: PropTypes.string.isRequired,
  emptyText: PropTypes.string,
  items: PropTypes.array.isRequired,
  renderItem: PropTypes.func.isRequired
}

export default function ProfilePage() {
  const [myPosts, setMyPosts] = useState([])
  const [myClaims, setMyClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    kind: '', // 'lost' or 'found'
    imageUrl: '',
    date: '',
    time: ''
  })
  const [error, setError] = useState(null)

  const auth = getAuth()
  // Track auth user in state so changes trigger re-renders and effects
  const [currentUser, setCurrentUser] = useState(auth.currentUser)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => setCurrentUser(user),
      (err) => {
        console.error('Auth state listener error:', err)
        setError('Failed to verify authentication')
      }
    )
    return () => unsubscribe()
  }, [auth])
  const navigate = useNavigate()

  /** Load user's posts and claims */
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) { setLoading(false); return }

      try {
        setLoading(true)
        const [posts, claims] = await Promise.all([
          getUserPosts(currentUser.uid),
          getUserClaims(currentUser.uid)
        ])
        setMyPosts(posts)
        setMyClaims(claims)
      } catch (err) {
        console.error('Error fetching user data:', err)
        setError('Failed to load your data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchUserData()
  }, [currentUser])

  /** Close/resolve a post */
  const handleClosePost = useCallback(async (itemId, itemTitle) => {
    const confirmed = (typeof window !== 'undefined') ? window.confirm(`Are you sure you want to close "${itemTitle}"? This will mark it as resolved.`) : true
    if (!confirmed) return
    try {
      // Optimistic UI: remove from list immediately
      setMyPosts(prev => prev.filter(p => p.id !== itemId))
      await updateItemStatus(itemId, 'resolved')
    } catch (error) {
      console.error('Error closing post:', error)
      alert('Failed to close post. Please try again.')
      // Rollback by reloading fresh data
      try {
        if (currentUser) {
          const [posts, claims] = await Promise.all([
            getUserPosts(currentUser.uid),
            getUserClaims(currentUser.uid)
          ])
          setMyPosts(posts)
          setMyClaims(claims)
        }
      } catch (refreshError) {
        console.error('Error refreshing data:', refreshError)
      }
    }
  }, [currentUser])

  /** Open edit modal with prefilled values */
  const handleEditPost = useCallback((item) => {
    let dateValue = ''
    let timeValue = ''
    const raw = coalesceDate(item)
    if (raw) {
      const d = new Date(raw)
      if (!Number.isNaN(d.getTime())) {
        dateValue = d.toISOString().split('T')[0]
        timeValue = d.toTimeString().split(' ')[0].slice(0, 5)
      }
    }
    setEditingItem(item)
    setEditFormData({
      title: item.title || '',
      description: item.description || '',
      category: item.type || item.category || '',
      location: item.location || '',
      kind: item.status?.toLowerCase() || item.kind || 'lost',
      imageUrl: item.imageURL || item.imageUrl || item.image || '',
      date: dateValue,
      time: timeValue
    })
    setEditModalOpen(true)
  }, [])

  /** Close edit modal and reset form */
  const handleCloseEditModal = useCallback(() => {
    setEditModalOpen(false)
    setEditingItem(null)
    setEditFormData({
      title: '',
      description: '',
      category: '',
      location: '',
      kind: '',
      imageUrl: '',
      date: '',
      time: ''
    })
  }, [])

  /** Edit form change handler */
  const handleFormChange = useCallback((field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  /** Save edited post */
  const handleSaveEdit = useCallback(async () => {
    if (!editingItem || !editFormData.title.trim()) {
      alert('Please fill in at least the title field.')
      return
    }
    try {
      let combinedDateTime = null
      if (editFormData.date) {
        const s = editFormData.time ? `${editFormData.date}T${editFormData.time}:00` : `${editFormData.date}T00:00:00`
        combinedDateTime = new Date(s)
      }

      const updateData = {
        title: editFormData.title.trim(),
        description: editFormData.description.trim(),
        type: editFormData.category, // Firestore uses 'type' for category
        location: editFormData.location,
        status: editFormData.kind,   // Firestore uses 'status' for lost/found
        imageURL: editFormData.imageUrl.trim() // Firestore uses 'imageURL'
      }
  if (combinedDateTime && !Number.isNaN(combinedDateTime.getTime())) {
        updateData.date = combinedDateTime.toISOString()
      }

      await updateItem(editingItem.id, updateData)

      // Reload to ensure consistency
      if (currentUser) {
        const [posts, claims] = await Promise.all([
          getUserPosts(currentUser.uid),
          getUserClaims(currentUser.uid)
        ])
        setMyPosts(posts)
        setMyClaims(claims)
      }
      handleCloseEditModal()
      alert('Post updated successfully!')
    } catch (error) {
      console.error('Error updating post:', error)
      alert('Failed to update post. Please try again.')
    }
  }, [editingItem, editFormData, currentUser, handleCloseEditModal])

  /** Sign out and redirect */
  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth)
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [auth, navigate])

  /** Shared navigation to detail page */
  const goItemDetail = useCallback((id) => navigate(`/items/${id}`), [navigate])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile & History</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {currentUser?.displayName || currentUser?.email || 'User'}!
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          {/* Trust & Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Trust & Verification
                <ProfileBadge variant="outline">Unverified</ProfileBadge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600">
              Connect university SSO to verify identity and earn trust badges for faster claims and higher credibility.
            </CardContent>
          </Card>

          {/* States */}
          {loading && (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading your data...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="grid md:grid-cols-2 gap-6">
              <ItemsCard
                title="My Posts"
                emptyText="No posts yet. Start by reporting a lost or found item!"
                items={myPosts}
                renderItem={(item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    isMyPost
                    onNavigate={goItemDetail}
                    onEdit={handleEditPost}
                    onClose={handleClosePost}
                  />
                )}
              />
              <ItemsCard
                title="My Claims"
                emptyText="No claims yet. Browse the feed to claim items you've lost!"
                items={myClaims}
                renderItem={(item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    isMyPost={false}
                    onNavigate={goItemDetail}
                  />
                )}
              />
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Edit Post</h2>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    id="edit-title"
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter title..."
                  />
                </div>

                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    id="edit-description"
                    value={editFormData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter description..."
                  />
                </div>

                <div>
                  <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    id="edit-category"
                    value={editFormData.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    <option value="electronics">Electronics</option>
                    <option value="stationery">Stationery</option>
                    <option value="clothing">Clothing</option>
                    <option value="documents">Documents</option>
                    <option value="wallets">Wallets</option>
                    <option value="keys/cards">Keys/Cards</option>
                    <option value="accessories">Accessories</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select
                    id="edit-location"
                    value={editFormData.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select location</option>
                    <option value="OGGB">OGGB</option>
                    <option value="Engineering Building">Engineering Building</option>
                    <option value="Arts and Education Building">Arts and Education Building</option>
                    <option value="Kate Edgar">Kate Edgar</option>
                    <option value="Law Building">Law Building</option>
                    <option value="General Library">General Library</option>
                    <option value="Biology Building">Biology Building</option>
                    <option value="Science Centre">Science Centre</option>
                    <option value="Clock Tower">Clock Tower</option>
                    <option value="Old Government House">Old Government House</option>
                    <option value="Hiwa Recreation Centre">Hiwa Recreation Centre</option>
                    <option value="Bioengineering Building">Bioengineering Building</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-kind" className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    id="edit-kind"
                    value={editFormData.kind}
                    onChange={(e) => handleFormChange('kind', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select type</option>
                    <option value="lost">Lost Item</option>
                    <option value="found">Found Item</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-imageUrl" className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    id="edit-imageUrl"
                    type="url"
                    value={editFormData.imageUrl}
                    onChange={(e) => handleFormChange('imageUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter image URL..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="edit-date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      id="edit-date"
                      type="date"
                      value={editFormData.date}
                      onChange={(e) => handleFormChange('date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-time" className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input
                      id="edit-time"
                      type="time"
                      value={editFormData.time}
                      onChange={(e) => handleFormChange('time', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Save Changes
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
