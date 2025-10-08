import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getAuth, signOut } from "firebase/auth"
import { LogOut } from "lucide-react"
import { getUserPosts, getUserClaims, formatTimestamp } from "../firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { ProfileBadge } from '../components/ui/ProfileBadge'

export default function ProfilePage() {
  const [myPosts, setMyPosts] = useState([])
  const [myClaims, setMyClaims] = useState([])
  const [loading, setLoading] = useState(true)
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
                        
                        return (
                          <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                               onClick={() => navigate(`/item/${item.id}`)}>
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
                                <span>{formatTimestamp(item.createdAt)}</span>
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
                          <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                               onClick={() => navigate(`/item/${item.id}`)}>
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
                                <span>{formatTimestamp(item.createdAt)}</span>
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
    </div>
  )
}
