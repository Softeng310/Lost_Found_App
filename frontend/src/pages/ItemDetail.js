import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import { ArrowLeft, ShieldCheck, MapPin } from '../components/ui/icons';
import { db } from '../firebase/config';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { 
  doc, 
  onSnapshot, 
  getDoc, 
  addDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { normalizeFirestoreItem, buttonStyles, cardStyles } from '../lib/utils';
import MapDisplay from '../components/map/MapDisplay';
import MapModal from '../components/map/MapModal';

/* Small subcomponent to render the action buttons; extracted to reduce parent complexity */
export const ActionButtons = ({ currentUser, userInfo, item, onStart, startingConversation, onLogin, onClaim, onUnclaim }) => {
  const isOwner = !!(currentUser && userInfo?.id && currentUser.uid === userInfo.id);

  // Only owner can claim/unclaim
  if (currentUser && isOwner) {
    if (item.claimed) {
      return (
        <button
          type="button"
          onClick={onUnclaim}
          className={`${buttonStyles.base} ${buttonStyles.secondary}`}
        >
          Set as Unclaimed
        </button>
      );
    } else {
      return (
        <button
          type="button"
          onClick={onClaim}
          className={`${buttonStyles.base} ${buttonStyles.primary}`}
        >
          Set as Claimed
        </button>
      );
    }
  }

  // Non-owner actions
  if (currentUser && !isOwner) {
    return (
      <button
        type="button"
        onClick={onStart}
        disabled={startingConversation}
        className={`${buttonStyles.base} ${buttonStyles.secondary}`}
      >
        {startingConversation ? 'Starting...' : 'Message'}
      </button>
    );
  }

  // Not logged in
  return (
    <>
      <button type="button" onClick={onLogin} className={`${buttonStyles.base} ${buttonStyles.primary}`}>
        Login to Message
      </button>
    </>
  );
}

ActionButtons.propTypes = {
  currentUser: PropTypes.object,
  userInfo: PropTypes.object,
  item: PropTypes.object.isRequired,
  onStart: PropTypes.func,
  startingConversation: PropTypes.bool,
  onClaim: PropTypes.func,
  onUnclaim: PropTypes.func,
  onLogin: PropTypes.func
}

const ItemDetailPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [startingConversation, setStartingConversation] = useState(false);
  // Following project policy: runtime transitions to 'found' are disabled; no updating state needed
  const auth = getAuth();
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const itemId = String(params?.id || '');
    if (!itemId) return;

    const ref = doc(db, 'items', itemId);
    const unsubscribe = onSnapshot(ref, async (snapshot) => {
      const data = snapshot.data();
      if (!data) {
        setItem(null);
        return;
      }

  const normalizedItem = normalizeFirestoreItem(data, snapshot.id);
  setItem(normalizedItem);

      // Fetch user information from the postedBy reference
      if (data.postedBy?.path) {
        try {
          const userDoc = await getDoc(doc(db, data.postedBy.path));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserInfo({
              id: userDoc.id,
              name: userData.displayName || userData.name || userData.email || 'Unknown User',
              trust: userData.trust || false
            });
          } else {
            setUserInfo({ name: 'Unknown User', trust: false });
          }
        } catch (userError) {
          // Log via console.error is acceptable for unexpected errors but avoid noisy logs in prod
          console.error('Error fetching user info:', userError);
          setUserInfo({ name: 'Unknown User', trust: false });
        }
      } else {
        setUserInfo({ name: 'Unknown User', trust: false });
      }
    });

    return () => unsubscribe();
  }, [params]);

  // Start a conversation about this item
  const startConversation = useCallback(async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!item || !userInfo?.id || startingConversation) return;
    if (currentUser.uid === userInfo.id) return;
    setStartingConversation(true);
    try {
      const conversationsRef = collection(db, 'conversations');
      const existingConversationQuery = query(
        conversationsRef,
        where('itemId', '==', item.id),
        where('participants', 'array-contains', currentUser.uid)
      );
      const existingConversations = await getDocs(existingConversationQuery);
      if (!existingConversations.empty) {
        navigate(`/messages?item=${item.id}`);
        return;
      }
      await addDoc(conversationsRef, {
        itemId: item.id,
        participants: [currentUser.uid, userInfo.id],
        createdAt: Timestamp.now(),
        lastMessage: '',
        lastMessageTime: Timestamp.now(),
        lastMessageSender: null
      });
      navigate(`/messages?item=${item.id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setStartingConversation(false);
    }
  }, [currentUser, item, userInfo, startingConversation, navigate]);

  // Claim/unclaim handlers
  const handleClaim = useCallback(async () => {
    if (!item?.id) return;
    try {
      const token = await getAuth().currentUser.getIdToken();
      const res = await fetch(`http://localhost:5876/api/items/${item.id}/claim`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert('Failed to claim item');
      }
    } catch (err) {
      alert('Error claiming item');
    }
  }, [item]);

  const handleUnclaim = useCallback(async () => {
    if (!item?.id) return;
    try {
      const token = await getAuth().currentUser.getIdToken();
      const res = await fetch(`http://localhost:5876/api/items/${item.id}/unclaim`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert('Failed to unclaim item');
      }
    } catch (err) {
      alert('Error unclaiming item');
    }
  }, [item]);

  /* Small subcomponent to render the action buttons; extracted to keep main component simple */
  // ActionButtons was moved to module scope (see below) to reduce component complexity

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-10">
        <button 
          onClick={() => navigate(-1)} 
          className={`mb-4 gap-2 ${buttonStyles.base} ${buttonStyles.ghost}`}
        >
          <ArrowLeft />
          Back
        </button>
        <p className="text-muted-foreground">Item not found.</p>
      </div>
    );
  }

  // Check if item has coordinates
  const hasCoordinates = !!(item?.coordinates && typeof item.coordinates.latitude === 'number' && typeof item.coordinates.longitude === 'number');

  return (
    <div className="container mx-auto px-4 py-6 grid lg:grid-cols-[1fr_360px] gap-6">
      <section className="space-y-4">
        <Link 
          to="/feed"
          className={`gap-2 ${buttonStyles.base} ${buttonStyles.ghost}`}
        >
          <ArrowLeft />
          Back to feed
        </Link>

        <div className="grid sm:grid-cols-[320px_1fr] gap-6">
          <img
            src={item.imageURL || item.imageUrl || "/placeholder.svg"}
            width={320}
            height={240}
            alt={item.title}
            className="rounded-lg border aspect-video object-cover"
          />
          <div>
            {/* Status and Category Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                item.kind === 'lost' 
                  ? 'bg-red-100 text-red-700 border-red-200' 
                  : item.kind === 'found'
                  ? 'bg-green-100 text-green-700 border-green-200'
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              }`}>
                {item.kind?.charAt(0).toUpperCase() + item.kind?.slice(1) || 'Unknown'}
              </span>
              {item.category && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                  {item.category}
                </span>
              )}
              {item.claimed && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                  Claimed
                </span>
              )}
              {userInfo?.trust && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                  ✓ Verified
                </span>
              )}
            </div>
            <h1 className="text-2xl font-semibold">{item.title}</h1>
            <p className="text-muted-foreground mt-2">{item.description}</p>
            <div className="mt-4 text-sm">
              <p className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">Location:</span>
                {` ${item.location}`}
              </p>
              <p>
                <span className="font-medium">Posted:</span>
                {` ${new Date(item.date).toLocaleString()}`}
              </p>
              <p>
                <span className="font-medium">Reporter:</span>
                {` ${userInfo?.name || 'Unknown User'}`}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <ActionButtons
                currentUser={currentUser}
                userInfo={userInfo}
                item={item}
                onStart={startConversation}
                onLogin={() => navigate('/login')}
                startingConversation={startingConversation}
                onClaim={handleClaim}
                onUnclaim={handleUnclaim}
              />
            </div>
          </div>
        </div>

        {/* Map Section - Full width below the main content */}
        <div className={cardStyles.base}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" />
                Item Location
              </h3>
              {hasCoordinates && (
                <button
                  onClick={() => setIsMapModalOpen(true)}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium underline"
                >
                  View Full Map
                </button>
              )}
            </div>
            
            {hasCoordinates ? (
              <>
                <p className="text-sm text-gray-600 mb-3">
                  {item.location} • Lat: {Number(item.coordinates.latitude).toFixed(4)}, Lng: {Number(item.coordinates.longitude).toFixed(4)}
                </p>
                <button 
                  className="w-full cursor-pointer border-0 p-0 bg-transparent" 
                  onClick={() => setIsMapModalOpen(true)}
                  type="button"
                  aria-label="Open full screen map"
                >
                  <MapDisplay
                    latitude={item.coordinates.latitude}
                    longitude={item.coordinates.longitude}
                    locationName={item.location}
                    height="250px"
                    zoom={15}
                  />
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Click map to view in full screen
                </p>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <MapPin className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-gray-600 mb-2">Location coordinates not available</p>
                <p className="text-sm text-gray-500">
                  This item was reported before map functionality was added.
                </p>
                <p className="text-sm text-gray-500">
                  Location: <strong>{item.location}</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <div className={cardStyles.base}>
          <div className="p-4">
            <h3 className="font-medium mb-2">Safety & Verification</h3>
            <p className="text-sm text-muted-foreground">
              To verify ownership, be ready to share specific details such as color, engravings, or unique marks.
            </p>
          </div>
        </div>
        <div className={cardStyles.base}>
          <div className="p-4">
            <h3 className="font-medium mb-2">Tips for Pickup</h3>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Meet in a public campus area.</li>
              <li>Bring an ID if requested by the finder.</li>
              <li>Confirm item details before handover.</li>
            </ul>
          </div>
        </div>
      </aside>

      {/* Map Modal for full-screen view */}
      {hasCoordinates && (
        <MapModal
          isOpen={isMapModalOpen}
          onClose={() => setIsMapModalOpen(false)}
          latitude={item.coordinates.latitude}
          longitude={item.coordinates.longitude}
          locationName={item.location}
          title={`${item.title} - Location`}
        />
      )}
    </div>
  );
};

export default ItemDetailPage;
