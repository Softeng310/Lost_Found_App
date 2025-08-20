import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from "../firebase/config";
import { getIdToken } from "firebase/auth";

const ItemReportForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [item, setItem] = useState({
    title: '',
    description: '',
    type: '',
    location: '',
    date: '',
    status: 'lost',
    image: null
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setItem({ ...item, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setItem({ ...item, image: e.target.files[0] });
  };

  const validate = () => {
    let errs = {};
    if (!item.title) errs.title = "Title is required.";
    if (!item.description) errs.description = "Description is required.";
    if (!item.type) errs.type = "Type is required.";
    if (!item.location) errs.location = "Location is required.";
    if (!item.date) errs.date = "Date is required.";
    if (!item.image) errs.image = "Image is required.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("title", item.title);
    formData.append("description", item.description);
    formData.append("type", item.type);
    formData.append("location", item.location);
    formData.append("date", item.date);
    formData.append("status", item.status);
    formData.append("image", item.image);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("You must be logged in to post an item");
        setLoading(false);
        return;
      }

      const idToken = await getIdToken(currentUser);

      const response = await fetch('http://localhost:5876/api/items', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setLoading(false);
        navigate(`/items/${data.id}`);
        alert("Item reported successfully!");
        setItem({
          title: '',
          description: '',
          type: '',
          location: '',
          date: '',
          status: 'lost',
          image: null
        });
      } else {
        console.error("❌ Error submitting form:", data.message);
        setLoading(false);
      }
    } catch (error) {
      console.error("🚨 Network error:", error);
      setLoading(false);
    }
  };

  return (
    <>
      {loading && (
        <p className="text-blue-600 text-center font-semibold">
          Submitting item, please wait...
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="max-w-5xl mx-auto mt-8 bg-white p-8 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Left column */}
        <div className="space-y-4">
          <div>
            <label className="block font-semibold">Type</label>
            <select
              name="status"
              value={item.status}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            >
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold">Category</label>
            <select
              name="type"
              value={item.type}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            >
              <option value="">Select</option>
              <option value="electronics">Electronics</option>
              <option value="stationery">Stationery</option>
              <option value="clothing">Clothing</option>
              <option value="documents">Documents</option>
              <option value="wallets">Wallets</option>
              <option value="keys/cards">Keys/Cards</option>
              <option value="accessories">Accessories</option>
              <option value="other">Other</option>
            </select>
            {errors.type && <p className="text-red-500 text-sm">{errors.type}</p>}
          </div>

          <div>
            <label className="block font-semibold">Location</label>
            <select
              name="location"
              value={item.location}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            >
              <option value="">Select</option>
              <option value="OGGB">OGGB</option>
              <option value="Engineering Building">Engineering Building</option>
              <option value="Arts and Education Building">Arts and Education Building</option>
              <option value="Kate Edgar">Kate Edgar</option>
              <option value="Law Building">Law Building</option>
              <option value="General Library">General Library</option>
              <option value="Biology Building">Biology Building</option>
              <option value="Science Centre">Science Centre</option>
              <option value="Clock Tower">Clock Tower</option>
              <option value="Old Government House">Old Government House</option>
              <option value="Hiwa Recreation Centre">Hiwa Recreation Centre</option>
              <option value="Bioengineering Building">Bioengineering Building</option>
            </select>
            {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}
          </div>

          <div className="flex flex-col">
            <label className="font-medium text-sm mb-1">Date & Time</label>
            <input
              type="datetime-local"
              name="date"
              value={item.date}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 text-sm w-full"
            />
            {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
            {item.image ? (
              <img
                src={URL.createObjectURL(item.image)}
                alt="Preview"
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="text-gray-500">Image Preview</div>
            )}
          </div>

          <div>
            <label className="block font-semibold">Title</label>
            <input
              type="text"
              name="title"
              value={item.title}
              onChange={handleChange}
              placeholder="e.g., Black iPhone 13 with green case"
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
          </div>

          <div>
            <label className="block font-semibold">Description</label>
            <textarea
              name="description"
              value={item.description}
              onChange={handleChange}
              placeholder="Add unique identifiers/more details on where the item was found."
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
          </div>

          <div>
            <label className="block font-semibold mb-1">Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full border border-gray-300 px-4 py-2 rounded text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
            {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <button
              type="reset"
              onClick={() =>
                setItem({
                  title: '',
                  description: '',
                  type: '',
                  location: '',
                  date: '',
                  status: 'lost',
                  image: null
                })
              }
              className="bg-gray-200 text-black px-4 py-2 rounded"
            >
              Reset
            </button>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default ItemReportForm;
