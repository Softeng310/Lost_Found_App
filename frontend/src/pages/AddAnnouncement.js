import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ArrowLeft } from "lucide-react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase/config";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { Button } from "../components/ui/button";
import Input from "../components/ui/Input";
import Label from "../components/ui/Label";

const AddAnnouncementPage = () => {
  const [title, setTitle] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();

  // Check if user is staff
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const role = userDoc.data().role;
            setUserRole(role);
            // Redirect if not staff
            if (role !== "staff") {
              navigate("/announcements");
            }
          } else {
            navigate("/announcements");
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
          navigate("/announcements");
        }
      } else {
        // Redirect if not logged in
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (!title.trim()) {
      setError("Please enter a title");
      setLoading(false);
      return;
    }

    if (!announcement.trim()) {
      setError("Please enter an announcement");
      setLoading(false);
      return;
    }

    try {
      // Add announcement to Firestore
      await addDoc(collection(db, "announcements"), {
        title: title.trim(),
        announcement: announcement.trim(),
        datePosted: new Date().toISOString(),
        postedBy: currentUser.uid,
        postedByEmail: currentUser.email,
      });

      console.log("✅ Announcement created successfully");
      navigate("/announcements");
    } catch (err) {
      console.error("❌ Error creating announcement:", err);
      setError("Failed to create announcement. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Don't render form until we verify the user is staff
  if (!currentUser || userRole !== "staff") {
    return <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-gray-500">Checking permissions...</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/announcements")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Announcements
          </Button>
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-emerald-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Add New Announcement
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter announcement title"
              maxLength={100}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {title.length}/100 characters
            </p>
          </div>

          <div className="mb-6">
            <Label htmlFor="announcement">Announcement</Label>
            <textarea
              id="announcement"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Enter announcement details"
              rows={8}
              maxLength={1000}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {announcement.length}/1000 characters
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Creating..." : "Create Announcement"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/announcements")}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AddAnnouncementPage;
