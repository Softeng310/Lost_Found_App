import React from "react";
import Navigation from "../components/Navigation";
import { Bell } from "lucide-react";

import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "announcements"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
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
      <div className="space-y-6">
        {announcements.map((a) => (
          <div
            key={a.id}
            className="bg-emerald-50 border border-emerald-100 rounded-lg p-6 shadow-sm"
          >
            <p className="text-gray-800 text-lg">{a.announcement}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Bell className="h-8 w-8 text-emerald-600" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Announcements
          </h1>
        </div>
        {content}
      </main>
    </div>
  );
};

export default AnnouncementsPage;
