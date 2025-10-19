import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { SearchFilters } from '../components/SearchFilters';
import { Link } from 'react-router-dom';
import ItemCard from '../components/ItemCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import Badge from '../components/ui/Badge';
import { db } from '../firebase/config';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { normalizeFirestoreItem } from '../lib/utils';
import NotificationBell from '../components/NotificationBell';

// Constants for better maintainability
const INITIAL_FILTERS = {
  q: '',
  type: 'all',
  location: 'all',
  status: 'all'
};

const TAB_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'lost', label: 'Lost' },
  { value: 'found', label: 'Found' }
];

// Dynamic content based on active tab
const TAB_CONTENT = {
  all: {
    title: 'Lost & Found Feed',
    description: 'Browse through reported items and help reunite people with their belongings'
  },
  lost: {
    title: 'Lost Items Feed',
    description: 'Browse items people are searching for and help them find what they lost'
  },
  found: {
    title: 'Found Items Feed',
    description: 'Browse items that have been found and claim them if they belong to you'
  }
};

const FeedPage = () => {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [activeTab, setActiveTab] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch items from Firestore
  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const itemsQuery = query(
        collection(db, 'items'), 
        orderBy('date', 'desc')
      );
      
      const unsubscribe = onSnapshot(
        itemsQuery, 
        (snapshot) => {
          const fetchedItems = snapshot.docs.map((doc) => 
            normalizeFirestoreItem(doc.data() || {}, doc.id)
          );
          setItems(fetchedItems);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching items:', error);
          setError('Failed to load items. Please try again.');
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up items listener:', error);
      setError('Failed to connect to database.');
      setLoading(false);
    }
  }, []);

  // Filter items based on current filters and active tab
  const filteredItems = useMemo(() => {
    if (!items.length) return [];

    return items.filter((item) => {
      // Filter by tab (status)
      if (activeTab !== 'all' && item.kind.toLowerCase() !== activeTab) {
        return false;
      }
      
      // Filter by category
      if (filters.type !== 'all' && item.category.toLowerCase() !== filters.type) {
        return false;
      }
      
      // Filter by location
      if (filters.location !== 'all' && item.location !== filters.location) {
        return false;
      }
      
      // Filter by search query
      if (filters.q) {
        const searchTerm = filters.q.toLowerCase();
        const itemText = `${item.title} ${item.description}`.toLowerCase();
        if (!itemText.includes(searchTerm)) {
          return false;
        }
      }
      
      return true;
    });
  }, [items, filters, activeTab]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  // Handle tab changes
  const handleTabChange = useCallback((value) => {
    setActiveTab(value);
  }, []);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setActiveTab('all');
  }, []);

  // Get current tab content
  const currentTabContent = TAB_CONTENT[activeTab];

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading items...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 grid lg:grid-cols-[300px_1fr] gap-6 min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="space-y-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8 sticky top-20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Search & Filter</h3>
            <button
              onClick={handleResetFilters}
              className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Reset
            </button>
          </div>
          <SearchFilters 
            defaultValue={filters} 
            onChange={handleFiltersChange} 
          />
        </div>
      </aside>

      {/* Main Content */}
      <section className="space-y-6">
        {/* Header - Dynamic based on active tab */}
        <div className="flex items-center justify-between mt-8 mb-8">
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {currentTabContent.title}
            </h1>
            <p className="text-gray-600">
              {currentTabContent.description}
            </p>
          </div>
          <div className="flex items-center gap-4 mb-6">
            <NotificationBell />
            <Link 
              to="/items/new" 
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              Report an Item
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="w-full max-w-md mx-auto">
              {TAB_OPTIONS.map(({ value, label }) => (
                <TabsTrigger key={value} value={value}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            {TAB_OPTIONS.map(({ value }) => (
              <TabsContent key={value} value={value} />
            ))}
          </Tabs>
        </div>

        {/* Items Grid */}
        {filteredItems.length > 0 ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
            
            {/* Results Summary */}
            <div className="flex items-center justify-center py-6">
              <Badge variant="secondary" className="text-sm">
                {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
              </Badge>
            </div>
          </>
        ) : (
          <div className="bg-white border border-dashed border-gray-300 rounded-lg p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-500 mb-4">
              {items.length === 0 
                ? 'No items have been reported yet. Be the first to report a lost or found item!'
                : 'No items match your current filters. Try adjusting your search criteria.'
              }
            </p>
            {items.length === 0 && (
              <Link
                to="/items/new"
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Report First Item
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default FeedPage;
