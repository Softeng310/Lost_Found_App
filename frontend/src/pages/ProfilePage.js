import React, { useState, useEffect, memo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth"
import { LogOut, Trash2, Edit3, X } from "lucide-react"
import PropTypes from 'prop-types'
import { getUserPosts, formatTimestamp, updateItemStatus, updateItem, getUserProfile, updateUserUpi, generateAndSaveVerificationCode } from "../firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { ProfileBadge } from '../components/ui/ProfileBadge'

/** ---------- Small utilities (deduplicated helpers) ---------- **/
const coalesceDate = (item) =>
  item.date || item.createdAt || item.created_at || item.timestamp || item.dateCreated

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
  // Check if item is claimed (new system)
  if (item.claimed === true) {
    return { variant: 'default', text: 'Claimed', color: 'bg-green-100 text-green-800' }
  }
  
  // Otherwise it's unclaimed/active
  return { variant: 'secondary', text: 'Unclaimed', color: 'bg-blue-100 text-blue-800' }
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
  onDelete,
}) {
  const badge = getStatusBadge(item, isMyPost)
  const kindLabel = (item.status === 'lost' || item.kind === 'lost') ? 'Lost Item' : 'Found Item'
  const kindClass = (item.status === 'lost' || item.kind === 'lost') ? 'text-red-700' : 'text-blue-700'
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

      {/* Edit/Delete buttons only for user's posts */}
      {isMyPost && (
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
            onClick={(e) => { e.stopPropagation(); onDelete(item.id, item.title) }}
            className="ml-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete this post"
            aria-label="Delete post"
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
  onDelete: PropTypes.func,
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
  const [loading, setLoading] = useState(true)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',   // only for campus locations 
    kind: '', // 'lost' or 'found'
    imageUrl: '',
    date: '',
    time: ''
  })
  const [error, setError] = useState(null)
  const [profile, setProfile] = useState(null)
  const [upiInput, setUpiInput] = useState("")
  const [codeInput, setCodeInput] = useState("")
  const [sendingCode, setSendingCode] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState("")

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

  /** Load user's posts */
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) { setLoading(false); return }

      try {
        setLoading(true)
        const posts = await getUserPosts(currentUser.uid)
        const prof = await getUserProfile(currentUser.uid)
        setMyPosts(posts)
        setProfile(prof)
        setUpiInput(prof?.upi || "")
      } catch (err) {
        console.error('Error fetching user data:', err)
        setError('Failed to load your data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchUserData()
  }, [currentUser])

  /** Delete a post */
  const handleDeletePost = useCallback(async (itemId, itemTitle) => {
    const confirmed = (typeof window !== 'undefined') ? window.confirm(`Are you sure you want to delete "${itemTitle}"? This action cannot be undone.`) : true
    if (!confirmed) return
    try {
      // Optimistic UI: remove from list immediately
      setMyPosts(prev => prev.filter(p => p.id !== itemId))
      
      // Note: You may need to add a DELETE endpoint in your backend
      // For now, we'll just mark it as deleted by updating status
      await updateItemStatus(itemId, 'deleted')
      
      alert('Post deleted successfully!')
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post. Please try again.')
      // Rollback by reloading fresh data
      try {
        if (currentUser) {
          const posts = await getUserPosts(currentUser.uid)
          setMyPosts(posts)
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
        const posts = await getUserPosts(currentUser.uid)
        setMyPosts(posts)
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
                {profile?.isVerified ? (
                  <ProfileBadge variant="success">Verified</ProfileBadge>
                ) : (
                  <ProfileBadge variant="outline">Unverified</ProfileBadge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-3">
              <p>Verify your identity with your UPI to earn a trust badge. We'll send a 4-digit code to your university email.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">UPI</label>
                  <input
                    type="text"
                    value={upiInput}
                    onChange={(e) => setUpiInput(e.target.value)}
                    placeholder="e.g. hlee345"
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    disabled={!upiInput || sendingCode}
                    onClick={async () => {
                      if (!currentUser) return
                      setVerificationMessage("")
                      setSendingCode(true)
                      try {
                        // Step 1: Save UPI to Firestore first
                        await updateUserUpi(currentUser.uid, upiInput.trim())
                        console.log('UPI saved to Firestore:', upiInput.trim())
                        
                        // Step 2: Generate and save random 4-digit code to Firestore
                        const generatedCode = await generateAndSaveVerificationCode(currentUser.uid)
                        console.log('Random 4-digit code generated and saved:', generatedCode)
                        
                        // Step 3: Request verification code from backend
                        const token = await currentUser.getIdToken()
                        const resp = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5876'}/api/verification/request-code`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({ upi: upiInput.trim() })
                        })
                        const data = await resp.json()
                        if (!resp.ok) throw new Error(data.message || 'Failed to send code')
                        setVerificationMessage(`Code sent to ${data.target}`)
                      } catch (e) {
                        console.error('Error sending code:', e)
                        setVerificationMessage(e.message)
                      } finally {
                        setSendingCode(false)
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {sendingCode ? 'Sending…' : 'Send Code'}
                  </button>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Verification Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value)}
                      placeholder="4-digit code"
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      disabled={!codeInput || verifying}
                      onClick={async () => {
                        if (!currentUser) return
                        setVerificationMessage("")
                        setVerifying(true)
                        try {
                          const token = await currentUser.getIdToken()
                          const resp = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5876'}/api/verification/verify-code`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ code: codeInput.trim() })
                          })
                          const data = await resp.json()
                          if (!resp.ok) throw new Error(data.message || 'Verification failed')
                          setVerificationMessage('Verified successfully')
                          // Refresh profile
                          const prof = await getUserProfile(currentUser.uid)
                          setProfile(prof)
                        } catch (e) {
                          setVerificationMessage(e.message)
                        } finally {
                          setVerifying(false)
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {verifying ? 'Verifying…' : 'Verify'}
                    </button>
                  </div>
                </div>
              </div>
              {verificationMessage && (
                <p className="text-xs text-gray-600">{verificationMessage}</p>
              )}
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
            <>
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
                    onDelete={handleDeletePost}
                  />
                )}
              />
            </>
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
