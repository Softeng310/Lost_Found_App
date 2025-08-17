import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ItemCard from '../components/ItemCard';
import { getItemsClient } from '../lib/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import Badge from '../components/ui/Badge';

const FeedPage = () => {
  const [filters] = useState({ q: "", type: "all", location: "all" });
  const [tab, setTab] = useState("all");
  const [items, setItems] = useState(getItemsClient());

  useEffect(() => {
    const id = setInterval(() => setItems(getItemsClient()), 2500);
    return () => clearInterval(id);
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[320px_1fr] gap-8">
          {/* Left Sidebar */}
          <aside className="space-y-6">
          </aside>

          {/* Main Content */}
          <section className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">Lost & Found Feed</h2>
              <Link to="/items/new" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                Report an item
              </Link>
            </div>

            {/* Tabs */}
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid w-full max-w-xs grid-cols-3 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger value="all" className="text-sm font-medium">All</TabsTrigger>
                <TabsTrigger value="lost" className="text-sm font-medium">Lost</TabsTrigger>
                <TabsTrigger value="found" className="text-sm font-medium">Found</TabsTrigger>
              </TabsList>
              <TabsContent value="all" />
              <TabsContent value="lost" />
              <TabsContent value="found" />
            </Tabs>

            {/* Items Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>

            {/* Empty State */}
            {filtered.length === 0 && (
              <div className="rounded-lg border-0 bg-white text-gray-900 shadow-sm border-2 border-dashed border-gray-300 bg-white">
                <div className="p-6 pt-0 py-12 text-center">
                  <p className="text-gray-500 text-sm">No items match your filters. Try broadening your search.</p>
                </div>
              </div>
            )}

            {/* Item Count */}
            <div className="flex items-center justify-center py-6">
              <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-200">
                {filtered.length} items
              </Badge>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default FeedPage;
