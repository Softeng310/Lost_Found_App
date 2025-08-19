import React, { useEffect, useState } from 'react';
import Input from './ui/Input';
import Label from './ui/Label';
import { Select, SelectItem } from './ui/Select';
import { locations } from '../lib/mock-data';

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

      {/* Category and Location Filters */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Category</Label>
          <Select value={state.type} onValueChange={(v) => setState({ ...state, type: v })}>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="electronics">Electronics</SelectItem>
            <SelectItem value="apparel">Apparel</SelectItem>
            <SelectItem value="accessory">Accessory</SelectItem>
            <SelectItem value="card">Card/ID</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Location</Label>
          <Select
            value={state.location}
            onValueChange={(v) => setState({ ...state, location: v })}
          >
            <SelectItem value="all">All</SelectItem>
            {Object.values(locations).map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
