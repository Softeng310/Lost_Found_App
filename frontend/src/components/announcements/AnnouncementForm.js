import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import Input from "../ui/Input";
import Label from "../ui/Label";

/**
 * Reusable form component for announcement creation and editing
 * Reduces code duplication between Add and Edit pages
 */
export const AnnouncementForm = ({
  title,
  announcement,
  onTitleChange,
  onAnnouncementChange,
  onSubmit,
  onCancel,
  onBack,
  submitText = "Submit",
  loading = false,
  error = null,
  showDelete = false,
  onDelete = null,
  deleteLoading = false,
}) => {
  return (
    <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="mb-4">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter announcement title"
          maxLength={100}
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          {title.length}/100 characters
        </p>
      </div>

      <div className="mb-6">
        <Label htmlFor="announcement">Announcement</Label>
        <textarea
          id="announcement"
          value={announcement}
          onChange={(e) => onAnnouncementChange(e.target.value)}
          placeholder="Enter announcement details"
          rows={8}
          maxLength={1000}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          {announcement.length}/1000 characters
        </p>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Saving..." : submitText}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>

      {showDelete && onDelete && (
        <DeleteSection 
          onDelete={onDelete} 
          loading={loading || deleteLoading} 
        />
      )}
    </form>
  );
};

/**
 * Delete section component for edit page
 */
const DeleteSection = ({ onDelete, loading }) => {
  const [showConfirm, setShowConfirm] = React.useState(false);

  return (
    <div className="border-t pt-4 mt-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Danger Zone</h3>
      {!showConfirm ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowConfirm(true)}
          disabled={loading}
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          Delete Announcement
        </Button>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800 mb-3">
            Are you sure? This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={onDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Deleting..." : "Yes, Delete"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Page header component with back button and title
 */
export const AnnouncementPageHeader = ({ title, icon: Icon, onBack }) => {
  return (
    <div className="mb-6">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Announcements
      </Button>
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-8 w-8 text-emerald-600" />}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{title}</h1>
      </div>
    </div>
  );
};

/**
 * Loading screen component
 */
export const LoadingScreen = ({ message = "Loading..." }) => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-gray-500">{message}</p>
    </div>
  );
};
