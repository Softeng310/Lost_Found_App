import React, { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { getAuth, signOut } from "firebase/auth"
import { LogOut } from "lucide-react"
import { getProfileItems } from "../lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { ProfileBadge } from '../components/ui/ProfileBadge'
import Badge from '../components/ui/Badge'

export default function ProfilePage() {
  // Get mock data for now - will be replaced with real user data
  const items = getProfileItems()
  const myName = "Guest User"
  
  // Filter items based on current user
  const myPosts = useMemo(() => items.filter((i) => i.reporter.name === myName), [items])
  const myClaims = useMemo(() => items.filter((i) => i.claims.some((c) => c.claimer === myName)), [items])

  // Helper function to get status badge variant and text
  const getStatusBadge = (status, kind, claims, isMyPost = false) => {
    if (isMyPost) {
      // For posts by the user
      switch (status) {
        case 'Open':
          return { variant: 'secondary', text: 'Open', color: 'bg-blue-100 text-blue-800' }
        case 'Unclaimed':
          return { variant: 'secondary', text: 'Unclaimed', color: 'bg-yellow-100 text-yellow-800' }
        case 'Resolved':
          return { variant: 'default', text: 'Resolved', color: 'bg-green-100 text-green-800' }
        case 'Claimed':
          const hasPendingClaims = claims.some(c => c.status === 'pending')
          return { 
            variant: 'secondary', 
            text: hasPendingClaims ? 'Pending Review' : 'Claimed',
            color: hasPendingClaims ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'
          }
        default:
          return { variant: 'outline', text: status, color: 'bg-gray-100 text-gray-800' }
      }
    } else {
      // For claims by the user
      const myClaim = claims.find(c => c.claimer === myName)
      if (myClaim) {
        switch (myClaim.status) {
          case 'pending':
            return { variant: 'secondary', text: 'Pending', color: 'bg-orange-100 text-orange-800' }
          case 'approved':
            return { variant: 'default', text: 'Approved', color: 'bg-green-100 text-green-800' }
          case 'rejected':
            return { variant: 'outline', text: 'Rejected', color: 'bg-red-100 text-red-800' }
          default:
            return { variant: 'outline', text: 'Unknown', color: 'bg-gray-100 text-gray-800' }
        }
      }
      return { variant: 'outline', text: 'No Claim', color: 'bg-gray-100 text-gray-800' }
    }
  }
  
  const navigate = useNavigate()
  const auth = getAuth()

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
                Mock user context. Integrate UPI-backed SSO for identity and trust badges (A2).
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
                    const badge = getStatusBadge(item.status, item.kind, item.claims, true)
                    const pendingClaims = item.claims.filter(c => c.status === 'pending').length
                    
                    return (
                      <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">{item.title}</span>
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${badge.color}`}>
                              {badge.text}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className={`px-2 py-1 rounded-full ${
                              item.kind === 'lost' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {item.kind === 'lost' ? 'Lost Item' : 'Found Item'}
                            </span>
                            {pendingClaims > 0 && (
                              <span className="text-orange-600 font-medium">
                                {pendingClaims} pending claim{pendingClaims !== 1 ? 's' : ''}
                              </span>
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
                    const badge = getStatusBadge(item.status, item.kind, item.claims, false)
                    const myClaim = item.claims.find(c => c.claimer === myName)
                    
                    return (
                      <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">{item.title}</span>
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${badge.color}`}>
                              {badge.text}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Posted by {item.reporter.name}</span>
                            {myClaim && (
                              <span>
                                Claimed {new Date(myClaim.date).toLocaleDateString()}
                              </span>
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
        </div>
      </div>
    </div>
  )
}
