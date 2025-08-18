import React, { useState } from 'react';

const ItemReportForm = () => {
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
  const errs = validate();
  if (Object.keys(errs).length > 0) {
    setErrors(errs);
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

  // 🔍 ADD THESE:
  console.log("📤 Submitting item:", item);
  console.log("🕑 Parsed date:", new Date(item.date));
  console.log("📦 FormData preview:");
  for (let pair of formData.entries()) {
    console.log(`${pair[0]}:`, pair[1]);
  }

  try {
    const response = await fetch('http://localhost:5876/api/items', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
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
      console.error("❌ Error submitting form");
    }
  } catch (error) {
    console.error("🚨 Network error:", error);
  }
};


  return (
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
            <option value="pet">Pet</option>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="documents">Documents</option>
            <option value="accessories">Accessories</option>
            <option value="other">Other</option>
          </select>
          {errors.type && <p className="text-red-500 text-sm">{errors.type}</p>}
        </div>

        <div>
          <label className="block font-semibold">Location</label>
          <input
            type="text"
            name="location"
            value={item.location}
            onChange={handleChange}
            placeholder="e.g., OGGB Level 1"
            className="w-full border border-gray-300 p-2 rounded"
          />
          {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}
        </div>

        <div className="flex flex-col">
          <label className="font-medium text-sm mb-1">Date & Time</label>
          <input
            type="datetime-local"
            value={item.date}
            onChange={(e) => setItem({ ...item, date: e.target.value })}

            className="border rounded-lg px-3 py-2 text-sm w-full"
            required
          />
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
            placeholder="Add unique identifiers, color, stickers, etc."
            className="w-full border border-gray-300 p-2 rounded"
          />
          {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
        </div>

        <div>
          <label className="block font-semibold">Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block"
          />
          {errors.image && <p className="text-red-500 text-sm">{errors.image}</p>}
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
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
            Submit
          </button>
        </div>
      </div>
    </form>
  );
};

export default ItemReportForm;
