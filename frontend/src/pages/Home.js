import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Search, MapPin, Bell, Plus } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white"> 
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center py-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Lost & Found Community
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with your community to find lost items and return found belongings. 
            Together we can make our campus a better place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/feed">
              <Button size="lg" className="gap-2">
                <Search className="h-5 w-5" />
                Browse Items
              </Button>
            </Link>
            <Link to="/items/new">
              <Button variant="outline" size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Report Item
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 py-16">
          <div className="text-center p-6">
            <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Find Lost Items</h3>
            <p className="text-gray-600">
              Search through reported lost items and connect with people who found them.
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Location Tracking</h3>
            <p className="text-gray-600">
              See where items were lost or found on an interactive map.
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Stay Updated</h3>
            <p className="text-gray-600">
              Get notifications about new items and updates on your reports.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-emerald-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-gray-600 mb-6">
            Join our community and help make a difference in your campus.
          </p>
          <Link to="/signup">
            <Button size="lg" className="gap-2">
              Create Account
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
