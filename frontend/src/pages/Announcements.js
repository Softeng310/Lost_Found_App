import React from 'react';
import Navigation from '../components/Navigation';
import { Bell } from 'lucide-react';
import { getAnnouncements } from '../lib/announcements-mock-data';

const AnnouncementsPage = () => {
  const announcements = getAnnouncements();
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Bell className="h-8 w-8 text-emerald-600" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Announcements</h1>
        </div>
        <div className="space-y-6">
          {announcements.map((a) => (
            <div key={a.id} className="bg-emerald-50 border border-emerald-100 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-gray-800">{a.title}</h2>
                <span className="text-xs text-gray-500">{a.date}</span>
              </div>
              <p className="text-gray-700 mb-2">{a.content}</p>
              <div className="text-sm text-gray-500">By {a.author}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AnnouncementsPage;


