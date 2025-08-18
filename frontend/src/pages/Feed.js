import React, { useEffect, useMemo, useState } from 'react';
import { SearchFilters } from '../components/SearchFilters';
import { Link } from 'react-router-dom';
import ItemCard from '../components/ItemCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import Badge from '../components/ui/Badge';
import { db } from '../firebase/config';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

const FeedPage = () => {
  const [filters, setFilters] = useState({ q: "", type: "all", location: "all", status: "all" });
  const [tab, setTab] = useState("all");
  const [items, setItems] = useState([]);

  useEffect(() => {
    const itemsQuery = query(collection(db, 'items'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(itemsQuery, (snapshot) => {
      const nextItems = snapshot.docs.map((doc) => {
        const data = doc.data() || {};
        // Normalize Firestore fields to UI model
        const imageUrl = data.imageUrl || data.imageURL || '/placeholder.svg';
        const kindRaw = data.kind || data.status || '';
        const typeRaw = data.category || data.type || '';
        const category = String(typeRaw).toLowerCase() === 'accessories' ? 'accessory' : String(typeRaw).toLowerCase();
        const postedBy = data.postedBy;
        let reporter = data.reporter;
        if (!reporter) {
          if (postedBy && typeof postedBy === 'object' && postedBy.id) {
            reporter = { name: postedBy.id, trust: false };
          } else if (typeof postedBy === 'string') {
            const parts = postedBy.split('/');
            reporter = { name: parts[parts.length - 1] || 'Unknown', trust: false };
          } else {
            reporter = { name: 'Unknown', trust: false };
          }
        }
        return {
          id: doc.id,
          kind: String(kindRaw || '').toLowerCase(),
          category,
          title: String(data.title || ''),
          description: String(data.description || ''),
          imageUrl,
          date: data.date?.toDate ? data.date.toDate().toISOString() : (data.date || new Date().toISOString()),
          location: data.location || 'Unknown',
          reporter,
        };
      });
      setItems(nextItems);
    });
    return () => unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (tab !== "all" && it.kind.toLowerCase() !== tab) return false;
      if (filters.type !== "all" && it.category.toLowerCase() !== filters.type) return false;
      if (filters.location !== "all" && it.location !== filters.location) return false;
      if (filters.q && !`${it.title} ${it.description}`.toLowerCase().includes(filters.q.toLowerCase())) return false;
      return true;
    });
  }, [items, filters, tab]);

  return (
    <div className="container mx-auto px-4 py-6 grid lg:grid-cols-[300px_1fr] gap-6 min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="space-y-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="font-semibold mb-2">Search & Filter</div>
          <SearchFilters defaultValue={filters} onChange={setFilters} />
        </div>
      </aside>

      {/* Main Content */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Lost & Found Feed</h2>
          <Link to="/items/new" className="text-emerald-700 hover:underline text-sm">
            Report an item
          </Link>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full max-w-sm grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="lost">Lost</TabsTrigger>
            <TabsTrigger value="found">Found</TabsTrigger>
          </TabsList>
          <TabsContent value="all" />
          <TabsContent value="lost" />
          <TabsContent value="found" />
        </Tabs>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="bg-white border border-dashed rounded-lg p-10 text-center text-gray-400">
            No items match your filters. Try broadening your search.
          </div>
        )}

        <div className="flex items-center justify-center py-4">
          <Badge variant="secondary">{`${filtered.length} items`}</Badge>
        </div>
      </section>
    </div>
  );
}

export default FeedPage;
