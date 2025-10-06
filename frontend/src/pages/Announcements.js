import React, { useEffect, useState } from "react";
import { Bell, Plus, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { db } from "../firebase/config";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Button } from "../components/ui/button";

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const auth = getAuth();

  // Check if user is logged in and get their role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Fetch user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "announcements"));
        let data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort by datePosted descending (newest first)
        data = data.sort((a, b) => {
          const dateA = new Date(a.datePosted).getTime();
          const dateB = new Date(b.datePosted).getTime();
          return dateB - dateA;
        });
        setAnnouncements(data);
      } catch (err) {
        console.error("Error fetching announcements:", err);
        setError("Failed to load announcements. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  let content;
  if (loading) {
    content = <div className="text-center text-gray-500">Loading...</div>;
  } else if (error) {
    content = <div className="text-center text-red-500">{error}</div>;
  } else if (announcements.length === 0) {
    content = (
      <div className="text-center text-gray-500">No announcements found.</div>
    );
  } else {
    content = (
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 p-4">
        {announcements.map((a) => (
          <div
            key={a.id}
            className="flex flex-col h-full bg-white border border-emerald-200 rounded-2xl shadow-md p-6 transition-transform hover:scale-[1.02] hover:shadow-lg"
          >
            <div className="flex items-center gap-2 mb-3">
              <Bell className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-emerald-700 mt-4">
                {a.title}
              </h2>
            </div>
            <p className="text-gray-700 text-base mb-4 flex-1 whitespace-pre-line">
              {a.announcement}
            </p>
            <div className="flex justify-between items-center">
              {a.datePosted && (
                <span className="inline-block bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full font-medium">
                  {new Date(a.datePosted).toLocaleString()}
                </span>
              )}
              {currentUser && userRole === "staff" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(a.id)}
                  className="ml-auto"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const navigate = useNavigate();

  const handleEdit = (announcementId) => {
    navigate(`/announcements/edit/${announcementId}`);
  };

  const handleAdd = () => {
    navigate("/announcements/add");
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 p-4">
            <Bell className="h-8 w-8 text-emerald-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 p-4">
              Announcements
            </h1>
          </div>
          {currentUser && userRole === "staff" && (
            <Button onClick={handleAdd} className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Announcement
            </Button>
          )}
        </div>
        {content}
      </main>
    </div>
  );
};

export default AnnouncementsPage;
