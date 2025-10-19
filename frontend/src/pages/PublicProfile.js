import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { ArrowLeft } from 'lucide-react'
import ItemCard from '../components/ItemCard'
import { normalizeFirestoreItem } from '../lib/utils'

const PublicProfile = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [userPosts, setUserPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch user data
  useEffect(() => {
    if (!userId) {
      setError('No user ID provided')
      setLoading(false)
      return
    }

    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, 'users', userId)
        const userDocSnap = await getDoc(userDocRef)
        
        if (!userDocSnap.exists()) {
          setError('User not found')
          setLoading(false)
          return
        }
        
        const data = userDocSnap.data()
        setUserData(data)
      } catch (err) {
        console.error('Error fetching user data:', err)
        setError('Failed to load user profile')
      }
    }

    fetchUserData()
  }, [userId])

  // Fetch user posts with real-time listener (exactly like Feed page)
  useEffect(() => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const itemsRef = collection(db, 'items')
      const userDocRef = doc(db, 'users', userId)
      const itemsQuery = query(
        itemsRef,
        where('postedBy', '==', userDocRef),
        orderBy('date', 'desc')
      )

      const unsubscribe = onSnapshot(
        itemsQuery,
        (snapshot) => {
          const fetchedItems = snapshot.docs.map((doc) => 
            normalizeFirestoreItem(doc.data() || {}, doc.id)
          )
          setUserPosts(fetchedItems)
          setLoading(false)
        },
        (err) => {
          console.error('Error fetching user posts:', err)
          setError('Failed to load posts')
          setLoading(false)
        }
      )

      return () => unsubscribe()
    } catch (err) {
      console.error('Error setting up posts listener:', err)
      setError('Failed to connect to database')
      setLoading(false)
    }
  }, [userId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="text-emerald-600 hover:text-emerald-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Profile Header */}
          <div className="flex items-center gap-6">
            {/* Profile Picture */}
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-600 bg-gray-200">
              {userData?.profilePic ? (
                <img
                  src={userData.profilePic}
                  alt={`${userData.name}'s profile`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-2xl font-bold">
                  {(userData?.name || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* User Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{userData?.name || 'User'}</h1>
              <p className="text-gray-600 text-left pt-2">
                {userPosts.length} {userPosts.length === 1 ? 'post' : 'posts'}
              </p>
            </div>
          </div>

          {/* User's Posts */}
          <Card>
            <CardHeader>
              <CardTitle>Posts by {userData?.name || 'this user'}</CardTitle>
            </CardHeader>
            <CardContent>
              {userPosts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No posts yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userPosts.map((post) => (
                    <ItemCard key={post.id} item={post} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default PublicProfile