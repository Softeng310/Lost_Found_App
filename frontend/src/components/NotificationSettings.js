import React, { useState, useEffect } from 'react';
import { auth } from '../firebase/config';
import { getIdToken } from 'firebase/auth';

const CATEGORIES = ['Electronics', 'Clothing', 'Accessories', 'Documents', 'Keys', 'Bags', 'Other'];

function NotificationSettings() {
  const [keywords, setKeywords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn('No user logged in');
        return;
      }

      const idToken = await getIdToken(currentUser);
      const response = await fetch('http://localhost:5876/api/notifications/preferences', {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      const data = await response.json();
      setKeywords(data.keywords || []);
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const savePreferences = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert('You must be logged in to save preferences');
        return;
      }

      const idToken = await getIdToken(currentUser);
      const response = await fetch('http://localhost:5876/api/notifications/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ keywords, categories })
      });
      
      if (response.ok) {
        alert('Preferences saved successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Network error — please try again');
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const toggleCategory = (category) => {
    setCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Notification Settings</h2>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Keywords</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            placeholder="Add keyword (e.g., iPhone, wallet)"
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <button
            onClick={addKeyword}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {keywords.map(keyword => (
            <span
              key={keyword}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-2"
            >
              {keyword}
              <button onClick={() => removeKeyword(keyword)} className="text-blue-600 hover:text-blue-800">
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Categories</h3>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map(category => (
            <label key={category} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={categories.includes(category)}
                onChange={() => toggleCategory(category)}
                className="w-4 h-4"
              />
              <span>{category}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={savePreferences}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Preferences
      </button>
    </div>
  );
}

export default NotificationSettings;