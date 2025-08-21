import React, { useEffect, useState } from 'react';
import Input from './ui/Input';
import Label from './ui/Label';
import { Select, SelectItem } from './ui/Select';

// Constants matching ItemReportForm for consistency
const ITEM_CATEGORIES = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'documents', label: 'Documents' },
  { value: 'wallets', label: 'Wallets' },
  { value: 'keys/cards', label: 'Keys/Cards' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'other', label: 'Other' }
];

const LOCATIONS = [
  'OGGB',
  'Engineering Building',
  'Arts and Education Building',
  'Kate Edgar',
  'Law Building',
  'General Library',
  'Biology Building',
  'Science Centre',
  'Clock Tower',
  'Old Government House',
  'Hiwa Recreation Centre',
  'Bioengineering Building'
];

export function SearchFilters({
  defaultValue,
  onChange,
}) {
  const [state, setState] = useState(defaultValue);
  
  useEffect(() => onChange(state), [state, onChange]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="space-y-2">
        <Label htmlFor="q" className="text-sm font-medium text-gray-700">Search</Label>
        <Input
          id="q"
          placeholder="Try: wallet, iPhone, student card"
          value={state.q}
          onChange={(e) => setState({ ...state, q: e.target.value })}
          className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {/* Category and Location Filters - Single column layout for better text handling */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Category</Label>
          <Select value={state.type} onValueChange={(v) => setState({ ...state, type: v })}>
            <SelectItem value="all" className="text-sm">All Categories</SelectItem>
            {ITEM_CATEGORIES.map(({ value, label }) => (
              <SelectItem key={value} value={value} className="text-sm">
                {label}
              </SelectItem>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Location</Label>
          <Select
            value={state.location}
            onValueChange={(v) => setState({ ...state, location: v })}
          >
            <SelectItem value="all" className="text-sm">All Locations</SelectItem>
            {LOCATIONS.map((location) => (
              <SelectItem key={location} value={location} className="text-sm">
                {location}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
