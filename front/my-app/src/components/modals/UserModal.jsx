import { useState, useEffect } from "react";
import { X } from "lucide-react";

const UserModal = ({ isOpen, onClose, user, onSubmit, isLoading }) => {
  const [formData, setFormData]       = useState({ name: "", email: "", password: "", image: null });
  const [previewImage, setPreviewImage] = useState(null);

  // Fix: added isOpen to dependencies so the form resets when the modal
  // is closed and reopened for a new user — previously if user was null
  // both times the effect didn't re-run and stale data persisted.
  useEffect(() => {
    if (!isOpen) return;
    if (user) {
      setFormData({ name: user.name ?? "", email: user.email ?? "", password: "", image: null });
      setPreviewImage(user.image ?? null);
    } else {
      setFormData({ name: "", email: "", password: "", image: null });
      setPreviewImage(null);
    }
  }, [isOpen, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Fix: revoke the previous object URL before creating a new one
    // to prevent memory leaks when the user swaps the image multiple times.
    if (previewImage && !user?.image) {
      URL.revokeObjectURL(previewImage);
    }

    setFormData((prev) => ({ ...prev, image: file }));
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append("name",  formData.name);
    submitData.append("email", formData.email);
    if (formData.password) submitData.append("password", formData.password);
    if (formData.image)    submitData.append("image",    formData.image);
    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {user ? "Edit User" : "Add User"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {user ? "Update user details" : "Create a new user account"}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {/* Avatar preview */}
          {previewImage && (
            <div className="flex justify-center">
              <img
                src={previewImage}
                alt="Preview"
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
              />
            </div>
          )}

          {/* Image upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Profile Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isLoading}
              className="w-full text-sm text-gray-600 border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-900 file:text-white"
            />
            <p className="text-xs text-gray-400 mt-1">Leave empty to keep current image</p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Password{" "}
              {user
                ? <span className="normal-case font-normal text-gray-400">(leave empty to keep current)</span>
                : <span className="text-red-400">*</span>
              }
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!user}
              disabled={isLoading}
              placeholder={user ? "Leave empty to keep current password" : ""}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Saving…" : user ? "Save Changes" : "Create User"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;