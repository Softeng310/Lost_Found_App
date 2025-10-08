import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getAuth, signOut } from "firebase/auth"
import { LogOut, Trash2, Edit3, X } from "lucide-react"
import { getUserPosts, getUserClaims, formatTimestamp, updateItemStatus, updateItem } from "../firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { ProfileBadge } from '../components/ui/ProfileBadge'

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
    kind: '', // lost or found
    imageUrl: '',
    date: '',
    time: ''
  })
  const [error, setError] = useState(null)
  const auth = getAuth()
  const currentUser = auth.currentUser
  
  // Fetch user's posts and claims from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        console.log('Fetching data for user:', currentUser.uid)
        
        const [posts, claims] = await Promise.all([
          getUserPosts(currentUser.uid),
          getUserClaims(currentUser.uid)
        ])
        
        console.log('Fetched posts:', posts)
        console.log('Fetched claims:', claims)
        
        // Debug timestamp fields
        if (posts.length > 0) {
          console.log('First post timestamp fields:', {
            createdAt: posts[0].createdAt,
            created_at: posts[0].created_at,
            timestamp: posts[0].timestamp,
            dateCreated: posts[0].dateCreated,
            updatedAt: posts[0].updatedAt
          });
        }
        
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

  // Helper function to get status badge variant and text
  const getStatusBadge = (item, isMyPost = false) => {
    if (isMyPost) {
      // For posts by the user
      const status = item.status || 'open'
      switch (status.toLowerCase()) {
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
    } else {
      // For claims by the user - show the claim status (pending/approved/rejected)
      const claimStatus = item.claimData?.status || item.status || 'pending'
      switch (claimStatus.toLowerCase()) {
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
  }
  
  const navigate = useNavigate()

  // Handle closing/resolving a post
  const handleClosePost = async (itemId, itemTitle) => {
    if (window.confirm(`Are you sure you want to close "${itemTitle}"? This will mark it as resolved.`)) {
      try {
        // Immediately remove from UI for better UX
        setMyPosts(prevPosts => prevPosts.filter(post => post.id !== itemId))
        
        // Update in Firebase
        await updateItemStatus(itemId, 'resolved')
        
        // Show success message (optional)
        console.log('Post closed successfully')
      } catch (error) {
        console.error('Error closing post:', error)
        alert('Failed to close post. Please try again.')
        
        // If Firebase update failed, refresh the data to restore the item
        try {
          const [posts, claims] = await Promise.all([
            getUserPosts(currentUser.uid),
            getUserClaims(currentUser.uid)
          ])
          setMyPosts(posts)
          setMyClaims(claims)
        } catch (refreshError) {
          console.error('Error refreshing data:', refreshError)
        }
      }
    }
  }

  // Handle editing a post
  const handleEditPost = (item) => {
    // Parse existing date/time if available
    let dateValue = ''
    let timeValue = ''
    
    // Firebase uses 'date' field for the actual lost/found date/time
    if (item.date || item.createdAt || item.created_at || item.timestamp || item.dateCreated) {
      try {
        const existingDate = new Date(item.date || item.createdAt || item.created_at || item.timestamp || item.dateCreated)
        if (!isNaN(existingDate.getTime())) {
          dateValue = existingDate.toISOString().split('T')[0] // YYYY-MM-DD format
          timeValue = existingDate.toTimeString().split(' ')[0].slice(0, 5) // HH:MM format
        }
      } catch (error) {
        console.log('Error parsing existing date:', error)
      }
    }
    
    setEditingItem(item)
    setEditFormData({
      title: item.title || '',
      description: item.description || '',
      category: item.type || item.category || '', // Firebase uses 'type' field
      location: item.location || '',
      kind: item.status?.toLowerCase() || item.kind || 'lost', // Firebase uses 'status' for lost/found
      imageUrl: item.imageURL || item.imageUrl || item.image || '', // Firebase uses 'imageURL'
      date: dateValue,
      time: timeValue
    })
    setEditModalOpen(true)
  }

  // Handle closing edit modal
  const handleCloseEditModal = () => {
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
  }

  // Handle form input changes
  const handleFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle saving edited post
  const handleSaveEdit = async () => {
    if (!editingItem || !editFormData.title.trim()) {
      alert('Please fill in at least the title field.')
      return
    }

    try {
      // Combine date and time into a single timestamp
      let combinedDateTime = null
      if (editFormData.date) {
        const dateTimeString = editFormData.time 
          ? `${editFormData.date}T${editFormData.time}:00`
          : `${editFormData.date}T00:00:00`
        combinedDateTime = new Date(dateTimeString)
      }

      // Prepare update data (using Firebase field names)
      const updateData = {
        title: editFormData.title.trim(),
        description: editFormData.description.trim(),
        type: editFormData.category, // Firebase uses 'type' for category
        location: editFormData.location,
        status: editFormData.kind, // Firebase uses 'status' for lost/found
        imageURL: editFormData.imageUrl.trim() // Firebase uses 'imageURL'
      }

      // Add date if provided (only update the date field, not createdAt)
      if (combinedDateTime && !isNaN(combinedDateTime.getTime())) {
        updateData.date = combinedDateTime.toISOString()
        // Note: Do NOT update createdAt - it should remain the original creation time
      }

      // Update the item in Firebase
      await updateItem(editingItem.id, updateData)
      
      // Refresh data from Firebase to ensure consistency
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
  }

  // Handle user logout
  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Page header with logout button */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile & History</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {currentUser?.displayName || currentUser?.email || 'User'}!
              </p>
            </div>
            {/* Logout button - red to indicate destructive action */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          {/* Trust verification status */}
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

          {/* Loading and Error States */}
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
              {/* User activity grid - posts and claims */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Items this user has posted */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      My Posts ({myPosts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {myPosts.length === 0 ? (
                      <p className="text-sm text-gray-500">No posts yet. Start by reporting a lost or found item!</p>
                    ) : (
                      myPosts.map((item) => {
                        const badge = getStatusBadge(item, true)
                        const isResolved = item.status?.toLowerCase() === 'resolved'
                        
                        return (
                          <div 
                            key={item.id} 
                            className="flex justify-between items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100 hover:shadow-sm transition-all duration-200"
                          >
                            <div 
                              className="flex-1 cursor-pointer"
                              onClick={() => navigate(`/items/${item.id}`)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  navigate(`/items/${item.id}`)
                                }
                              }}
                              tabIndex={0}
                              role="button"
                              aria-label={`View details for ${item.title || 'Untitled Item'}`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-900">{item.title || 'Untitled Item'}</span>
                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${badge.color}`}>
                                  {badge.text}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className={
                                  item.status === 'lost' ? 'text-red-700' : 'text-blue-700'
                                }>
                                  {item.status === 'lost' ? 'Lost Item' : 'Found Item'}
                                </span>
                                <span>📅 {formatTimestamp(item.date || item.createdAt || item.created_at || item.timestamp || item.dateCreated)}</span>
                                {item.location && (
                                  <span>📍 {item.location}</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Edit button - only show for non-resolved items */}
                            {!isResolved && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation() // Prevent navigation when clicking edit button
                                  handleEditPost(item)
                                }}
                                className="ml-2 p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit this post"
                                aria-label="Edit post"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            
                            {/* Close button - only show for non-resolved items */}
                            {!isResolved && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation() // Prevent navigation when clicking close button
                                  handleClosePost(item.id, item.title)
                                }}
                                className="ml-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Close this post"
                                aria-label="Close post"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )
                      })
                    )}
                  </CardContent>
                </Card>

                {/* Items this user has claimed */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      My Claims ({myClaims.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {myClaims.length === 0 ? (
                      <p className="text-sm text-gray-500">No claims yet. Browse the feed to claim items you've lost!</p>
                    ) : (
                      myClaims.map((item) => {
                        // For claims, show the claim status (pending/approved/rejected)
                        const badge = getStatusBadge(item, false)
                        
                        return (
                          <div 
                            key={item.id} 
                            className="flex justify-between items-start p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 hover:shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={() => navigate(`/items/${item.id}`)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                navigate(`/items/${item.id}`)
                              }
                            }}
                            tabIndex={0}
                            role="button"
                            aria-label={`View details for ${item.title || 'Untitled Item'}`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-900">{item.title || 'Untitled Item'}</span>
                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${badge.color}`}>
                                  {badge.text}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className={
                                  item.status === 'lost' ? 'text-red-700' : 'text-blue-700'
                                }>
                                  {item.status === 'lost' ? 'Lost Item' : 'Found Item'}
                                </span>
                                <span>📅 {formatTimestamp(item.date || item.createdAt || item.created_at || item.timestamp || item.dateCreated)}</span>
                                {item.location && (
                                  <span>📍 {item.location}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </CardContent>
                </Card>
              </div>
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
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter title..."
                  />
                </div>
                
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Enter description..."
                  />
                </div>
                
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
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
                
                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <select
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
                
                {/* Lost/Found Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={editFormData.kind}
                    onChange={(e) => handleFormChange('kind', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select type</option>
                    <option value="lost">Lost Item</option>
                    <option value="found">Found Item</option>
                  </select>
                </div>
                
                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={editFormData.imageUrl}
                    onChange={(e) => handleFormChange('imageUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter image URL..."
                  />
                </div>
                
                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={editFormData.date}
                      onChange={(e) => handleFormChange('date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={editFormData.time}
                      onChange={(e) => handleFormChange('time', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
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
