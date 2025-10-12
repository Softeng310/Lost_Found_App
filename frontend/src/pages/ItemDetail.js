import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import { ArrowLeft, ShieldCheck, MapPin } from '../components/ui/icons';
import { db } from '../firebase/config';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { normalizeFirestoreItem, buttonStyles, cardStyles } from '../lib/utils';
import MapDisplay from '../components/map/MapDisplay';
import MapModal from '../components/map/MapModal';

const ItemDetailPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

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
      console.log('Raw Firestore data:', data);
      console.log('Normalized item:', normalizedItem);
      setItem(normalizedItem);

      // Fetch user information from the postedBy reference
      if (data.postedBy && data.postedBy.path) {
        try {
          const userDoc = await getDoc(doc(db, data.postedBy.path));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserInfo({
              name: userData.displayName || userData.name || userData.email || 'Unknown User',
              trust: userData.trust || false
            });
          } else {
            setUserInfo({ name: 'Unknown User', trust: false });
          }
        } catch (userError) {
          console.error('Error fetching user info:', userError);
          setUserInfo({ name: 'Unknown User', trust: false });
        }
      } else {
        setUserInfo({ name: 'Unknown User', trust: false });
      }
    });

    return () => unsubscribe();
  }, [params]);

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
  const hasCoordinates = item?.coordinates?.latitude && item?.coordinates?.longitude;

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
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="secondary" className="capitalize">
                {item.kind || item.status}
              </Badge>
              <Badge className="bg-emerald-600 hover:bg-emerald-700">
                {item.category || item.type}
              </Badge>
              {userInfo?.trust && (
                <Badge variant="outline" className="gap-1">
                  <ShieldCheck />
                  Trusted
                </Badge>
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
              <button className={`${buttonStyles.base} ${buttonStyles.primary}`}>
                Claim Item
              </button>
              <button className={`${buttonStyles.base} ${buttonStyles.secondary}`}>
                Message
              </button>
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
                  {item.location} • Lat: {item.coordinates.latitude.toFixed(4)}, Lng: {item.coordinates.longitude.toFixed(4)}
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
