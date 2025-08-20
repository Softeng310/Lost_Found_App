import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";

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
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {announcements.map((a) => (
          <div
            key={a.id}
            className="flex flex-col h-full bg-white border border-emerald-200 rounded-2xl shadow-md p-6 transition-transform hover:scale-[1.02] hover:shadow-lg"
          >
            <div className="flex items-center gap-2 mb-3">
              <Bell className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-emerald-700 tracking-tight line-clamp-2">
                {a.title}
              </h2>
            </div>
            <p className="text-gray-700 text-base mb-4 flex-1 whitespace-pre-line">
              {a.announcement}
            </p>
            {a.datePosted && (
              <div className="flex justify-end">
                <span className="inline-block bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full font-medium">
                  {new Date(a.datePosted).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
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
