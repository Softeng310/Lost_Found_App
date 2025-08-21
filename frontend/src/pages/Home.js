import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Search, MapPin, Bell, Plus, Users, Shield, Heart } from 'lucide-react';

// Page content constants - easy to update without digging through JSX
const HERO_TITLE = 'Lost & Found Community';
const HERO_SUBTITLE = 'Connect with your community to find lost items and return found belongings. Together we can make our campus a better place.';

// Feature highlights - what makes our platform special
const FEATURES = [
  {
    icon: Search,
    title: 'Find Lost Items',
    description: 'Search through reported lost items and connect with people who found them.',
    color: 'emerald'
  },
  {
    icon: MapPin,
    title: 'Location Tracking',
    description: 'See where items were lost or found on an interactive map.',
    color: 'blue'
  },
  {
    icon: Bell,
    title: 'Stay Updated',
    description: 'Get notifications about new items and updates on your reports.',
    color: 'purple'
  }
];

// Community stats - these could be dynamic in the future
const STATS = [
  { label: 'Items Reunited', value: '500+', icon: Heart },
  { label: 'Active Users', value: '2,000+', icon: Users },
  { label: 'Success Rate', value: '85%', icon: Shield }
];

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-emerald-50">
      <main className="container mx-auto px-4 py-8">
        {/* Hero section - main call to action */}
        <section className="text-center py-20">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              {HERO_TITLE}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              {HERO_SUBTITLE}
            </p>
            {/* Action buttons - primary user flows */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/feed">
                <Button size="lg" className="gap-3 text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-200">
                  <Search className="h-6 w-6" />
                  Browse Items
                </Button>
              </Link>
              <Link to="/items/new">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="gap-3 text-lg px-8 py-4 border-2 hover:bg-emerald-50 transition-all duration-200"
                >
                  <Plus className="h-6 w-6" />
                  Report Item
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats section - build trust with numbers */}
        <section className="py-16">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {STATS.map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
                <div className="text-gray-600 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features section - explain how it works */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform makes it easy to report, search, and connect with your community
            </p>
          </div>
          
          {/* Feature cards with hover effects */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {FEATURES.map(({ icon: Icon, title, description, color }) => (
              <div key={title} className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                <div className={`bg-${color}-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6`}>
                  <Icon className={`h-10 w-10 text-${color}-600`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Call to action - encourage signups */}
        <section className="py-20">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to get started?
            </h2>
            <p className="text-xl mb-8 text-emerald-100 max-w-2xl mx-auto">
              Join our community and help make a difference in your campus. Every item reunited is a story of hope and community.
            </p>
            {/* CTA buttons with inverted colors */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button 
                  size="lg" 
                  className="gap-3 text-lg px-8 py-4 bg-white text-emerald-700 hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Create Account
                </Button>
              </Link>
              <Link to="/feed">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="gap-3 text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-emerald-700 transition-all duration-200"
                >
                  Browse Items
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Trust indicators - why users should trust us */}
        <section className="py-16 text-center">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-semibold text-gray-900 mb-8">
              Trusted by the Community
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Security focus */}
              <div className="p-6">
                <div className="text-4xl mb-4">🔒</div>
                <h4 className="font-semibold text-gray-900 mb-2">Secure & Private</h4>
                <p className="text-gray-600">Your information is protected with enterprise-grade security</p>
              </div>
              {/* Performance focus */}
              <div className="p-6">
                <div className="text-4xl mb-4">⚡</div>
                <h4 className="font-semibold text-gray-900 mb-2">Fast & Reliable</h4>
                <p className="text-gray-600">Built for speed and reliability to serve you when it matters most</p>
              </div>
              {/* Community focus */}
              <div className="p-6">
                <div className="text-4xl mb-4">🤝</div>
                <h4 className="font-semibold text-gray-900 mb-2">Community Driven</h4>
                <p className="text-gray-600">Created by students, for students, with community values at heart</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
