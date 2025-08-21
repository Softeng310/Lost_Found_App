import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from "../firebase/config";
import { getIdToken } from "firebase/auth";

// Constants for better maintainability
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

const INITIAL_ITEM_STATE = {
  title: '',
  description: '',
  type: '',
  location: '',
  date: '',
  status: 'lost',
  image: null
};

const INITIAL_ERRORS_STATE = {};

const ItemReportForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [item, setItem] = useState(INITIAL_ITEM_STATE);
  const [errors, setErrors] = useState(INITIAL_ERRORS_STATE);
  const [preview, setPreview] = useState(null);

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setItem(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Image must be less than 5MB' }));
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'Please select a valid image file' }));
        return;
      }
    }

    setItem(prev => ({ ...prev, image: file || null }));

    // Clean up previous preview and set new one
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(file ? URL.createObjectURL(file) : null);
    
    // Clear image error
    if (errors.image) {
      setErrors(prev => ({ ...prev, image: '' }));
    }
  }, [preview, errors]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!item.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (item.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    }
    
    if (!item.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (item.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters long';
    }
    
    if (!item.type) {
      newErrors.type = 'Please select a category';
    }
    
    if (!item.location) {
      newErrors.location = 'Please select a location';
    }
    
    if (!item.date) {
      newErrors.date = 'Please select a date and time';
    } else {
      const selectedDate = new Date(item.date);
      const now = new Date();
      if (selectedDate > now) {
        newErrors.date = 'Date cannot be in the future';
      }
    }
    
    if (!item.image) {
      newErrors.image = 'Please upload an image';
    }
    
    return newErrors;
  }, [item]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('You must be logged in to post an item');
      }

      const idToken = await getIdToken(currentUser);
      const formData = new FormData();
      
      // Append form data
      Object.keys(item).forEach(key => {
        if (item[key] !== null) {
          formData.append(key, item[key]);
        }
      });

      const response = await fetch('http://localhost:5876/api/items', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`
        },
        body: formData
      });

      let responseData = null;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.warn('Failed to parse response as JSON:', parseError);
      }

      if (response.ok) {
        alert('Item reported successfully!');
        navigate(`/items/${responseData?.id || ''}`);
        handleReset();
      } else {
        const errorMessage = responseData?.message || `Failed to submit item (${response.status})`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(error.message || 'Network error — please try again');
    } finally {
      setLoading(false);
    }
  }, [item, validateForm, navigate, handleReset]);

  const handleReset = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    setItem(INITIAL_ITEM_STATE);
    setErrors(INITIAL_ERRORS_STATE);
  }, [preview]);

  const renderFieldError = (fieldName) => {
    return errors[fieldName] ? (
      <p className="text-red-500 text-sm mt-1">{errors[fieldName]}</p>
    ) : null;
  };

  const renderSelectField = (name, label, options, placeholder = 'Select') => (
    <div>
      <label className="block font-semibold mb-2">{label}</label>
      <select
        name={name}
        value={item[name]}
        onChange={handleChange}
        className={`w-full border rounded-lg px-3 py-2 transition-colors ${
          errors[name] ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
        } focus:outline-none focus:ring-1 focus:ring-emerald-500`}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value || option} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
      {renderFieldError(name)}
    </div>
  );

  const renderInputField = (name, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block font-semibold mb-2">{label}</label>
      <input
        type={type}
        name={name}
        value={item[name]}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2 transition-colors ${
          errors[name] ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
        } focus:outline-none focus:ring-1 focus:ring-emerald-500`}
      />
      {renderFieldError(name)}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto mt-8">
      {loading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-center font-semibold">
            Submitting item, please wait...
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-lg grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        {/* Left Column */}
        <div className="space-y-6">
          {renderSelectField('status', 'Type', [
            { value: 'lost', label: 'Lost' },
            { value: 'found', label: 'Found' }
          ])}
          
          {renderSelectField('type', 'Category', ITEM_CATEGORIES)}
          {renderSelectField('location', 'Location', LOCATIONS)}
          
          <div>
            <label className="block font-semibold mb-2">Date & Time</label>
            <input
              type="datetime-local"
              name="date"
              value={item.date}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 transition-colors ${
                errors.date ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
              } focus:outline-none focus:ring-1 focus:ring-emerald-500`}
            />
            {renderFieldError('date')}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Image Preview */}
          <div>
            <label className="block font-semibold mb-2">Photo</label>
            <div className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden hover:border-emerald-400 transition-colors">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="object-cover w-full h-full rounded-lg"
                />
              ) : (
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">📷</div>
                  <div className="text-sm">Click to upload image</div>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-2 w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 transition-colors"
            />
            {renderFieldError('image')}
          </div>

          {renderInputField('title', 'Title', 'text', 'e.g., Black iPhone 13 with green case')}
          
          <div>
            <label className="block font-semibold mb-2">Description</label>
            <textarea
              name="description"
              value={item.description}
              onChange={handleChange}
              placeholder="Add unique identifiers and more details about the item..."
              rows={4}
              className={`w-full border rounded-lg px-3 py-2 transition-colors resize-none ${
                errors.description ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
              } focus:outline-none focus:ring-1 focus:ring-emerald-500`}
            />
            {renderFieldError('description')}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ItemReportForm;
