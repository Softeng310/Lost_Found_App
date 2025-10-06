import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bell } from "lucide-react";
import { db } from "../firebase/config";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { useStaffAuth } from "../hooks/useStaffAuth";
import { 
  AnnouncementForm, 
  AnnouncementPageHeader, 
  LoadingScreen 
} from "../components/announcements/AnnouncementForm";

const EditAnnouncementPage = () => {
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  const { currentUser, loading: authLoading, isStaff } = useStaffAuth();

  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!id) {
        navigate("/announcements");
        return;
      }

      try {
        const announcementDoc = await getDoc(doc(db, "announcements", id));
        if (announcementDoc.exists()) {
          const data = announcementDoc.data();
          setTitle(data.title || "");
          setAnnouncement(data.announcement || "");
        } else {
          setError("Announcement not found");
          setTimeout(() => navigate("/announcements"), 2000);
        }
      } catch (err) {
        console.error("Error fetching announcement:", err);
        setError("Failed to load announcement");
      } finally {
        setFetchLoading(false);
      }
    };

    if (currentUser && isStaff) {
      fetchAnnouncement();
    }
  }, [id, currentUser, isStaff, navigate]);

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
      await updateDoc(doc(db, "announcements", id), {
        title: title.trim(),
        announcement: announcement.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid,
      });

      console.log("✅ Announcement updated successfully");
      navigate("/announcements");
    } catch (err) {
      console.error("❌ Error updating announcement:", err);
      setError("Failed to update announcement. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, "announcements", id));
      console.log("✅ Announcement deleted successfully");
      navigate("/announcements");
    } catch (err) {
      console.error("❌ Error deleting announcement:", err);
      setError("Failed to delete announcement. Please try again.");
      setLoading(false);
    }
  };

  if (authLoading || !isStaff || fetchLoading) {
    return <LoadingScreen message={fetchLoading ? "Loading..." : "Checking permissions..."} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <AnnouncementPageHeader
          title="Edit Announcement"
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
          submitText="Save Changes"
          loading={loading}
          error={error}
          showDelete={true}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
};

export default EditAnnouncementPage;
