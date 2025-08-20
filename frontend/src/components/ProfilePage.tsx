import React, { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { getAuth, signOut } from "firebase/auth"
import { LogOut } from "lucide-react"
import { getItemsClient } from "../lib/profile-mock-data"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { ProfileBadge } from './ui/ProfileBadge'

export default function ProfilePage() {
  const items = getItemsClient()
  const myName = "Guest User"
  const myPosts = useMemo(() => items.filter((i) => i.reporter.name === myName), [items])
  const myClaims = useMemo(() => items.filter((i) => i.claims.some((c) => c.claimer === myName)), [items])
  
  const navigate = useNavigate()
  const auth = getAuth()

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
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile & History</h1>
              <p className="text-gray-600 mt-2">
                Mock user context. Integrate UPI-backed SSO for identity and trust badges (A2).
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

          {/* Trust & Verification Card */}
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

          {/* Posts and Claims Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* My Posts Card */}
            <Card>
              <CardHeader>
                <CardTitle>My Posts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {myPosts.length === 0 ? (
                  <p className="text-sm text-gray-500">No posts yet.</p>
                ) : (
                  myPosts.map((i) => (
                    <div key={i.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-900">{i.title}</span>
                      <span className="text-green-600 font-medium">Open</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* My Claims Card */}
            <Card>
              <CardHeader>
                <CardTitle>My Claims</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {myClaims.length === 0 ? (
                  <p className="text-sm text-gray-500">No claims yet.</p>
                ) : (
                  myClaims.map((i) => (
                    <div key={i.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-900">{i.title}</span>
                      <span className="text-gray-500">{i.status}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
