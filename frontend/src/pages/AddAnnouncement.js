import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { db } from "../firebase/config";
import { collection, addDoc } from "firebase/firestore";
import { useStaffAuth } from "../hooks/useStaffAuth";
import { 
  AnnouncementForm, 
  AnnouncementPageHeader, 
  LoadingScreen 
} from "../components/announcements/AnnouncementForm";

const AddAnnouncementPage = () => {
  const [title, setTitle] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  const { currentUser, loading: authLoading, isStaff } = useStaffAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

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

  if (authLoading || !isStaff) {
    return <LoadingScreen message="Checking permissions..." />;
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <AnnouncementPageHeader
          title="Add New Announcement"
          icon={Bell}
          onBack={() => navigate("/announcements")}
        />
        <AnnouncementForm
          title={title}
          announcement={announcement}
          onTitleChange={setTitle}
          onAnnouncementChange={setAnnouncement}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/announcements")}
          submitText="Create Announcement"
          loading={loading}
          error={error}
        />
      </main>
    </div>
  );
};

export default AddAnnouncementPage;
